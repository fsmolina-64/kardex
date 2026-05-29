import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MulterModule.register({ storage: undefined })],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}