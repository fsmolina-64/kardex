import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string; categoryId?: string;
    isActive?: boolean; page?: number; limit?: number;
  }) {
    const { search, categoryId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { barcode: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, skip, take: limit,
        include: {
          category: true,
          unit: true,
          inventory: { include: { warehouse: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        inventory: { include: { warehouse: true } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(data: any) {
    const exists = await this.prisma.product.findUnique({ where: { code: data.code } });
    if (exists) throw new ConflictException('Ya existe un producto con ese código');
    if (data.barcode) {
      const barcodeExists = await this.prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (barcodeExists) throw new ConflictException('Ya existe un producto con ese código de barras');
    }
    if (!data.barcode) delete data.barcode;
    if (!data.description) delete data.description;
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    if (!data.barcode) delete data.barcode;
    if (!data.description) delete data.description;
    return this.prisma.product.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async permanentDelete(id: string) {
    await this.findOne(id);

    // Verificar si tiene movimientos registrados
    const movementCount = await this.prisma.movementDetail.count({
      where: { productId: id },
    });

    if (movementCount > 0)
      throw new BadRequestException(
        'No se puede eliminar este producto porque tiene movimientos registrados en el sistema. Solo puedes desactivarlo.'
      );

    // Verificar kardex
    const kardexCount = await this.prisma.kardex.count({
      where: { productId: id },
    });

    if (kardexCount > 0)
      throw new BadRequestException(
        'No se puede eliminar este producto porque tiene registros en el kardex.'
      );

    // Eliminar inventario primero
    await this.prisma.inventory.deleteMany({ where: { productId: id } });

    return this.prisma.product.delete({ where: { id } });
  }

  async getStock(id: string) {
    await this.findOne(id);
    return this.prisma.inventory.findMany({
      where: { productId: id },
      include: { warehouse: true },
    });
  }
}