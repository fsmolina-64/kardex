import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class ReturnToolAssignmentDto {
  @IsDateString()
  returnedDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ChangeStatusToolAssignmentDto {
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}