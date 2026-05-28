import { Module } from '@nestjs/common';
import { ToolAssignmentsService } from './tool-assignments.service';
import { ToolAssignmentsController } from './tool-assignments.controller';

@Module({
  controllers: [ToolAssignmentsController],
  providers: [ToolAssignmentsService],
  exports: [ToolAssignmentsService],
})
export class ToolAssignmentsModule {}