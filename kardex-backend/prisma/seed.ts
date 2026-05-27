import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── ROLES ─────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'SUPER_ADMIN' }, update: {}, create: { name: 'SUPER_ADMIN', description: 'Control total del sistema', isSystem: true } }),
    prisma.role.upsert({ where: { name: 'BODEGUERO' }, update: {}, create: { name: 'BODEGUERO', description: 'Gestión de inventario y movimientos', isSystem: true } }),
    prisma.role.upsert({ where: { name: 'VENDEDOR' }, update: {}, create: { name: 'VENDEDOR', description: 'Solo puede registrar salidas', isSystem: true } }),
    prisma.role.upsert({ where: { name: 'CONTADOR' }, update: {}, create: { name: 'CONTADOR', description: 'Solo lectura y exportar PDF', isSystem: true } }),
    prisma.role.upsert({ where: { name: 'VIEWER' }, update: {}, create: { name: 'VIEWER', description: 'Solo consulta', isSystem: true } }),
  ]);
  console.log('✅ Roles creados');

  // ── USUARIO ADMIN ─────────────────────────────
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kardex.com' },
    update: {},
    create: {
      email: 'admin@kardex.com',
      passwordHash,
      fullName: 'Administrador del Sistema',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roles[0].id } },
    update: {},
    create: { userId: admin.id, roleId: roles[0].id },
  });
  console.log('✅ Usuario admin creado');

  // ── CATEGORÍAS ────────────────────────────────
  const categorias = [
    { name: 'Cementantes y morteros',        description: 'Cemento Portland, cal, yeso, mortero' },
    { name: 'Áridos y pétreos',               description: 'Arena fina, arena gruesa, ripio triturado, grava' },
    { name: 'Hierro y acero estructural',     description: 'Varillas, perfiles, mallas, alambre de amarre' },
    { name: 'Madera y encofrado',             description: 'Tablas, puntales, tablones, pingos' },
    { name: 'Tubería y plomería',             description: 'PVC, cobre, accesorios sanitarios, llaves' },
    { name: 'Instalaciones eléctricas',       description: 'Cables, conduits, tomacorrientes, breakers' },
    { name: 'Bloques y mampostería',          description: 'Bloques 15cm/10cm, ladrillos, adoquines' },
    { name: 'Acabados y pintura',             description: 'Pintura de caucho, esmalte, cerámica, porcelanato' },
    { name: 'Herramientas manuales',          description: 'Palas, picos, carretillas, niveles, plomadas' },
    { name: 'Maquinaria y equipos',           description: 'Mezcladoras, compactadoras, bombas, andamios' },
    { name: 'EPP y seguridad industrial',     description: 'Cascos, guantes, botas, chalecos' },
    { name: 'Adhesivos e impermeabilizantes', description: 'Bondex, sikaflex, impermeabilizante, aditivos' },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { id: cat.name }, // upsert por name no es posible sin unique — usar findFirst
      update: {},
      create: cat,
    }).catch(async () => {
      const exists = await prisma.category.findFirst({ where: { name: cat.name } });
      if (!exists) await prisma.category.create({ data: cat });
    });
  }
  console.log('✅ Categorías creadas');

  // ── UNIDADES ──────────────────────────────────
  const unidades = [
    { name: 'Saco',              abbreviation: 'SAC' },
    { name: 'Metro cúbico',      abbreviation: 'M3'  },
    { name: 'Metro cuadrado',    abbreviation: 'M2'  },
    { name: 'Metro lineal',      abbreviation: 'ML'  },
    { name: 'Kilogramo',         abbreviation: 'KG'  },
    { name: 'Quintal',           abbreviation: 'QQ'  },
    { name: 'Varilla',           abbreviation: 'VAR' },
    { name: 'Unidad',            abbreviation: 'UND' },
    { name: 'Galón',             abbreviation: 'GAL' },
    { name: 'Litro',             abbreviation: 'LT'  },
    { name: 'Plancha',           abbreviation: 'PLN' },
    { name: 'Rollo',             abbreviation: 'ROL' },
  ];

  for (const uni of unidades) {
    const exists = await prisma.unit.findFirst({ where: { abbreviation: uni.abbreviation } });
    if (!exists) await prisma.unit.create({ data: uni });
  }
  console.log('✅ Unidades creadas');

  // ── BODEGA PRINCIPAL ──────────────────────────
  await prisma.warehouse.upsert({
    where: { code: 'BG-CENTRAL' },
    update: {},
    create: {
      name: 'Bodega Central',
      code: 'BG-CENTRAL',
      location: 'Instalaciones principales',
      isMain: true,
      isActive: true,
      warehouseType: 'CENTRAL',
    },
  });
  console.log('✅ Bodega central creada');

  console.log('🎉 Seed completado');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });