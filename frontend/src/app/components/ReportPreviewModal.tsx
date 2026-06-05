import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportData: any[];
  columns: { key: string; label: string }[];
}

const formatCell = (val: any, key: string): string => {
  if (val === null || val === undefined || val === '') return '-';
  if (typeof val === 'number' && key.toLowerCase().includes('value')) {
    return `$${val.toFixed(2)}`;
  }
  if (typeof val === 'number') return String(val);
  return String(val);
};

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  reportData,
  columns
}) => {
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory Management System', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(13);
      doc.text(reportType, pageWidth / 2, 27, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        pageWidth / 2,
        34,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: 40,
        head: [columns.map(col => col.label)],
        body: reportData.map(row => columns.map(col => formatCell(row[col.key], col.key))),
        headStyles: {
          fillColor: [30, 144, 255],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 10, right: 10 },
      });

      const totalPages = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${i} of ${totalPages}  |  Inventory Management System`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }

      const filename = `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success(`${reportType} PDF downloaded`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const worksheetData = reportData.map(row => {
        const r: Record<string, any> = {};
        columns.forEach(col => {
          r[col.label] = row[col.key] ?? '-';
        });
        return r;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType.slice(0, 31));

      const filename = `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`${reportType} Excel downloaded`);
    } catch (err) {
      console.error('Excel generation error:', err);
      toast.error('Failed to generate Excel file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-blue-600" />
            Export Preview - {reportType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 pb-4 border-b">
            <Button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700">
              <FileDown className="w-4 h-4 mr-2" />
              Download as PDF
            </Button>
            <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download as Excel
            </Button>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Inventory Management System</h2>
              <h3 className="text-xl font-semibold text-gray-700 mt-2">{reportType}</h3>
              <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1E90FF]">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-white border-b">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                        No data available for this report
                      </td>
                    </tr>
                  ) : (
                    reportData.slice(0, 10).map((row, index) => (
                      <tr key={index} className={`border-b ${index % 2 === 1 ? 'bg-[#F5F7FF]' : 'bg-white'} hover:bg-gray-50`}>
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-sm text-gray-600">
                            {formatCell(row[col.key], col.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {reportData.length > 10 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Showing 10 of {reportData.length} rows. Full data included in download.
              </p>
            )}

            <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
              <p>This is a system-generated report</p>
              <p className="mt-1">Inventory Pro - Inventory Management System</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                PDF Format
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Professional layout with headers and footers</li>
                <li>• Optimized for printing (A4 landscape)</li>
                <li>• Includes company branding and page numbers</li>
                <li>• Read-only format</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel Format
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Editable spreadsheet format (.xlsx)</li>
                <li>• Supports data analysis and filtering</li>
                <li>• Compatible with Excel, Google Sheets</li>
                <li>• Can create charts and pivot tables</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
