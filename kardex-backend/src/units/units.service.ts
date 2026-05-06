import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.unit.findMany({
      where: { ...(search && { name: { contains: search, mode: 'insensitive' } }) },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!unit) throw new NotFoundException('Unidad no encontrada');
    return unit;
  }

  create(data: { name: string; abbreviation: string }) {
    return this.prisma.unit.create({ data });
  }

  async update(id: string, data: { name?: string; abbreviation?: string; isActive?: boolean }) {
    await this.findOne(id);
    return this.prisma.unit.update({ where: { id }, data });
  }

  async remove(id: string) {
    const unit = await this.findOne(id);
    if (unit._count.products > 0)
      throw new ConflictException('No se puede eliminar una unidad con productos');
    return this.prisma.unit.delete({ where: { id } });
  }
}