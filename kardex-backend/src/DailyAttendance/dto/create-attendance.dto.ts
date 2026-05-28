import { IsString, IsEnum, IsOptional, IsDateString, IsDecimal, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @IsString()
  workerId: string;

  @IsString()
  projectId: string;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsDecimal()
  hoursWorked?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceItemDto {
  @IsString()
  workerId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsDecimal()
  hoursWorked?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceDto {
  @IsString()
  projectId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}