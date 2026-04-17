import jsPDF from 'jspdf';

type Protocol = {
  id: string;
  meeting_date: string;
  attendees: string[];
  is_quorate: boolean;
  notes: string;
  decisions: any[];
  created_by: string;
  created_at: string;
};

type Signature = {
  id: string;
  protocol_id: string;
  user_id: string;
  signed_at: string;
};

const PAGE_MARGIN = 18;
const PAGE_WIDTH = 210; // A4
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export function exportProtocolPdf(
  protocol: Protocol,
  signatures: Signature[],
  getProfileName: (id: string) => string
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = PAGE_MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const writeWrapped = (text: string, options?: { size?: number; bold?: boolean; lineHeight?: number }) => {
    const size = options?.size ?? 11;
    const lineHeight = options?.lineHeight ?? size * 0.5;
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || '', CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, PAGE_MARGIN, y);
      y += lineHeight;
    }
  };

  const sectionTitle = (title: string) => {
    y += 3;
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(title.toUpperCase(), PAGE_MARGIN, y);
    y += 1.5;
    doc.setDrawColor(200, 200, 200);
    doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Sitzungsprotokoll der Jury', PAGE_MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Handwerkskammer Berlin – Verbesserungsvorschlagswesen (§5.6)', PAGE_MARGIN, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(150, 150, 150);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 6;

  // Meta
  const meetingDateStr = new Date(protocol.meeting_date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  writeWrapped(`Sitzungsdatum: ${meetingDateStr}`, { size: 11, bold: true });
  writeWrapped(`Beschlussfähigkeit: ${protocol.is_quorate ? 'Beschlussfähig (alle Mitglieder anwesend)' : 'Nicht beschlussfähig'}`);
  writeWrapped(`Erstellt von: ${getProfileName(protocol.created_by)} am ${new Date(protocol.created_at).toLocaleDateString('de-DE')}`);

  // Anwesende
  sectionTitle('Anwesende Mitglieder');
  if (protocol.attendees.length === 0) {
    writeWrapped('— Keine Angaben —');
  } else {
    protocol.attendees.forEach(a => writeWrapped(`• ${a}`));
  }

  // Beratung
  sectionTitle('Beratung & Notizen (vertraulich)');
  if (protocol.notes?.trim()) {
    writeWrapped(protocol.notes);
  } else {
    writeWrapped('— Keine Notizen erfasst —');
  }

  // Beschlüsse
  sectionTitle('Beschlüsse');
  const decisions = Array.isArray(protocol.decisions) ? protocol.decisions : [];
  if (decisions.length === 0) {
    writeWrapped('— Keine Beschlüsse erfasst —');
  } else {
    decisions.forEach((d: any, i: number) => {
      const text = d?.text || String(d);
      writeWrapped(`${i + 1}. ${text}`);
    });
  }

  // Unterschriften
  sectionTitle('Unterschriften');
  const protocolSigs = signatures.filter(s => s.protocol_id === protocol.id);
  if (protocolSigs.length === 0) {
    writeWrapped('— Noch keine Unterschriften —');
  } else {
    protocolSigs.forEach(sig => {
      writeWrapped(
        `✓ ${getProfileName(sig.user_id)} – unterschrieben am ${new Date(sig.signed_at).toLocaleDateString('de-DE')} um ${new Date(sig.signed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
      );
    });
  }

  // Signature lines for missing members
  y += 4;
  ensureSpace(40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Handschriftliche Unterschriften (sofern erforderlich):', PAGE_MARGIN, y);
  y += 8;
  doc.setTextColor(0, 0, 0);
  const colWidth = (CONTENT_WIDTH - 10) / 2;
  ['Leitung Personalabteilung', 'Vertretung Geschäftsführung', 'Vertretung Personalrat'].forEach((role, idx) => {
    const col = idx % 2;
    const x = PAGE_MARGIN + col * (colWidth + 10);
    if (col === 0 && idx > 0) y += 18;
    ensureSpace(18);
    doc.setDrawColor(120, 120, 120);
    doc.line(x, y + 8, x + colWidth, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(role, x, y + 12);
    doc.setTextColor(0, 0, 0);
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generiert am ${new Date().toLocaleDateString('de-DE')} – Seite ${i} von ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 8,
      { align: 'center' }
    );
  }

  doc.save(`protokoll_${protocol.meeting_date}.pdf`);
}
