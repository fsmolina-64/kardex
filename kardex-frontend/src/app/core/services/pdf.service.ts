import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfService {

  private addHeader(doc: jsPDF, title: string, filters: string[] = []) {
    const pageWidth = doc.internal.pageSize.getWidth();


    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, pageWidth, 35, 'F');


    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(' Sistema Karvo', 14, 14);


    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 24);

    doc.setFontSize(9);
    const now = new Date().toLocaleString('es-EC');
    doc.text(`Generado: ${now}`, pageWidth - 14, 14, { align: 'right' });


    if (filters.length > 0) {
      doc.setFillColor(232, 234, 246);
      doc.rect(0, 35, pageWidth, 12, 'F');
      doc.setTextColor(57, 73, 171);
      doc.setFontSize(8);
      doc.text(`Filtros: ${filters.join(' | ')}`, 14, 43);
    }

    doc.setTextColor(0, 0, 0);
    return filters.length > 0 ? 50 : 42;
  }

  private addFooter(doc: jsPDF, observations?: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPages = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      if (observations && i === totalPages) {
        doc.setFillColor(248, 249, 255);
        doc.rect(14, pageHeight - 35, pageWidth - 28, 18, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(57, 73, 171);
        doc.text('Observaciones:', 16, pageHeight - 27);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(observations, 16, pageHeight - 22);
      }

      doc.setFillColor(26, 35, 126);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Sistema Karvo — Reporte confidencial', 14, pageHeight - 4);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 4, { align: 'right' });
    }
  }

  generateKardex(data: any[], filters: any, observations?: string) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const filterLabels = [];
    if (filters.product) filterLabels.push(`Producto: ${filters.product}`);
    if (filters.warehouse) filterLabels.push(`Bodega: ${filters.warehouse}`);
    if (filters.from) filterLabels.push(`Desde: ${filters.from}`);
    if (filters.to) filterLabels.push(`Hasta: ${filters.to}`);

    const startY = this.addHeader(doc, 'KARDEX DE INVENTARIO', filterLabels);

    autoTable(doc, {
      startY,
      head: [[
        'Fecha', 'Producto', 'Bodega', 'Tipo',
        'Ent. Cant.', 'Ent. Costo', 'Ent. Total',
        'Sal. Cant.', 'Sal. Costo', 'Sal. Total',
        'Saldo Cant.', 'Costo Prom.', 'Saldo Total'
      ]],
      body: data.map(e => [
        new Date(e.date).toLocaleDateString('es-EC'),
        e.product?.name || '',
        e.warehouse?.name || '',
        this.getTypeLabel(e.movementType),
        e.inQuantity || '-',
        e.inUnitCost ? `$${Number(e.inUnitCost).toFixed(2)}` : '-',
        e.inTotal ? `$${Number(e.inTotal).toFixed(2)}` : '-',
        e.outQuantity || '-',
        e.outUnitCost ? `$${Number(e.outUnitCost).toFixed(2)}` : '-',
        e.outTotal ? `$${Number(e.outTotal).toFixed(2)}` : '-',
        Number(e.balanceQuantity).toFixed(2),
        `$${Number(e.balanceUnitCost).toFixed(2)}`,
        `$${Number(e.balanceTotal).toFixed(2)}`,
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        4: { halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' },
        7: { halign: 'center' }, 8: { halign: 'right' }, 9: { halign: 'right' },
        10: { halign: 'center', fontStyle: 'bold' },
        11: { halign: 'right', fontStyle: 'bold' },
        12: { halign: 'right', fontStyle: 'bold' },
      },
    });

    // Totales
    const lastY = (doc as any).lastAutoTable.finalY + 4;
    const totalBalance = data.length > 0 ? data[data.length - 1].balanceTotal : 0;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(`Saldo final: $${Number(totalBalance).toFixed(2)}`, doc.internal.pageSize.getWidth() - 14, lastY, { align: 'right' });

    this.addFooter(doc, observations);
    doc.save(`kardex_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  generateProducts(data: any[], filters: any, observations?: string) {
    const doc = new jsPDF();
    const filterLabels = [];
    if (filters.search) filterLabels.push(`Búsqueda: ${filters.search}`);
    if (filters.status) filterLabels.push(`Estado: ${filters.status}`);

    const startY = this.addHeader(doc, 'LISTADO DE PRODUCTOS', filterLabels);

    autoTable(doc, {
      startY,
      head: [['Código', 'Nombre', 'Categoría', 'Unidad', 'Costo', 'Precio Venta', 'Stock', 'Mín.', 'Estado']],
      body: data.map(p => [
        p.code,
        p.name,
        p.category?.name || '-',
        p.unit?.abbreviation || '-',
        `$${Number(p.costPrice).toFixed(2)}`,
        `$${Number(p.salePrice).toFixed(2)}`,
        p.inventory?.reduce((s: number, i: any) => s + Number(i.quantity), 0) ?? 0,
        p.minStock,
        p.isActive ? 'Activo' : 'Inactivo',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        4: { halign: 'right' }, 5: { halign: 'right' },
        6: { halign: 'center' }, 7: { halign: 'center' },
        8: { halign: 'center' },
      },
    });

    doc.setFontSize(8);
    doc.setTextColor(100);
    const lastY = (doc as any).lastAutoTable.finalY + 4;
    doc.text(`Total productos: ${data.length}`, 14, lastY);

    this.addFooter(doc, observations);
    doc.save(`productos_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  generateMovements(data: any[], filters: any, observations?: string) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const filterLabels = [];
    if (filters.type) filterLabels.push(`Tipo: ${filters.type}`);
    if (filters.warehouse) filterLabels.push(`Bodega: ${filters.warehouse}`);
    if (filters.from) filterLabels.push(`Desde: ${filters.from}`);
    if (filters.to) filterLabels.push(`Hasta: ${filters.to}`);

    const startY = this.addHeader(doc, 'REPORTE DE MOVIMIENTOS', filterLabels);

    autoTable(doc, {
      startY,
      head: [['Referencia', 'Tipo', 'Documento', 'Bodega', 'Proveedor/Cliente', 'Usuario', 'Fecha', 'Total', 'Estado']],
      body: data.map(m => [
        m.referenceNumber,
        this.getTypeLabel(m.type),
        m.documentType || '-',
        m.warehouse?.name || '-',
        m.supplier?.name || m.client?.name || '-',
        m.user?.fullName || '-',
        new Date(m.movementDate).toLocaleDateString('es-EC'),
        `$${m.details?.reduce((s: number, d: any) => s + Number(d.totalCost), 0).toFixed(2) ?? '0.00'}`,
        m.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
    });

    const lastY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(`Total movimientos: ${data.length}`, 14, lastY);

    this.addFooter(doc, observations);
    doc.save(`movimientos_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  generateStockReport(data: any[], title: string, observations?: string) {
    const doc = new jsPDF();
    const startY = this.addHeader(doc, title);

    const totalValue = data.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.avgCost), 0);

    autoTable(doc, {
      startY,
      head: [['Producto', 'Código', 'Categoría', 'Bodega', 'Cantidad', 'Unidad', 'Costo Prom.', 'Valor Total']],
      body: data.map(i => [
        i.product?.name || '',
        i.product?.code || '',
        i.product?.category?.name || '-',
        i.warehouse?.name || '-',
        Number(i.quantity).toFixed(2),
        i.product?.unit?.abbreviation || '-',
        `$${Number(i.avgCost).toFixed(2)}`,
        `$${(Number(i.quantity) * Number(i.avgCost)).toFixed(2)}`,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 35, 126], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        4: { halign: 'center' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold' },
      },
    });

    const lastY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(26, 35, 126);
    doc.rect(14, lastY, doc.internal.pageSize.getWidth() - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Valor total del inventario: $${totalValue.toFixed(2)}`, doc.internal.pageSize.getWidth() - 16, lastY + 5.5, { align: 'right' });

    this.addFooter(doc, observations);
    doc.save(`reporte_${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private getTypeLabel(type: string): string {
    const labels: any = {
      ENTRADA: 'Entrada', SALIDA: 'Salida', TRASLADO: 'Traslado',
      AJUSTE_POSITIVO: 'Ajuste +', AJUSTE_NEGATIVO: 'Ajuste -',
      DEVOLUCION_COMPRA: 'Dev. Compra', DEVOLUCION_VENTA: 'Dev. Venta',
    };
    return labels[type] || type;
  }
}