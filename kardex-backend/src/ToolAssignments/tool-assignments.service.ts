import {
  Injectable, NotFoundException, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolAssignmentDto } from './dto/create-tool-assignment.dto';
import { ReturnToolAssignmentDto, ChangeStatusToolAssignmentDto } from './dto/update-tool-assignment.dto';
import { AssignmentStatus } from '@prisma/client';

@Injectable()
export class ToolAssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    projectId?: string;
    productId?: string;
    status?: AssignmentStatus;
    page?: number;
    limit?: number;
  }) {
    const { projectId, productId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (productId) where.productId = productId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.toolAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedDate: 'desc' },
        include: {
          product: { select: { id: true, name: true, code: true, productType: true } },
          project: { select: { id: true, name: true, code: true } },
          assignedByUser: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.toolAssignment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const assignment = await this.prisma.toolAssignment.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, code: true, productType: true } },
        project: { select: { id: true, name: true, code: true } },
        assignedByUser: { select: { id: true, fullName: true } },
      },
    });
    if (!assignment) throw new NotFoundException(`Asignación ${id} no encontrada`);
    return assignment;
  }

  async create(dto: CreateToolAssignmentDto, assignedBy?: string) {
    const [product, project] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.project.findUnique({ where: { id: dto.projectId } }),
    ]);

    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!project) throw new NotFoundException('Obra no encontrada');

    if (product.productType === 'MATERIAL' || product.productType === 'CONSUMABLE') {
      throw new BadRequestException(
        'Solo se pueden asignar productos de tipo TOOL o MACHINERY'
      );
    }

    return this.prisma.toolAssignment.create({
      data: {
        productId: dto.productId,
        projectId: dto.projectId,
        assignedDate: new Date(dto.assignedDate),
        quantity: dto.quantity,
        status: 'ASSIGNED',
        notes: dto.notes,
        assignedBy,
      },
      include: {
        product: { select: { id: true, name: true, code: true, productType: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async returnTool(id: string, dto: ReturnToolAssignmentDto) {
    const assignment = await this.findOne(id);

    if (assignment.status !== 'ASSIGNED') {
      throw new BadRequestException(
        `No se puede devolver: estado actual es ${assignment.status}`
      );
    }

    return this.prisma.toolAssignment.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedDate: new Date(dto.returnedDate),
        notes: dto.notes ?? assignment.notes,
      },
      include: {
        product: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusToolAssignmentDto) {
    await this.findOne(id);

    if (dto.status === 'ASSIGNED' || dto.status === 'RETURNED') {
      throw new BadRequestException(
        'Use los endpoints /assign o /return para estos estados'
      );
    }

    return this.prisma.toolAssignment.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        returnedDate: new Date(),
      },
    });
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);

    if (assignment.status !== 'ASSIGNED') {
      throw new BadRequestException(
        'Solo se puede eliminar una asignación en estado ASSIGNED'
      );
    }

    return this.prisma.toolAssignment.delete({ where: { id } });
  }
}