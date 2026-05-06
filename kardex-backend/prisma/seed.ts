import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Roles
  const superAdmin = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN', description: 'Control total del sistema', isSystem: true },
  });

  const admin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrador', isSystem: true },
  });

  await prisma.role.upsert({
    where: { name: 'BODEGUERO' },
    update: {},
    create: { name: 'BODEGUERO', description: 'Gestión de inventario', isSystem: true },
  });

  await prisma.role.upsert({
    where: { name: 'VENDEDOR' },
    update: {},
    create: { name: 'VENDEDOR', description: 'Registro de ventas', isSystem: true },
  });

  await prisma.role.upsert({
    where: { name: 'CONTADOR' },
    update: {},
    create: { name: 'CONTADOR', description: 'Solo lectura financiera', isSystem: true },
  });

  await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: { name: 'VIEWER', description: 'Solo consulta', isSystem: true },
  });

  console.log('✅ Roles creados');


  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@karvo.com' },
    update: {},
    create: {
      email: 'admin@karvo.com',
      passwordHash: hash,
      fullName: 'Super Administrador',
      isActive: true,
    },
  });

  // Asignar rol SUPER_ADMIN al usuario
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: user.id, roleId: superAdmin.id },
  });

  console.log('✅ Usuario admin creado: admin@karvo.com / Admin123!');

  // Unidades básicas
  const units = [
    { name: 'Unidad', abbreviation: 'UND' },
    { name: 'Kilogramo', abbreviation: 'KG' },
    { name: 'Gramo', abbreviation: 'GR' },
    { name: 'Litro', abbreviation: 'LT' },
    { name: 'Mililitro', abbreviation: 'ML' },
    { name: 'Metro', abbreviation: 'MT' },
    { name: 'Caja', abbreviation: 'CJA' },
    { name: 'Paquete', abbreviation: 'PQT' },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { id: unit.abbreviation },
      update: {},
      create: unit,
    }).catch(async () => {
      // Si no existe el unique en abbreviation, crear directamente
      const exists = await prisma.unit.findFirst({ where: { abbreviation: unit.abbreviation } });
      if (!exists) await prisma.unit.create({ data: unit });
    });
  }

  console.log('✅ Unidades creadas');

  // Categoría general
  await prisma.category.upsert({
    where: { id: 'cat-general' },
    update: {},
    create: { id: 'cat-general', name: 'General', description: 'Categoría general', isActive: true },
  });

  console.log('✅ Categoría general creada');

  // Bodega principal
  await prisma.warehouse.upsert({
    where: { code: 'BOD-001' },
    update: {},
    create: {
      name: 'Bodega Principal',
      code: 'BOD-001',
      location: 'Planta principal',
      isMain: true,
      isActive: true,
    },
  });

  console.log('✅ Bodega principal creada');
  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });