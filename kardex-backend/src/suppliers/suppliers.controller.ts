import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

 @Get()
findAll(@Query('search') search?: string, @Query('isActive') isActive?: string) {
  return this.suppliersService.findAll({
    search,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });
}

@Delete(':id/permanent')
permanentDelete(@Param('id') id: string) {
  return this.suppliersService.permanentDelete(id);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.suppliersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.suppliersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}