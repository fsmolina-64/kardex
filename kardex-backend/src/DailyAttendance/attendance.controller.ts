import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('workerId') workerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attendanceService.findAll({
      projectId, workerId, from, to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('report')
  getReport(
    @Query('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getReport({ projectId, from, to });
  }

  @Post()
  create(@Body() dto: CreateAttendanceDto, @Request() req: any) {
    return this.attendanceService.create(dto, req.user?.sub);
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkAttendanceDto, @Request() req: any) {
    return this.attendanceService.bulkCreate(dto, req.user?.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
}