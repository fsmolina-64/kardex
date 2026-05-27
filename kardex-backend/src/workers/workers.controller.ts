import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkerRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('workerRole') workerRole?: WorkerRole,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workersService.findAll({
      search,
      workerRole,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkerDto) {
    return this.workersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    return this.workersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.workersService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.workersService.activate(id);
  }

  @Delete(':id/permanent')
  permanentDelete(@Param('id') id: string) {
    return this.workersService.permanentDelete(id);
  }
}