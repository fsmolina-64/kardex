import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { UnitsModule } from './units/units.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ClientsModule } from './clients/clients.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ProductsModule } from './products/products.module';
import { MovementsModule } from './movements/movements.module';
import { KardexModule } from './kardex/kardex.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RolesModule } from './roles/roles.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkersModule } from './workers/workers.module';
import { AttendanceModule } from './DailyAttendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    UnitsModule,
    SuppliersModule,
    ClientsModule,
    WarehousesModule,
    ProductsModule,
    MovementsModule,
    KardexModule,
    ReportsModule,
    DashboardModule,
    RolesModule,
    ProjectsModule,
    WorkersModule,
    AttendanceModule,
  ],
})
export class AppModule {}