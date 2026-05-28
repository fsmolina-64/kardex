import { IsEnum, IsOptional, IsDecimal, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsDecimal()
  hoursWorked?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}