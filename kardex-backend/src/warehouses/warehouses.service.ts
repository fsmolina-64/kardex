import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

findAll(query: { search?: string; isActive?: boolean }) {
  return this.prisma.warehouse.findMany({
    where: {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    include: {
      _count: { select: { inventory: true } },
    },
    orderBy: { name: 'asc' },
  });
}

  async findOne(id: string) {
    const w = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: {
          include: { product: { include: { unit: true, category: true } } },
        },
      },
    });
    if (!w) throw new NotFoundException('Bodega no encontrada');
    return w;
  }

  async create(data: { name: string; code: string; location?: string; isMain?: boolean }) {
    const exists = await this.prisma.warehouse.findUnique({ where: { code: data.code } });
    if (exists) throw new ConflictException('Ya existe una bodega con ese código');
    return this.prisma.warehouse.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

async remove(id: string) {
  await this.findOne(id);
  return this.prisma.warehouse.update({
    where: { id },
    data: { isActive: false },
  });
}
  async permanentDelete(id: string) {
  const inventoryCount = await this.prisma.inventory.count({
    where: { warehouseId: id },
  });
  if (inventoryCount > 0)
    throw new ConflictException('No se puede eliminar una bodega con inventario registrado');
  return this.prisma.warehouse.delete({ where: { id } });
}
}