-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MATERIAL', 'TOOL', 'MACHINERY', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('CENTRAL', 'PROJECT_SITE', 'TRANSIT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'FINISHED');

-- CreateEnum
CREATE TYPE "WorkerRole" AS ENUM ('MAESTRO_MAYOR', 'ALBANIL', 'AYUDANTE', 'ELECTRICISTA', 'PLOMERO', 'CARPINTERO', 'FIERRERO', 'PINTOR', 'CHOFER', 'GUARDIA');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'EXTRA');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'RETURNED', 'LOST', 'DAMAGED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MovementType" ADD VALUE 'CONSUMO_OBRA';
ALTER TYPE "MovementType" ADD VALUE 'DEVOLUCION_OBRA';

-- AlterTable
ALTER TABLE "movements" ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "project_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_consumable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'MATERIAL';

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "project_id" TEXT,
ADD COLUMN     "warehouse_type" "WarehouseType" NOT NULL DEFAULT 'CENTRAL';

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "client_id" TEXT,
    "supervisor_id" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "estimated_end_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "budget" DECIMAL(14,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "id_number" TEXT,
    "worker_role" "WorkerRole" NOT NULL,
    "daily_rate" DECIMAL(8,2) NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_attendance" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "hours_worked" DECIMAL(4,2),
    "daily_cost" DECIMAL(8,2) NOT NULL,
    "registered_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_assignments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL,
    "returned_date" TIMESTAMP(3),
    "quantity" DECIMAL(8,2) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "workers_id_number_key" ON "workers"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "daily_attendance_worker_id_project_id_date_key" ON "daily_attendance"("worker_id", "project_id", "date");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_attendance" ADD CONSTRAINT "daily_attendance_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_attendance" ADD CONSTRAINT "daily_attendance_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_attendance" ADD CONSTRAINT "daily_attendance_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignments" ADD CONSTRAINT "tool_assignments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignments" ADD CONSTRAINT "tool_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_assignments" ADD CONSTRAINT "tool_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
