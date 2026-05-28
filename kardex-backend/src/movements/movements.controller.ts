import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MovementType, MovementStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  findAll(
    @Query('type') type?: MovementType,
    @Query('status') status?: MovementStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.movementsService.findAll({
      type, status, warehouseId, projectId, from, to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movementsService.findOne(id);
  }

  @Post('entry')
  createEntry(@Body() body: any, @Req() req: any) {
    return this.movementsService.createEntry({ ...body, userId: req.user.id });
  }

  @Post('exit')
  createExit(@Body() body: any, @Req() req: any) {
    return this.movementsService.createExit({ ...body, userId: req.user.id });
  }

  @Post('transfer')
  createTransfer(@Body() body: any, @Req() req: any) {
    return this.movementsService.createTransfer({ ...body, userId: req.user.id });
  }

  @Post('adjustment')
  createAdjustment(@Body() body: any, @Req() req: any) {
    return this.movementsService.createAdjustment({ ...body, userId: req.user.id });
  }

  @Post('consumo')
  createConsumo(@Body() body: any, @Req() req: any) {
    return this.movementsService.createConsumo({ ...body, userId: req.user.id });
  }

  @Post('devolucion-obra')
  createDevolucionObra(@Body() body: any, @Req() req: any) {
    return this.movementsService.createDevolucionObra({ ...body, userId: req.user.id });
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.movementsService.cancel(id);
  }
}