import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request
} from '@nestjs/common';
import { ToolAssignmentsService } from './tool-assignments.service';
import { CreateToolAssignmentDto } from './dto/create-tool-assignment.dto';
import { ReturnToolAssignmentDto, ChangeStatusToolAssignmentDto } from './dto/update-tool-assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AssignmentStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('tool-assignments')
export class ToolAssignmentsController {
  constructor(private readonly toolAssignmentsService: ToolAssignmentsService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: AssignmentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.toolAssignmentsService.findAll({
      projectId, productId, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolAssignmentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateToolAssignmentDto, @Request() req: any) {
    return this.toolAssignmentsService.create(dto, req.user?.sub);
  }

  @Patch(':id/return')
  returnTool(@Param('id') id: string, @Body() dto: ReturnToolAssignmentDto) {
    return this.toolAssignmentsService.returnTool(id, dto);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusToolAssignmentDto) {
    return this.toolAssignmentsService.changeStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolAssignmentsService.remove(id);
  }
}