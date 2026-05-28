import { IsString, IsOptional, IsDateString, IsDecimal } from 'class-validator';

export class CreateToolAssignmentDto {
  @IsString()
  productId: string;

  @IsString()
  projectId: string;

  @IsDateString()
  assignedDate: string;

  @IsDecimal()
  quantity: string;

  @IsOptional()
  @IsString()
  notes?: string;
}