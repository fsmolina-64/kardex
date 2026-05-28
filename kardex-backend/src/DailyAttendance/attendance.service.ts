import {
  Injectable, NotFoundException, ConflictException, BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Calcula dailyCost según status
  private calculateDailyCost(
    dailyRate: Decimal,
    status: AttendanceStatus,
    hoursWorked?: string,
  ): Decimal {
    const rate = Number(dailyRate);
    switch (status) {
      case 'PRESENT':  return new Decimal(rate * 1.0);
      case 'HALF_DAY': return new Decimal(rate * 0.5);
      case 'ABSENT':   return new Decimal(0);
      case 'EXTRA':
        const hours = Number(hoursWorked ?? 8);
        return new Decimal((rate / 8) * hours * 1.25);
    }
  }

  async findAll(params: {
    projectId?: string;
    workerId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const { projectId, workerId, from, to, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (workerId) where.workerId = workerId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.dailyAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { worker: { fullName: 'asc' } }],
        include: {
          worker: { select: { id: true, fullName: true, workerRole: true, dailyRate: true } },
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.dailyAttendance.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReport(params: { projectId: string; from?: string; to?: string }) {
    const { projectId, from, to } = params;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Obra no encontrada');

    const where: any = { projectId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const records = await this.prisma.dailyAttendance.findMany({
      where,
      include: {
        worker: { select: { id: true, fullName: true, workerRole: true, dailyRate: true } },
      },
      orderBy: { worker: { fullName: 'asc' } },
    });

    // Agrupar por trabajador
    const workerMap = new Map<string, any>();
    for (const r of records) {
      if (!workerMap.has(r.workerId)) {
        workerMap.set(r.workerId, {
          worker: r.worker,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          halfDays: 0,
          extraDays: 0,
          totalCost: 0,
        });
      }
      const entry = workerMap.get(r.workerId);
      entry.totalDays++;
      entry.totalCost += Number(r.dailyCost);
      if (r.status === 'PRESENT')  entry.presentDays++;
      if (r.status === 'ABSENT')   entry.absentDays++;
      if (r.status === 'HALF_DAY') entry.halfDays++;
      if (r.status === 'EXTRA')    entry.extraDays++;
    }

    const workers = Array.from(workerMap.values());
    const totalLaborCost = workers.reduce((sum, w) => sum + w.totalCost, 0);

    return {
      project: { id: project.id, name: project.name, code: project.code },
      from,
      to,
      workers,
      totalLaborCost,
    };
  }

  async create(dto: CreateAttendanceDto, registeredBy?: string) {
    const [worker, project] = await Promise.all([
      this.prisma.worker.findUnique({ where: { id: dto.workerId } }),
      this.prisma.project.findUnique({ where: { id: dto.projectId } }),
    ]);
    if (!worker) throw new NotFoundException('Trabajador no encontrado');
    if (!project) throw new NotFoundException('Obra no encontrada');

    if (dto.status === 'EXTRA' && !dto.hoursWorked) {
      throw new BadRequestException('hoursWorked requerido para status EXTRA');
    }

    const exists = await this.prisma.dailyAttendance.findUnique({
      where: { workerId_projectId_date: {
        workerId: dto.workerId,
        projectId: dto.projectId,
        date: new Date(dto.date),
      }},
    });
    if (exists) throw new ConflictException('Asistencia ya registrada para este trabajador en esta fecha y obra');

    const dailyCost = this.calculateDailyCost(worker.dailyRate, dto.status, dto.hoursWorked);

    return this.prisma.dailyAttendance.create({
      data: {
        workerId: dto.workerId,
        projectId: dto.projectId,
        date: new Date(dto.date),
        status: dto.status,
        hoursWorked: dto.hoursWorked ? dto.hoursWorked : null,
        dailyCost,
        registeredBy,
        notes: dto.notes,
      },
      include: {
        worker: { select: { id: true, fullName: true, workerRole: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async bulkCreate(dto: BulkAttendanceDto, registeredBy?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Obra no encontrada');

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const item of dto.attendances) {
      const worker = await this.prisma.worker.findUnique({ where: { id: item.workerId } });
      if (!worker) { results.errors.push(`Trabajador ${item.workerId} no encontrado`); results.skipped++; continue; }

      if (item.status === 'EXTRA' && !item.hoursWorked) {
        results.errors.push(`${worker.fullName}: hoursWorked requerido para EXTRA`); results.skipped++; continue;
      }

      const exists = await this.prisma.dailyAttendance.findUnique({
        where: { workerId_projectId_date: {
          workerId: item.workerId,
          projectId: dto.projectId,
          date: new Date(dto.date),
        }},
      });
      if (exists) { results.skipped++; continue; }

      const dailyCost = this.calculateDailyCost(worker.dailyRate, item.status, item.hoursWorked);

      await this.prisma.dailyAttendance.create({
        data: {
          workerId: item.workerId,
          projectId: dto.projectId,
          date: new Date(dto.date),
          status: item.status,
          hoursWorked: item.hoursWorked ?? null,
          dailyCost,
          registeredBy,
          notes: item.notes,
        },
      });
      results.created++;
    }

    return results;
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const attendance = await this.prisma.dailyAttendance.findUnique({
      where: { id },
      include: { worker: true },
    });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');

    if (dto.status === 'EXTRA' && !dto.hoursWorked && attendance.status !== 'EXTRA') {
      throw new BadRequestException('hoursWorked requerido para status EXTRA');
    }

    const newStatus = dto.status ?? attendance.status;
    const newHours = dto.hoursWorked ?? attendance.hoursWorked?.toString();
    const dailyCost = this.calculateDailyCost(attendance.worker.dailyRate, newStatus, newHours ?? undefined);

    return this.prisma.dailyAttendance.update({
      where: { id },
      data: {
        status: dto.status,
        hoursWorked: dto.hoursWorked ?? undefined,
        dailyCost,
        notes: dto.notes,
      },
      include: {
        worker: { select: { id: true, fullName: true, workerRole: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.dailyAttendance.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Registro de asistencia no encontrado');
    return this.prisma.dailyAttendance.delete({ where: { id } });
  }
}