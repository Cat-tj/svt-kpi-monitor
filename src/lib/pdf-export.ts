/**
 * Client-side PDF report generation
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportRow {
  kpi: string;
  department: string;
  value: string;
  target: string;
  achievement: string;
  period: string;
  status: string;
}

export function exportKpiReportPDF(
  rows: ReportRow[],
  meta: { title: string; period: string; generatedBy: string }
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(76, 110, 245);
  doc.text("PT Chief Level Indonesia", 14, 18);

  doc.setFontSize(13);
  doc.setTextColor(33, 37, 41);
  doc.text(meta.title, 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`Period: ${meta.period}`, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleString("id-ID")} by ${meta.generatedBy}`, 14, 39);

  // Table
  autoTable(doc, {
    startY: 45,
    head: [["KPI", "Department", "Actual", "Target", "Achievement", "Period", "Status"]],
    body: rows.map((r) => [r.kpi, r.department, r.value, r.target, r.achievement, r.period, r.status]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [76, 110, 245], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    margin: { left: 14, right: 14 },
  });

  // Footer summary
  const finalY = (doc as any).lastAutoTable.finalY || 45;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total records: ${rows.length}`, 14, finalY + 8);

  doc.save(`${meta.title.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}
