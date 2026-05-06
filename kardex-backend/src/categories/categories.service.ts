import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; isActive?: boolean }) {
    const { search, isActive } = query;
    return this.prisma.category.findMany({
      where: {
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(isActive !== undefined && { isActive }),
        parentId: null,
      },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(data: { name: string; description?: string; parentId?: string }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean; parentId?: string }) {
    await this.findOne(id);
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category._count.products > 0)
      throw new ConflictException('No se puede eliminar una categoría con productos');
    return this.prisma.category.delete({ where: { id } });
  }
}