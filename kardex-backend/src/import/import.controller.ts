import {
  Controller, Post, Get, UploadedFile,
  UseInterceptors, UseGuards, Req, Res, BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('template/products')
  async productTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateProductTemplate();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=plantilla_productos.xlsx' });
    res.send(buffer);
  }

  @Get('template/workers')
  async workerTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateWorkerTemplate();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=plantilla_trabajadores.xlsx' });
    res.send(buffer);
  }

  @Post('products')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.importService.importProducts(file.buffer, req.user.sub);
  }

  @Post('workers')
  @UseInterceptors(FileInterceptor('file'))
  async importWorkers(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.importService.importWorkers(file.buffer);
  }
}