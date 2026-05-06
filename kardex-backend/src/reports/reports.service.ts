import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCurrentStock(warehouseId?: string) {
    return this.prisma.inventory.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
        quantity: { gt: 0 },
      },
      include: {
        product: { include: { unit: true, category: true } },
        warehouse: true,
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async getLowStock() {
    const inventory = await this.prisma.inventory.findMany({
      include: {
        product: { include: { unit: true, category: true } },
        warehouse: true,
      },
    });
    return inventory.filter(
      (i) => Number(i.quantity) <= Number(i.product.minStock),
    );
  }

  async getValuation(warehouseId?: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: { ...(warehouseId && { warehouseId }), quantity: { gt: 0 } },
      include: { product: { include: { unit: true, category: true } }, warehouse: true },
    });

    const items = inventory.map((i) => ({
      ...i,
      totalValue: Number(i.quantity) * Number(i.avgCost),
    }));

    const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);
    return { items, totalValue };
  }

  async getMovementsReport(from?: string, to?: string, warehouseId?: string) {
    return this.prisma.movement.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
        status: 'CONFIRMED',
        ...(from || to ? {
          movementDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        } : {}),
      },
      include: {
        warehouse: true,
        user: { select: { fullName: true } },
        details: { include: { product: true } },
      },
      orderBy: { movementDate: 'desc' },
    });
  }
}