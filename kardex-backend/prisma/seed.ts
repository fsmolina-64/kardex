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
    where: { email: 'admin@karvo.com' },
    update: {},
    create: {
      email: 'admin@karvo.com',
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
// ── PRODUCTOS DE CONSTRUCCIÓN ─────────────────
const catCementantes = await prisma.category.findFirst({ where: { name: 'Cementantes y morteros' } });
const catAridos      = await prisma.category.findFirst({ where: { name: 'Áridos y pétreos' } });
const catHierro      = await prisma.category.findFirst({ where: { name: 'Hierro y acero estructural' } });
const catMadera      = await prisma.category.findFirst({ where: { name: 'Madera y encofrado' } });
const catTuberia     = await prisma.category.findFirst({ where: { name: 'Tubería y plomería' } });
const catElectrico   = await prisma.category.findFirst({ where: { name: 'Instalaciones eléctricas' } });
const catBloques     = await prisma.category.findFirst({ where: { name: 'Bloques y mampostería' } });
const catAcabados    = await prisma.category.findFirst({ where: { name: 'Acabados y pintura' } });
const catHerramientas = await prisma.category.findFirst({ where: { name: 'Herramientas manuales' } });
const catMaquinaria  = await prisma.category.findFirst({ where: { name: 'Maquinaria y equipos' } });
const catEPP         = await prisma.category.findFirst({ where: { name: 'EPP y seguridad industrial' } });
const catAdhesivos   = await prisma.category.findFirst({ where: { name: 'Adhesivos e impermeabilizantes' } });

const uSAC = await prisma.unit.findFirst({ where: { abbreviation: 'SAC' } });
const uM3  = await prisma.unit.findFirst({ where: { abbreviation: 'M3' } });
const uM2  = await prisma.unit.findFirst({ where: { abbreviation: 'M2' } });
const uML  = await prisma.unit.findFirst({ where: { abbreviation: 'ML' } });
const uKG  = await prisma.unit.findFirst({ where: { abbreviation: 'KG' } });
const uQQ  = await prisma.unit.findFirst({ where: { abbreviation: 'QQ' } });
const uVAR = await prisma.unit.findFirst({ where: { abbreviation: 'VAR' } });
const uUND = await prisma.unit.findFirst({ where: { abbreviation: 'UND' } });
const uGAL = await prisma.unit.findFirst({ where: { abbreviation: 'GAL' } });
const uLT  = await prisma.unit.findFirst({ where: { abbreviation: 'LT' } });
const uPLN = await prisma.unit.findFirst({ where: { abbreviation: 'PLN' } });
const uROL = await prisma.unit.findFirst({ where: { abbreviation: 'ROL' } });

const productos = [
  // CEMENTANTES
  { code: 'CEM-001', name: 'Cemento Portland tipo GU 50kg', categoryId: catCementantes!.id, unitId: uSAC!.id, costPrice: 9.50, salePrice: 9.50, minStock: 50, productType: 'MATERIAL' },
  { code: 'CEM-002', name: 'Cal hidratada 25kg', categoryId: catCementantes!.id, unitId: uSAC!.id, costPrice: 4.20, salePrice: 4.20, minStock: 20, productType: 'MATERIAL' },
  { code: 'CEM-003', name: 'Mortero seco fino 40kg', categoryId: catCementantes!.id, unitId: uSAC!.id, costPrice: 6.80, salePrice: 6.80, minStock: 10, productType: 'MATERIAL' },

  // ÁRIDOS
  { code: 'ARI-001', name: 'Arena fina de río', categoryId: catAridos!.id, unitId: uM3!.id, costPrice: 18.00, salePrice: 18.00, minStock: 5, productType: 'MATERIAL' },
  { code: 'ARI-002', name: 'Arena gruesa de río', categoryId: catAridos!.id, unitId: uM3!.id, costPrice: 18.00, salePrice: 18.00, minStock: 5, productType: 'MATERIAL' },
  { code: 'ARI-003', name: 'Ripio triturado 3/4"', categoryId: catAridos!.id, unitId: uM3!.id, costPrice: 22.00, salePrice: 22.00, minStock: 5, productType: 'MATERIAL' },

  // HIERRO
  { code: 'HIE-001', name: 'Varilla corrugada fy=4200 12mm', categoryId: catHierro!.id, unitId: uVAR!.id, costPrice: 8.50, salePrice: 8.50, minStock: 100, productType: 'MATERIAL' },
  { code: 'HIE-002', name: 'Varilla corrugada fy=4200 10mm', categoryId: catHierro!.id, unitId: uVAR!.id, costPrice: 5.80, salePrice: 5.80, minStock: 100, productType: 'MATERIAL' },
  { code: 'HIE-003', name: 'Varilla corrugada fy=4200 8mm', categoryId: catHierro!.id, unitId: uVAR!.id, costPrice: 3.90, salePrice: 3.90, minStock: 50, productType: 'MATERIAL' },
  { code: 'HIE-004', name: 'Alambre de amarre N°18', categoryId: catHierro!.id, unitId: uKG!.id, costPrice: 1.80, salePrice: 1.80, minStock: 20, productType: 'MATERIAL' },
  { code: 'HIE-005', name: 'Malla electrosoldada 15x15 d=5mm', categoryId: catHierro!.id, unitId: uROL!.id, costPrice: 95.00, salePrice: 95.00, minStock: 5, productType: 'MATERIAL' },

  // MADERA
  { code: 'MAD-001', name: 'Tabla encofrado 0.30x2.40m', categoryId: catMadera!.id, unitId: uUND!.id, costPrice: 3.50, salePrice: 3.50, minStock: 50, productType: 'MATERIAL' },
  { code: 'MAD-002', name: 'Puntal eucalipto 3m', categoryId: catMadera!.id, unitId: uUND!.id, costPrice: 2.80, salePrice: 2.80, minStock: 30, productType: 'MATERIAL' },
  { code: 'MAD-003', name: 'Pingos 2x3 eucalipto', categoryId: catMadera!.id, unitId: uUND!.id, costPrice: 1.50, salePrice: 1.50, minStock: 20, productType: 'MATERIAL' },

  // TUBERÍA
  { code: 'TUB-001', name: 'Tubo PVC presión 1/2" x 6m', categoryId: catTuberia!.id, unitId: uUND!.id, costPrice: 3.20, salePrice: 3.20, minStock: 20, productType: 'MATERIAL' },
  { code: 'TUB-002', name: 'Tubo PVC alcantarilla 110mm x 6m', categoryId: catTuberia!.id, unitId: uUND!.id, costPrice: 12.50, salePrice: 12.50, minStock: 10, productType: 'MATERIAL' },
  { code: 'TUB-003', name: 'Tubo PVC alcantarilla 75mm x 6m', categoryId: catTuberia!.id, unitId: uUND!.id, costPrice: 8.00, salePrice: 8.00, minStock: 10, productType: 'MATERIAL' },

  // ELÉCTRICO
  { code: 'ELE-001', name: 'Cable eléctrico THHN #12 AWG', categoryId: catElectrico!.id, unitId: uROL!.id, costPrice: 68.00, salePrice: 68.00, minStock: 5, productType: 'MATERIAL' },
  { code: 'ELE-002', name: 'Cable eléctrico THHN #10 AWG', categoryId: catElectrico!.id, unitId: uROL!.id, costPrice: 95.00, salePrice: 95.00, minStock: 3, productType: 'MATERIAL' },
  { code: 'ELE-003', name: 'Conduit EMT 3/4" x 3m', categoryId: catElectrico!.id, unitId: uUND!.id, costPrice: 4.50, salePrice: 4.50, minStock: 20, productType: 'MATERIAL' },
  { code: 'ELE-004', name: 'Breaker 1P 20A', categoryId: catElectrico!.id, unitId: uUND!.id, costPrice: 8.00, salePrice: 8.00, minStock: 10, productType: 'MATERIAL' },

  // BLOQUES
  { code: 'BLO-001', name: 'Bloque de hormigón 15x20x40cm', categoryId: catBloques!.id, unitId: uUND!.id, costPrice: 0.42, salePrice: 0.42, minStock: 500, productType: 'MATERIAL' },
  { code: 'BLO-002', name: 'Bloque de hormigón 10x20x40cm', categoryId: catBloques!.id, unitId: uUND!.id, costPrice: 0.32, salePrice: 0.32, minStock: 500, productType: 'MATERIAL' },
  { code: 'BLO-003', name: 'Adoquín de hormigón 10x20cm', categoryId: catBloques!.id, unitId: uM2!.id, costPrice: 8.50, salePrice: 8.50, minStock: 50, productType: 'MATERIAL' },

  // ACABADOS
  { code: 'ACA-001', name: 'Pintura de caucho interior blanca 4gl', categoryId: catAcabados!.id, unitId: uUND!.id, costPrice: 28.00, salePrice: 28.00, minStock: 10, productType: 'MATERIAL' },
  { code: 'ACA-002', name: 'Estuco en polvo 25kg', categoryId: catAcabados!.id, unitId: uSAC!.id, costPrice: 7.50, salePrice: 7.50, minStock: 20, productType: 'MATERIAL' },
  { code: 'ACA-003', name: 'Cerámica piso 40x40cm', categoryId: catAcabados!.id, unitId: uM2!.id, costPrice: 8.20, salePrice: 8.20, minStock: 50, productType: 'MATERIAL' },
  { code: 'ACA-004', name: 'Porcelanato 60x60cm', categoryId: catAcabados!.id, unitId: uM2!.id, costPrice: 18.50, salePrice: 18.50, minStock: 30, productType: 'MATERIAL' },

  // HERRAMIENTAS
  { code: 'HER-001', name: 'Pala cuadrada', categoryId: catHerramientas!.id, unitId: uUND!.id, costPrice: 12.00, salePrice: 12.00, minStock: 5, productType: 'TOOL', isConsumable: false },
  { code: 'HER-002', name: 'Pico doble', categoryId: catHerramientas!.id, unitId: uUND!.id, costPrice: 14.00, salePrice: 14.00, minStock: 3, productType: 'TOOL', isConsumable: false },
  { code: 'HER-003', name: 'Carretilla construcción', categoryId: catHerramientas!.id, unitId: uUND!.id, costPrice: 45.00, salePrice: 45.00, minStock: 2, productType: 'TOOL', isConsumable: false },
  { code: 'HER-004', name: 'Nivel de aluminio 1.20m', categoryId: catHerramientas!.id, unitId: uUND!.id, costPrice: 18.00, salePrice: 18.00, minStock: 2, productType: 'TOOL', isConsumable: false },

  // MAQUINARIA
  { code: 'MAQ-001', name: 'Mezcladora de hormigón 1 saco', categoryId: catMaquinaria!.id, unitId: uUND!.id, costPrice: 850.00, salePrice: 850.00, minStock: 1, productType: 'MACHINERY', isConsumable: false },
  { code: 'MAQ-002', name: 'Andamio tubular 1.20x1.50m', categoryId: catMaquinaria!.id, unitId: uUND!.id, costPrice: 65.00, salePrice: 65.00, minStock: 5, productType: 'MACHINERY', isConsumable: false },
  { code: 'MAQ-003', name: 'Vibrador de hormigón 1.5HP', categoryId: catMaquinaria!.id, unitId: uUND!.id, costPrice: 380.00, salePrice: 380.00, minStock: 1, productType: 'MACHINERY', isConsumable: false },

  // EPP
  { code: 'EPP-001', name: 'Casco de seguridad', categoryId: catEPP!.id, unitId: uUND!.id, costPrice: 4.50, salePrice: 4.50, minStock: 10, productType: 'CONSUMABLE' },
  { code: 'EPP-002', name: 'Guantes de trabajo par', categoryId: catEPP!.id, unitId: uUND!.id, costPrice: 2.80, salePrice: 2.80, minStock: 20, productType: 'CONSUMABLE' },
  { code: 'EPP-003', name: 'Bota de caucho industrial par', categoryId: catEPP!.id, unitId: uUND!.id, costPrice: 12.00, salePrice: 12.00, minStock: 5, productType: 'CONSUMABLE' },
  { code: 'EPP-004', name: 'Chaleco reflectivo', categoryId: catEPP!.id, unitId: uUND!.id, costPrice: 5.50, salePrice: 5.50, minStock: 5, productType: 'CONSUMABLE' },

  // ADHESIVOS
  { code: 'ADH-001', name: 'Bondex porcelanato blanco 25kg', categoryId: catAdhesivos!.id, unitId: uSAC!.id, costPrice: 11.50, salePrice: 11.50, minStock: 10, productType: 'MATERIAL' },
  { code: 'ADH-002', name: 'Sika impermeabilizante 1gl', categoryId: catAdhesivos!.id, unitId: uGAL!.id, costPrice: 18.00, salePrice: 18.00, minStock: 5, productType: 'MATERIAL' },
  { code: 'ADH-003', name: 'Sikaflex 11FC cartucho 300ml', categoryId: catAdhesivos!.id, unitId: uUND!.id, costPrice: 8.50, salePrice: 8.50, minStock: 5, productType: 'MATERIAL' },
];

for (const prod of productos) {
  const exists = await prisma.product.findUnique({ where: { code: prod.code } });
  if (!exists) {
    await prisma.product.create({
      data: {
        code: prod.code,
        name: prod.name,
        categoryId: prod.categoryId,
        unitId: prod.unitId,
        costPrice: prod.costPrice,
        salePrice: prod.salePrice,
        minStock: prod.minStock,
        productType: prod.productType as any,
        isConsumable: (prod as any).isConsumable ?? true,
        valuationMethod: 'AVERAGE',
      },
    });
  }
}
console.log('✅ Productos de construcción creados');
  console.log('🎉 Seed completado');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });