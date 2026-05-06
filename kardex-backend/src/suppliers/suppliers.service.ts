import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; isActive?: boolean }) {
  return this.prisma.supplier.findMany({
    where: {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    orderBy: { name: 'asc' },
  });
}

async permanentDelete(id: string) {
  await this.findOne(id);
  return this.prisma.supplier.delete({ where: { id } });
}

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Proveedor no encontrado');
    return s;
  }

  create(data: { name: string; taxId?: string; email?: string; phone?: string; address?: string }) {
    return this.prisma.supplier.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}