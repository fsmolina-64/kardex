import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KardexService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    productId?: string; warehouseId?: string;
    from?: string; to?: string;
    page?: number; limit?: number;
  }) {
    const { productId, warehouseId, from, to, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(productId && { productId }),
      ...(warehouseId && { warehouseId }),
      ...(from || to ? {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.kardex.findMany({
        where, skip, take: limit,
        include: {
          product: { include: { unit: true } },
          warehouse: true,
          movementDetail: { include: { movement: true } },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.kardex.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSummary(productId: string, warehouseId?: string) {
    const inventory = await this.prisma.inventory.findMany({
      where: {
        productId,
        ...(warehouseId && { warehouseId }),
      },
      include: { warehouse: true, product: { include: { unit: true } } },
    });
    return inventory;
  }
}