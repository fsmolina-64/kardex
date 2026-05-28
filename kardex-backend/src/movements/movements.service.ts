import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, MovementStatus, Prisma } from '@prisma/client';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    type?: MovementType; status?: MovementStatus;
    warehouseId?: string; projectId?: string;
    from?: string; to?: string;
    page?: number; limit?: number;
  }) {
    const { type, status, warehouseId, projectId, from, to, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MovementWhereInput = {
      ...(type && { type }),
      ...(status && { status }),
      ...(warehouseId && { warehouseId }),
      ...(projectId && { projectId }),
      ...(from || to ? {
        movementDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.movement.findMany({
        where, skip, take: limit,
        include: {
          warehouse: true,
          warehouseDest: true,
          supplier: true,
          client: true,
          project: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, fullName: true, email: true } },
          details: { include: { product: { include: { unit: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movement.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
      include: {
        warehouse: true,
        warehouseDest: true,
        supplier: true,
        client: true,
        project: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, fullName: true, email: true } },
        details: { include: { product: { include: { unit: true, category: true } } } },
      },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return movement;
  }

  async createEntry(data: {
    warehouseId: string; supplierId?: string;
    notes?: string; documentType?: string; documentNumber?: string;
    movementDate?: string; userId: string; projectId?: string;
    details: {
      productId: string; quantity: number; unitCost: number;
      batchNumber?: string; expiryDate?: string;
    }[];
  }) {
    return this.createMovement({ ...data, type: MovementType.ENTRADA });
  }

  async createExit(data: {
    warehouseId: string; clientId?: string;
    notes?: string; documentType?: string; documentNumber?: string;
    movementDate?: string; userId: string; projectId?: string;
    details: { productId: string; quantity: number; }[];
  }) {
    for (const detail of data.details) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: detail.productId, warehouseId: data.warehouseId } },
      });
      if (!inventory || Number(inventory.quantity) < detail.quantity)
        throw new BadRequestException(`Stock insuficiente para el producto ${detail.productId}`);
      (detail as any).unitCost = Number(inventory.avgCost);
    }
    return this.createMovement({ ...data, type: MovementType.SALIDA });
  }

  async createTransfer(data: {
    warehouseId: string; warehouseDestId: string;
    notes?: string; documentNumber?: string;
    movementDate?: string; userId: string; projectId?: string;
    details: { productId: string; quantity: number; unitCost: number; }[];
  }) {
    if (data.warehouseId === data.warehouseDestId)
      throw new BadRequestException('Bodega origen y destino no pueden ser la misma');
    for (const detail of data.details) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: detail.productId, warehouseId: data.warehouseId } },
      });
      if (!inventory || Number(inventory.quantity) < detail.quantity)
        throw new BadRequestException(`Stock insuficiente para el producto ${detail.productId}`);
    }
    return this.createMovement({ ...data, type: MovementType.TRASLADO });
  }

  async createAdjustment(data: {
    warehouseId: string; notes?: string; documentNumber?: string;
    movementDate?: string; userId: string; projectId?: string;
    type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
    details: { productId: string; quantity: number; unitCost: number; }[];
  }) {
    return this.createMovement({ ...data, type: data.type as MovementType });
  }

  // NUEVO: Consumo de material en obra
  async createConsumo(data: {
    warehouseId: string; projectId: string;
    notes?: string; documentNumber?: string;
    movementDate?: string; userId: string;
    details: { productId: string; quantity: number; }[];
  }) {
    // projectId obligatorio
    if (!data.projectId) throw new BadRequestException('projectId es obligatorio para CONSUMO_OBRA');

    const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundException('Obra no encontrada');

    // Validar stock y tomar costo promedio automático
    for (const detail of data.details) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: detail.productId, warehouseId: data.warehouseId } },
      });
      if (!inventory || Number(inventory.quantity) < detail.quantity)
        throw new BadRequestException(`Stock insuficiente para el producto ${detail.productId}`);
      (detail as any).unitCost = Number(inventory.avgCost);
    }

    return this.createMovement({ ...data, type: MovementType.CONSUMO_OBRA });
  }

  // NUEVO: Devolución de material sobrante de obra a bodega
  async createDevolucionObra(data: {
    warehouseId: string; projectId: string;
    notes?: string; documentNumber?: string;
    movementDate?: string; userId: string;
    details: { productId: string; quantity: number; unitCost: number; }[];
  }) {
    if (!data.projectId) throw new BadRequestException('projectId es obligatorio para DEVOLUCION_OBRA');

    const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundException('Obra no encontrada');

    return this.createMovement({ ...data, type: MovementType.DEVOLUCION_OBRA });
  }

  async cancel(id: string) {
    const movement = await this.findOne(id);
    if (movement.status === MovementStatus.CANCELLED)
      throw new BadRequestException('El movimiento ya está cancelado');
    if (movement.status === MovementStatus.CONFIRMED)
      throw new BadRequestException('No se puede cancelar un movimiento confirmado');
    return this.prisma.movement.update({
      where: { id },
      data: { status: MovementStatus.CANCELLED },
    });
  }

  private async createMovement(data: any) {
    const referenceNumber = await this.generateReferenceNumber(data.type);

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.movement.create({
        data: {
          referenceNumber,
          type: data.type,
          status: MovementStatus.CONFIRMED,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          warehouseId: data.warehouseId,
          warehouseDestId: data.warehouseDestId,
          supplierId: data.supplierId,
          clientId: data.clientId,
          projectId: data.projectId,
          userId: data.userId,
          notes: data.notes,
          movementDate: data.movementDate ? new Date(data.movementDate) : new Date(),
        },
      });

      for (const detail of data.details) {
        const totalCost = detail.quantity * detail.unitCost;

        const movementDetail = await tx.movementDetail.create({
          data: {
            movementId: movement.id,
            productId: detail.productId,
            quantity: detail.quantity,
            unitCost: detail.unitCost,
            totalCost,
            batchNumber: detail.batchNumber,
            expiryDate: detail.expiryDate ? new Date(detail.expiryDate) : null,
          },
        });

        await this.updateInventoryAndKardex(tx, {
          movementDetailId: movementDetail.id,
          productId: detail.productId,
          warehouseId: data.warehouseId,
          warehouseDestId: data.warehouseDestId,
          type: data.type,
          quantity: detail.quantity,
          unitCost: detail.unitCost,
          totalCost,
          date: movement.movementDate,
        });
      }

      return tx.movement.findUnique({
        where: { id: movement.id },
        include: {
          details: { include: { product: { include: { unit: true } } } },
          warehouse: true,
          warehouseDest: true,
          project: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  private async updateInventoryAndKardex(tx: any, data: {
    movementDetailId: string; productId: string;
    warehouseId: string; warehouseDestId?: string;
    type: MovementType; quantity: number; unitCost: number;
    totalCost: number; date: Date;
  }) {
    const entryTypes = ['ENTRADA', 'AJUSTE_POSITIVO', 'DEVOLUCION_VENTA', 'DEVOLUCION_OBRA'];
    const exitTypes  = ['SALIDA', 'AJUSTE_NEGATIVO', 'DEVOLUCION_COMPRA', 'CONSUMO_OBRA'];

    const isEntry    = entryTypes.includes(data.type as string);
    const isExit     = exitTypes.includes(data.type as string);
    const isTransfer = data.type === MovementType.TRASLADO;

    if (isEntry || isTransfer) {
      const targetWarehouseId = isTransfer ? data.warehouseDestId! : data.warehouseId;
      await this.upsertInventory(tx, data.productId, targetWarehouseId, data.quantity, data.unitCost, true);
      await this.createKardexEntry(tx, { ...data, warehouseId: targetWarehouseId, isEntry: true });
    }

    if (isExit || isTransfer) {
      await this.upsertInventory(tx, data.productId, data.warehouseId, data.quantity, data.unitCost, false);
      await this.createKardexEntry(tx, { ...data, isEntry: false });
    }
  }

  private async upsertInventory(tx: any, productId: string, warehouseId: string, quantity: number, unitCost: number, isEntry: boolean) {
    const existing = await tx.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (existing) {
      const newQty = isEntry
        ? Number(existing.quantity) + quantity
        : Number(existing.quantity) - quantity;
      const newAvgCost = isEntry
        ? (Number(existing.quantity) * Number(existing.avgCost) + quantity * unitCost) / newQty
        : Number(existing.avgCost);
      await tx.inventory.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { quantity: newQty, avgCost: newAvgCost },
      });
    } else {
      await tx.inventory.create({
        data: { productId, warehouseId, quantity, avgCost: unitCost },
      });
    }
  }

  private async createKardexEntry(tx: any, data: any) {
    const inventory = await tx.inventory.findUnique({
      where: { productId_warehouseId: { productId: data.productId, warehouseId: data.warehouseId } },
    });
    const balanceQty   = inventory ? Number(inventory.quantity) : 0;
    const balanceCost  = inventory ? Number(inventory.avgCost) : data.unitCost;
    const balanceTotal = balanceQty * balanceCost;

    await tx.kardex.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementDetailId: data.movementDetailId,
        movementType: data.type,
        inQuantity:  data.isEntry ? data.quantity  : null,
        inUnitCost:  data.isEntry ? data.unitCost  : null,
        inTotal:     data.isEntry ? data.totalCost : null,
        outQuantity: !data.isEntry ? data.quantity  : null,
        outUnitCost: !data.isEntry ? data.unitCost  : null,
        outTotal:    !data.isEntry ? data.totalCost : null,
        balanceQuantity: balanceQty,
        balanceUnitCost: balanceCost,
        balanceTotal,
        date: data.date,
      },
    });
  }

  private async generateReferenceNumber(type: MovementType): Promise<string> {
    const prefixes: Record<string, string> = {
      ENTRADA:          'ENT',
      SALIDA:           'SAL',
      TRASLADO:         'TRA',
      AJUSTE_POSITIVO:  'AJP',
      AJUSTE_NEGATIVO:  'AJN',
      DEVOLUCION_COMPRA:'DVC',
      DEVOLUCION_VENTA: 'DVV',
      CONSUMO_OBRA:     'CON',
      DEVOLUCION_OBRA:  'DVO',
    };
    const prefix = prefixes[type] || 'MVT';
    const count  = await this.prisma.movement.count({ where: { type } });
    return `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
}