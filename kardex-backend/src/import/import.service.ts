import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

type WorkbookBuffer = any; // 👈 Forzar any para evitar conflictos de Buffer

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  // ── IMPORTAR PRODUCTOS ────────────────────────
  async importProducts(buffer: WorkbookBuffer, defaultUserId: string) {
    const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];

    const results = { created: 0, skipped: 0, errors: [] as any[] };
    const rows: any[] = [];

    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const [codigo, nombre, categoria, unidad, tipo, precio_costo, precio_venta, stock_minimo, stock_inicial, bodega] =
        (row.values as any[]).slice(1);
      if (!nombre) return;
      rows.push({ index, codigo, nombre, categoria, unidad, tipo, precio_costo, precio_venta, stock_minimo, stock_inicial, bodega });
    });

    const [categories, units, warehouses] = await Promise.all([
      this.prisma.category.findMany({ where: { isActive: true } }),
      this.prisma.unit.findMany({ where: { isActive: true } }),
      this.prisma.warehouse.findMany({ where: { isActive: true } }),
    ]);

    const validTypes = ['MATERIAL', 'TOOL', 'MACHINERY', 'CONSUMABLE'];
    const bodegaCentral = warehouses.find(w => w.code === 'BG-CENTRAL');

    for (const row of rows) {
      const fila = `Fila ${row.index}`;

      if (!row.nombre) { results.errors.push({ fila, error: 'Nombre requerido' }); results.skipped++; continue; }

      const cat = categories.find(c => c.name.toLowerCase() === String(row.categoria || '').toLowerCase());
      if (!cat) { results.errors.push({ fila, error: `Categoría "${row.categoria}" no encontrada` }); results.skipped++; continue; }

      const unit = units.find(u => u.abbreviation.toLowerCase() === String(row.unidad || '').toLowerCase());
      if (!unit) { results.errors.push({ fila, error: `Unidad "${row.unidad}" no encontrada` }); results.skipped++; continue; }

      const tipo = String(row.tipo || 'MATERIAL').toUpperCase();
      if (!validTypes.includes(tipo)) { results.errors.push({ fila, error: `Tipo "${row.tipo}" inválido` }); results.skipped++; continue; }

      const costPrice = parseFloat(row.precio_costo) || 0;
      const salePrice = parseFloat(row.precio_venta) || 0;
      const minStock  = parseFloat(row.stock_minimo) || 0;
      const stockInicial = parseFloat(row.stock_inicial) || 0;

      if (costPrice < 0 || salePrice < 0) { results.errors.push({ fila, error: 'Precios no pueden ser negativos' }); results.skipped++; continue; }

      const code = row.codigo ? String(row.codigo).toUpperCase() : await this.generateCode(tipo);

      const existing = await this.prisma.product.findUnique({ where: { code } });
      if (existing) { results.errors.push({ fila, error: `Código "${code}" ya existe` }); results.skipped++; continue; }

      const warehouseCode = row.bodega ? String(row.bodega).toUpperCase() : 'BG-CENTRAL';
      const warehouse = warehouses.find(w => w.code === warehouseCode) || bodegaCentral;
      if (!warehouse) { results.errors.push({ fila, error: 'Bodega no encontrada' }); results.skipped++; continue; }

      await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            code,
            name: String(row.nombre),
            categoryId: cat.id,
            unitId: unit.id,
            costPrice,
            salePrice,
            minStock,
            productType: tipo as any,
            isConsumable: tipo === 'TOOL' || tipo === 'MACHINERY' ? false : true,
            valuationMethod: 'AVERAGE',
          },
        });

        if (stockInicial > 0) {
          const refCount = await tx.movement.count({ where: { type: 'ENTRADA' } });
          const refNumber = `ENT-${String(refCount + 1).padStart(6, '0')}`;

          const movement = await tx.movement.create({
            data: {
              referenceNumber: refNumber,
              type: 'ENTRADA',
              status: 'CONFIRMED',
              warehouseId: warehouse.id,
              userId: defaultUserId,
              notes: 'Stock inicial importado desde Excel',
              movementDate: new Date(),
            },
          });

          const totalCost = stockInicial * costPrice;
          const detail = await tx.movementDetail.create({
            data: {
              movementId: movement.id,
              productId: product.id,
              quantity: stockInicial,
              unitCost: costPrice,
              totalCost,
            },
          });

          await tx.inventory.create({
            data: { productId: product.id, warehouseId: warehouse.id, quantity: stockInicial, avgCost: costPrice },
          });

          await tx.kardex.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              movementDetailId: detail.id,
              movementType: 'ENTRADA',
              inQuantity: stockInicial,
              inUnitCost: costPrice,
              inTotal: totalCost,
              balanceQuantity: stockInicial,
              balanceUnitCost: costPrice,
              balanceTotal: totalCost,
              date: new Date(),
            },
          });
        }
      });

      results.created++;
    }

    return results;
  }

  // ── IMPORTAR TRABAJADORES ─────────────────────
  async importWorkers(buffer: WorkbookBuffer) {
    const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];

    const results = { created: 0, skipped: 0, errors: [] as any[] };
    const validRoles = ['MAESTRO_MAYOR','ALBANIL','AYUDANTE','ELECTRICISTA','PLOMERO','CARPINTERO','FIERRERO','PINTOR','CHOFER','GUARDIA'];

    const rows: any[] = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const [nombre_completo, cedula, rol, jornal_diario, telefono] = (row.values as any[]).slice(1);
      if (!nombre_completo) return;
      rows.push({ index, nombre_completo, cedula, rol, jornal_diario, telefono });
    });

    for (const row of rows) {
      const fila = `Fila ${row.index}`;

      if (!row.nombre_completo) { results.errors.push({ fila, error: 'Nombre requerido' }); results.skipped++; continue; }

      const rol = String(row.rol || '').toUpperCase();
      if (!validRoles.includes(rol)) { results.errors.push({ fila, error: `Rol "${row.rol}" inválido. Válidos: ${validRoles.join(', ')}` }); results.skipped++; continue; }

      const jornal = parseFloat(row.jornal_diario);
      if (!jornal || jornal <= 0) { results.errors.push({ fila, error: 'Jornal diario inválido' }); results.skipped++; continue; }

      const cedula = row.cedula ? String(row.cedula) : undefined;
      if (cedula) {
        const exists = await this.prisma.worker.findUnique({ where: { idNumber: cedula } });
        if (exists) { results.errors.push({ fila, error: `Cédula "${cedula}" ya registrada` }); results.skipped++; continue; }
      }

      await this.prisma.worker.create({
        data: {
          fullName: String(row.nombre_completo),
          idNumber: cedula,
          workerRole: rol as any,
          dailyRate: jornal,
          phone: row.telefono ? String(row.telefono) : undefined,
        },
      });

      results.created++;
    }

    return results;
  }

  // ── GENERAR PLANTILLAS ────────────────────────
  async generateProductTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');

    sheet.columns = [
      { header: 'codigo', key: 'codigo', width: 15 },
      { header: 'nombre', key: 'nombre', width: 40 },
      { header: 'categoria', key: 'categoria', width: 30 },
      { header: 'unidad', key: 'unidad', width: 12 },
      { header: 'tipo', key: 'tipo', width: 15 },
      { header: 'precio_costo', key: 'precio_costo', width: 15 },
      { header: 'precio_venta', key: 'precio_venta', width: 15 },
      { header: 'stock_minimo', key: 'stock_minimo', width: 15 },
      { header: 'stock_inicial', key: 'stock_inicial', width: 15 },
      { header: 'bodega', key: 'bodega', width: 15 },
    ];

    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    sheet.addRow({ codigo: 'CEM-099', nombre: 'Cemento Portland 50kg', categoria: 'Cementantes y morteros', unidad: 'SAC', tipo: 'MATERIAL', precio_costo: 9.50, precio_venta: 9.50, stock_minimo: 50, stock_inicial: 100, bodega: 'BG-CENTRAL' });
    sheet.addRow({ codigo: '', nombre: 'Arena fina', categoria: 'Áridos y pétreos', unidad: 'M3', tipo: 'MATERIAL', precio_costo: 18.00, precio_venta: 18.00, stock_minimo: 5, stock_inicial: 10, bodega: 'BG-CENTRAL' });

    const refSheet = workbook.addWorksheet('Referencia');
    refSheet.addRow(['CATEGORÍAS VÁLIDAS']);
    ['Cementantes y morteros','Áridos y pétreos','Hierro y acero estructural','Madera y encofrado','Tubería y plomería','Instalaciones eléctricas','Bloques y mampostería','Acabados y pintura','Herramientas manuales','Maquinaria y equipos','EPP y seguridad industrial','Adhesivos e impermeabilizantes'].forEach(c => refSheet.addRow([c]));
    refSheet.addRow([]);
    refSheet.addRow(['UNIDADES VÁLIDAS']);
    ['SAC','M3','M2','ML','KG','QQ','VAR','UND','GAL','LT','PLN','ROL'].forEach(u => refSheet.addRow([u]));
    refSheet.addRow([]);
    refSheet.addRow(['TIPOS VÁLIDOS']);
    ['MATERIAL','TOOL','MACHINERY','CONSUMABLE'].forEach(t => refSheet.addRow([t]));

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async generateWorkerTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Trabajadores');

    sheet.columns = [
      { header: 'nombre_completo', key: 'nombre_completo', width: 35 },
      { header: 'cedula', key: 'cedula', width: 15 },
      { header: 'rol', key: 'rol', width: 20 },
      { header: 'jornal_diario', key: 'jornal_diario', width: 15 },
      { header: 'telefono', key: 'telefono', width: 15 },
    ];

    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    sheet.addRow({ nombre_completo: 'Juan Carlos Mora', cedula: '0101234567', rol: 'ALBANIL', jornal_diario: 35.00, telefono: '0991234567' });
    sheet.addRow({ nombre_completo: 'Pedro Suárez', cedula: '', rol: 'AYUDANTE', jornal_diario: 25.00, telefono: '' });

    const refSheet = workbook.addWorksheet('Referencia');
    refSheet.addRow(['ROLES VÁLIDOS']);
    ['MAESTRO_MAYOR','ALBANIL','AYUDANTE','ELECTRICISTA','PLOMERO','CARPINTERO','FIERRERO','PINTOR','CHOFER','GUARDIA'].forEach(r => refSheet.addRow([r]));

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async generateCode(tipo: string): Promise<string> {
    const prefixes: Record<string, string> = {
      MATERIAL: 'MAT', TOOL: 'HER', MACHINERY: 'MAQ', CONSUMABLE: 'CON',
    };
    const prefix = prefixes[tipo] || 'PRD';
    const count = await this.prisma.product.count();
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}