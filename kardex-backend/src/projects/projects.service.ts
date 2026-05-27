import {
  Injectable, NotFoundException, ConflictException, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: ProjectStatus;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, status, isActive, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          supervisor: { select: { id: true, fullName: true } },
          _count: { select: { movements: true, dailyAttendance: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        supervisor: { select: { id: true, fullName: true, email: true } },
        warehouses: { where: { isActive: true }, select: { id: true, name: true, code: true } },
        _count: { select: { movements: true, dailyAttendance: true, toolAssignments: true } },
      },
    });

    if (!project) throw new NotFoundException(`Obra ${id} no encontrada`);
    return project;
  }

  async getSummary(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Obra ${id} no encontrada`);

    // Costo materiales: suma de totalCost en movement_details vinculados a CONSUMO_OBRA
    const materialResult = await this.prisma.movementDetail.aggregate({
      where: {
        movement: { projectId: id, type: 'CONSUMO_OBRA', status: 'CONFIRMED' },
      },
      _sum: { totalCost: true },
    });

    // Costo mano de obra: suma de dailyCost en daily_attendance
    const laborResult = await this.prisma.dailyAttendance.aggregate({
      where: { projectId: id },
      _sum: { dailyCost: true },
    });

    const materialCost = Number(materialResult._sum.totalCost ?? 0);
    const laborCost = Number(laborResult._sum.dailyCost ?? 0);
    const totalCost = materialCost + laborCost;
    const budget = Number(project.budget ?? 0);

    return {
      projectId: id,
      projectName: project.name,
      budget,
      materialCost,
      laborCost,
      totalCost,
      budgetUsedPercent: budget > 0 ? Math.round((totalCost / budget) * 100) : null,
      budgetRemaining: budget > 0 ? budget - totalCost : null,
    };
  }

  async create(dto: CreateProjectDto) {
    const exists = await this.prisma.project.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Código ${dto.code} ya existe`);

    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!client) throw new NotFoundException('Cliente no encontrado');
    }

    if (dto.supervisorId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.supervisorId } });
      if (!user) throw new NotFoundException('Supervisor no encontrado');
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        address: dto.address,
        clientId: dto.clientId,
        supervisorId: dto.supervisorId,
        status: dto.status ?? 'PLANNING',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        estimatedEndDate: dto.estimatedEndDate ? new Date(dto.estimatedEndDate) : null,
        budget: dto.budget ? dto.budget : null,
        notes: dto.notes,
      },
      include: {
        client: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto.code) {
      const exists = await this.prisma.project.findFirst({
        where: { code: dto.code.toUpperCase(), NOT: { id } },
      });
      if (exists) throw new ConflictException(`Código ${dto.code} ya existe`);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        estimatedEndDate: dto.estimatedEndDate ? new Date(dto.estimatedEndDate) : undefined,
        actualEndDate: dto.actualEndDate ? new Date(dto.actualEndDate) : undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true } },
      },
    });
  }

  async changeStatus(id: string, status: ProjectStatus) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        status,
        actualEndDate: status === 'FINISHED' ? new Date() : undefined,
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: { isActive: false } });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data: { isActive: true } });
  }

  async permanentDelete(id: string) {
    await this.findOne(id);

    const [movements, attendance, toolAssignments] = await Promise.all([
      this.prisma.movement.count({ where: { projectId: id } }),
      this.prisma.dailyAttendance.count({ where: { projectId: id } }),
      this.prisma.toolAssignment.count({ where: { projectId: id } }),
    ]);

    if (movements > 0 || attendance > 0 || toolAssignments > 0) {
      throw new BadRequestException(
        'No se puede eliminar: la obra tiene movimientos, asistencias o herramientas asignadas. Desactívela en su lugar.'
      );
    }

    return this.prisma.project.delete({ where: { id } });
  }
}