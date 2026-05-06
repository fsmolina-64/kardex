import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('current-stock')
  getCurrentStock(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getCurrentStock(warehouseId);
  }

  @Get('low-stock')
  getLowStock() {
    return this.reportsService.getLowStock();
  }

  @Get('valuation')
  getValuation(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getValuation(warehouseId);
  }

  @Get('movements')
  getMovementsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.reportsService.getMovementsReport(from, to, warehouseId);
  }
}