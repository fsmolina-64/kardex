import { IsString, IsOptional, IsEnum, IsDecimal, MinLength } from 'class-validator';
import { WorkerRole } from '@prisma/client';

export class CreateWorkerDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsEnum(WorkerRole)
  workerRole: WorkerRole;

  @IsDecimal()
  dailyRate: string;

  @IsOptional()
  @IsString()
  phone?: string;
}