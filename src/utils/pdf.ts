import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Consumidor, ObraInfo } from '../stores/consumidores';
import { getConsumidoresPreenchidos } from './consumidor-helpers';
import { buildExportFileName } from './export-helpers';

import { publicAsset } from './assets';

const BANNER_URL = publicAsset('template/banner.png');

const PHOTO_PAGE_W = 210;
const PHOTO_PAGE_H = 297;
const PHOTO_MX = 8;
const PHOTO_CONT_W = PHOTO_PAGE_W - PHOTO_MX * 2;
const PHOTO_W = PHOTO_CONT_W;
const PHOTO_H = PHOTO_W * (9.6 / 12.8);
const METER_SEC_H = 6 + 6 + PHOTO_H + 4;

const LBLUE: [number, number, number] = [189, 215, 238];
const DBLUE: [number, number, number] = [31, 73, 125];
const LGRAY: [number, number, number] = [242, 242, 242];
const GRAY: [number, number, number] = [166, 166, 166];

type DocEx = jsPDF & {
  lastAutoTable?: { finalY: number };
  internal: { getNumberOfPages(): number };
};

async function loadBannerBase64(): Promise<string> {
  const response = await fetch(BANNER_URL);
  if (!response.ok) {
    throw new Error('Banner não encontrado.');
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return `data:image/png;base64,${btoa(binary)}`;
}

function markCheckbox(active: boolean) {
  return active ? 'X' : '';
}

function buildConsumidorRow(c: Consumidor) {
  return [
    String(c.id),
    c.nome,
    c.numeroMedidor,
    markCheckbox(c.tipoLigacao === 'MO'),
    markCheckbox(c.tipoLigacao === 'BI'),
    markCheckbox(c.tipoLigacao === 'TRI'),
    markCheckbox(c.padrao === '5M'),
    markCheckbox(c.padrao === '7M'),
    markCheckbox(c.padrao === 'CPP'),
    markCheckbox(c.ramalDuplex === 'PADRAO'),
    markCheckbox(c.ramalDuplex === 'KIT'),
    markCheckbox(c.ramalTriplex === 'PADRAO'),
    markCheckbox(c.ramalTriplex === 'KIT'),
    c.posteLigacao,
    c.dataLigacao,
  ];
}

function buildObraTable(doc: jsPDF, obra: ObraInfo, startY: number) {
  autoTable(doc, {
    startY,
    theme: 'grid',
    tableWidth: 'auto',
    margin: { left: 18, right: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [189, 189, 189],
      lineWidth: 0.1,
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 88, halign: 'left' },
      2: { cellWidth: 38, fontStyle: 'bold', halign: 'left' },
      3: { cellWidth: 88, halign: 'left' },
    },
    body: [
      [
        'Descrição da Obra',
        { content: obra.descricaoObra || '—', colSpan: 3, styles: { fontStyle: 'normal' } },
      ],
      ['Fornecedor', obra.fornecedor, 'Téc da Obra', obra.tecObra],
      ['Elemento PEP', obra.elementoPep || '—', 'Regional', obra.regional],
      ['Data da Conclusão', obra.dataConclusao || '—', 'Localidade', obra.localidade || '—'],
      ['Data da Energização', obra.dataEnergizacao || '—', 'Município', obra.municipio || '—'],
    ],
  });
}

function drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text('Sem foto', x + width / 2, y + height / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function drawMeterPhotoSection(doc: jsPDF, consumidor: Consumidor, y: number): number {
  doc.setFillColor(...LBLUE);
  doc.rect(PHOTO_MX, y, PHOTO_CONT_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  doc.text('EVIDÊNCIAS FOTOGRÁFICAS:', PHOTO_MX + 2, y + 4);
  y += 6;

  const medidorLabel = consumidor.numeroMedidor.trim() || '—';
  doc.setFillColor(...LGRAY);
  doc.rect(PHOTO_MX, y, PHOTO_W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...DBLUE);
  doc.text(`MEDIDOR Nº ${medidorLabel}`, PHOTO_MX + 2, y + 4);
  y += 6;

  doc.setDrawColor(...GRAY);
  doc.rect(PHOTO_MX, y, PHOTO_W, PHOTO_H);

  if (consumidor.fotoMedidor) {
    const fmt = consumidor.fotoMedidor.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    try {
      doc.addImage(
        consumidor.fotoMedidor,
        fmt,
        PHOTO_MX + 0.5,
        y + 0.5,
        PHOTO_W - 1,
        PHOTO_H - 1,
      );
    } catch {
      drawPhotoPlaceholder(doc, PHOTO_MX, y, PHOTO_W, PHOTO_H);
    }
  } else {
    drawPhotoPlaceholder(doc, PHOTO_MX, y, PHOTO_W, PHOTO_H);
  }

  return y + PHOTO_H + 4;
}

function drawMeterPhotoPages(doc: DocEx, consumidores: Consumidor[]) {
  doc.addPage('a4', 'portrait');
  let y = PHOTO_MX;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DBLUE);
  doc.text('FOTOS DOS MEDIDORES', PHOTO_PAGE_W / 2, y + 2, { align: 'center' });
  y += 8;

  for (const consumidor of consumidores) {
    if (y + METER_SEC_H > PHOTO_PAGE_H - PHOTO_MX) {
      doc.addPage('a4', 'portrait');
      y = PHOTO_MX;
    }

    y = drawMeterPhotoSection(doc, consumidor, y);
  }
}

function addPageNumbers(doc: DocEx) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    const isPortrait = doc.internal.pageSize.getWidth() < doc.internal.pageSize.getHeight();
    const pageWidth = isPortrait ? PHOTO_PAGE_W : 297;
    const pageHeight = isPortrait ? PHOTO_PAGE_H : 210;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${page} / ${totalPages}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
  }
}

export async function exportToPdf(obra: ObraInfo, consumidores: Consumidor[]) {
  const preenchidos = getConsumidoresPreenchidos(consumidores);
  if (preenchidos.length === 0) {
    throw new Error('Nenhum consumidor preenchido para gerar o PDF.');
  }

  const banner = await loadBannerBase64();
  const fileName = buildExportFileName(obra, 'pdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as DocEx;

  doc.addImage(banner, 'PNG', 8, 6, 281, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(21, 101, 192);
  doc.text('Relação de Consumidores Ligados na Obra', 148.5, 36, { align: 'center' });

  buildObraTable(doc, obra, 40);

  const obraTableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70;

  autoTable(doc, {
    startY: obraTableEnd + 4,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: [189, 189, 189],
      lineWidth: 0.1,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [219, 234, 254],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    head: [
      [
        { content: 'Nº', rowSpan: 2 },
        { content: 'NOME', rowSpan: 2 },
        { content: 'NÚMERO DO MEDIDOR', rowSpan: 2 },
        { content: 'TIPO DE LIGAÇÃO', colSpan: 3 },
        { content: 'PADRÃO', colSpan: 3 },
        { content: 'RAMAL DUPLEX (M)', colSpan: 2 },
        { content: 'RAMAL TRIPLEX (M)', colSpan: 2 },
        { content: 'POSTE DE LIGAÇÃO', rowSpan: 2 },
        { content: 'DATA LIGAÇÃO', rowSpan: 2 },
      ],
      ['MO', 'BI', 'TRI', '5M', '7M', 'CPP', 'PADRÃO', 'KIT', 'PADRÃO', 'KIT'],
    ],
    body: preenchidos.map((consumidor) => buildConsumidorRow(consumidor)),
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 7 },
      4: { halign: 'center', cellWidth: 7 },
      5: { halign: 'center', cellWidth: 7 },
      6: { halign: 'center', cellWidth: 7 },
      7: { halign: 'center', cellWidth: 7 },
      8: { halign: 'center', cellWidth: 7 },
      9: { halign: 'center', cellWidth: 10 },
      10: { halign: 'center', cellWidth: 7 },
      11: { halign: 'center', cellWidth: 10 },
      12: { halign: 'center', cellWidth: 7 },
      13: { halign: 'center', cellWidth: 22 },
      14: { halign: 'center', cellWidth: 18 },
    },
  });

  drawMeterPhotoPages(doc, preenchidos);
  addPageNumbers(doc);

  doc.save(fileName);
  return fileName;
}
