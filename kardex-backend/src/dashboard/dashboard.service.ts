import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      totalWarehouses,
      totalSuppliers,
      totalClients,
      lowStockItems,
      monthlyMovements,
      inventory,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.warehouse.count({ where: { isActive: true } }),
      this.prisma.supplier.count({ where: { isActive: true } }),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.inventory.findMany({
        include: { product: true },
      }).then(items => items.filter(i => Number(i.quantity) <= Number(i.product.minStock)).length),
      this.prisma.movement.groupBy({
        by: ['type'],
        where: {
          status: 'CONFIRMED',
          movementDate: { gte: firstDayOfMonth },
        },
        _count: { id: true },
      }),
      this.prisma.inventory.findMany({
        include: { product: true },
        where: { quantity: { gt: 0 } },
      }),
    ]);

    const totalInventoryValue = inventory.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.avgCost), 0
    );

    const entriesThisMonth = monthlyMovements.find(m => m.type === 'ENTRADA')?._count.id ?? 0;
    const exitsThisMonth = monthlyMovements.find(m => m.type === 'SALIDA')?._count.id ?? 0;

    return {
      totalProducts,
      totalWarehouses,
      totalSuppliers,
      totalClients,
      lowStockItems,
      entriesThisMonth,
      exitsThisMonth,
      totalInventoryValue,
    };
  }

  async getTopProducts(limit = 5) {
    const top = await this.prisma.movementDetail.groupBy({
      by: ['productId'],
      where: { movement: { type: 'SALIDA', status: 'CONFIRMED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const products = await Promise.all(
      top.map(async (t) => {
        const product = await this.prisma.product.findUnique({
          where: { id: t.productId },
          include: { unit: true },
        });
        return { product, totalSold: t._sum.quantity };
      })
    );
    return products;
  }

  async getMonthlyChart() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [entries, exits] = await Promise.all([
        this.prisma.movement.count({
          where: {
            type: 'ENTRADA', status: 'CONFIRMED',
            movementDate: { gte: date, lte: endDate },
          },
        }),
        this.prisma.movement.count({
          where: {
            type: 'SALIDA', status: 'CONFIRMED',
            movementDate: { gte: date, lte: endDate },
          },
        }),
      ]);

      months.push({
        month: date.toLocaleString('es', { month: 'short', year: 'numeric' }),
        entries,
        exits,
      });
    }
    return months;
  }
}