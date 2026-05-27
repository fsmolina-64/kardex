import {
  Injectable, NotFoundException, ConflictException, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerRole } from '@prisma/client';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    workerRole?: WorkerRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, workerRole, isActive, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (workerRole) where.workerRole = workerRole;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.worker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        include: {
          _count: { select: { dailyAttendance: true } },
        },
      }),
      this.prisma.worker.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        _count: { select: { dailyAttendance: true } },
      },
    });
    if (!worker) throw new NotFoundException(`Trabajador ${id} no encontrado`);
    return worker;
  }

  async create(dto: CreateWorkerDto) {
    if (dto.idNumber) {
      const exists = await this.prisma.worker.findUnique({ where: { idNumber: dto.idNumber } });
      if (exists) throw new ConflictException(`Cédula ${dto.idNumber} ya registrada`);
    }

    return this.prisma.worker.create({ data: dto });
  }

  async update(id: string, dto: UpdateWorkerDto) {
    await this.findOne(id);

    if (dto.idNumber) {
      const exists = await this.prisma.worker.findFirst({
        where: { idNumber: dto.idNumber, NOT: { id } },
      });
      if (exists) throw new ConflictException(`Cédula ${dto.idNumber} ya registrada`);
    }

    return this.prisma.worker.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.worker.update({ where: { id }, data: { isActive: false } });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.worker.update({ where: { id }, data: { isActive: true } });
  }

  async permanentDelete(id: string) {
    await this.findOne(id);

    const attendanceCount = await this.prisma.dailyAttendance.count({ where: { workerId: id } });
    if (attendanceCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar: el trabajador tiene asistencias registradas. Desactívelo en su lugar.'
      );
    }

    return this.prisma.worker.delete({ where: { id } });
  }
}