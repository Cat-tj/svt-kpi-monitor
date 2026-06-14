/**
 * Export utilities — Excel, CSV, PDF generation (all client-side)
 */
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToExcel(data: Record<string, any>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${filename}.xlsx`);
}

export function exportToCSV(data: Record<string, any>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${filename}.csv`);
}

export function exportToPDF(data: Record<string, any>[], columns: string[], title: string, filename: string) {
  // Dynamic import to avoid SSR issues
  import("jspdf").then(({ jsPDF }) => {
    import("jspdf-autotable").then(() => {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString("id-ID")} | PT. Sentra Visi Teknologi`, 14, 28);
      
      // Table
      const rows = data.map((row) => columns.map((col) => String(row[col] ?? "")));
      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [76, 110, 245] },
      });
      
      doc.save(`${filename}.pdf`);
    });
  });
}

export function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        resolve(jsonData as Record<string, any>[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
