import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

findAll(query: { search?: string; isActive?: boolean }) {
  return this.prisma.client.findMany({
    where: {
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    orderBy: { name: 'asc' },
  });
}

async permanentDelete(id: string) {
  await this.findOne(id);
  return this.prisma.client.delete({ where: { id } });
}

  async findOne(id: string) {
    const c = await this.prisma.client.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
    return c;
  }

  create(data: { name: string; idNumber?: string; email?: string; phone?: string; address?: string }) {
    return this.prisma.client.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: { isActive: false } });
  }
}