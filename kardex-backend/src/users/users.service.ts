import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; isActive?: boolean }) {
    return this.prisma.user.findMany({
      where: {
        ...(query.search && {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      },
      select: {
        id: true, email: true, fullName: true, avatarUrl: true,
        isActive: true, lastLogin: true, createdAt: true,
        userRoles: { include: { role: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, avatarUrl: true,
        isActive: true, lastLogin: true, createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(data: { email: string; password: string; fullName: string; roleIds?: string[] }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash, fullName: data.fullName },
    });

    if (data.roleIds?.length) {
      await this.prisma.userRole.createMany({
        data: data.roleIds.map((roleId) => ({ userId: user.id, roleId })),
      });
    }

    return this.findOne(user.id);
  }

  async update(id: string, data: { fullName?: string; email?: string; isActive?: boolean; roleIds?: string[] }) {
    await this.findOne(id);
    const { roleIds, ...rest } = data;

    await this.prisma.user.update({ where: { id }, data: rest });

    if (roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    return this.findOne(id);
  }

  async changePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Contraseña actualizada correctamente' };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
async permanentDelete(id: string) {
  // Eliminar todas las relaciones primero
  await this.prisma.userRole.deleteMany({ where: { userId: id } });
  await this.prisma.auditLog.deleteMany({ where: { userId: id } });
  
  // Eliminar el usuario
  return this.prisma.user.delete({ where: { id } });
}
}