import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  BarChart3,
  FileImage,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

interface SLAData {
  id: number;
  name: string;
  type: string;
  threshold: string;
  current: string;
  compliance: number;
  status: string;
  isActive: boolean;
}

interface SLAExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slaData: SLAData[];
  overallCompliance: number;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: any;
  fileExtension: string;
  color: string;
}

export default function SLAExportModal({ isOpen, onClose, slaData, overallCompliance }: SLAExportModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const exportFormats: ExportFormat[] = [
    {
      id: "pdf",
      name: "PDF Report",
      description: "Comprehensive report with charts and analytics",
      icon: FileText,
      fileExtension: "pdf",
      color: "red"
    },
    {
      id: "excel",
      name: "Excel Spreadsheet", 
      description: "Detailed data with formulas and pivot tables",
      icon: FileSpreadsheet,
      fileExtension: "xlsx",
      color: "green"
    },
    {
      id: "csv",
      name: "CSV Data",
      description: "Raw data for analysis and processing",
      icon: BarChart3,
      fileExtension: "csv", 
      color: "blue"
    },
    {
      id: "png",
      name: "Chart Image",
      description: "Visual charts and graphs as images",
      icon: FileImage,
      fileExtension: "png",
      color: "purple"
    }
  ];

  const generateCSV = () => {
    const headers = ["SLA Name", "Type", "Threshold", "Current", "Compliance (%)", "Status", "Active"];
    const rows = slaData.map(sla => [
      sla.name,
      sla.type,
      sla.threshold,
      sla.current,
      sla.compliance.toString(),
      sla.status,
      sla.isActive ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      const breachedSLAs = slaData.filter(sla => sla.status === "breached");
      const atRiskSLAs = slaData.filter(sla => sla.status === "at_risk");

      // Title
      doc.setFontSize(20);
      doc.text("SLA Management Report", 20, 30);

      // Generated date
      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 20, 45);

      // Summary section
      doc.setFontSize(16);
      doc.text("Executive Summary", 20, 65);

      doc.setFontSize(12);
      let yPos = 80;
      doc.text(`Total SLAs: ${slaData.length}`, 20, yPos);
      doc.text(`Active SLAs: ${slaData.filter(sla => sla.isActive).length}`, 20, yPos += 10);
      doc.text(`Overall Compliance: ${overallCompliance.toFixed(1)}%`, 20, yPos += 10);
      doc.text(`Breached SLAs: ${breachedSLAs.length}`, 20, yPos += 10);
      doc.text(`At Risk SLAs: ${atRiskSLAs.length}`, 20, yPos += 10);

      // SLA Details section
      yPos += 20;
      doc.setFontSize(16);
      doc.text("SLA Details", 20, yPos);

      yPos += 15;
      doc.setFontSize(10);
      doc.text("Name", 20, yPos);
      doc.text("Type", 80, yPos);
      doc.text("Threshold", 120, yPos);
      doc.text("Current", 160, yPos);
      doc.text("Compliance", 185, yPos);

      yPos += 10;

      slaData.forEach((sla, index) => {
        if (yPos > 270) { // New page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(sla.name.substring(0, 18), 20, yPos);
        doc.text(sla.type.substring(0, 10), 80, yPos);
        doc.text(sla.threshold.substring(0, 10), 120, yPos);
        doc.text(sla.current.substring(0, 8), 160, yPos);
        doc.text(`${sla.compliance}%`, 185, yPos);
        yPos += 10;
      });

      // Recommendations
      if (breachedSLAs.length > 0 || atRiskSLAs.length > 0 || overallCompliance < 90) {
        yPos += 15;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.text("Recommendations", 20, yPos);

        yPos += 15;
        doc.setFontSize(11);

        if (breachedSLAs.length > 0) {
          doc.text(`- Address ${breachedSLAs.length} breached SLA(s) immediately`, 20, yPos);
          yPos += 10;
        }
        if (atRiskSLAs.length > 0) {
          doc.text(`- Monitor ${atRiskSLAs.length} at-risk SLA(s) closely`, 20, yPos);
          yPos += 10;
        }
        if (overallCompliance < 90) {
          doc.text("- Consider reviewing SLA thresholds and escalation policies", 20, yPos);
        }
      }

      return doc;
    } catch (error) {
      console.error("Error in generatePDF:", error);
      throw error;
    }
  };

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();

    // SLA Overview sheet
    const slaOverviewData = slaData.map(sla => ({
      "SLA Name": sla.name,
      "Type": sla.type,
      "Threshold": sla.threshold,
      "Current Value": sla.current,
      "Compliance %": sla.compliance,
      "Status": sla.status,
      "Active": sla.isActive ? "Yes" : "No"
    }));
    const slaSheet = XLSX.utils.json_to_sheet(slaOverviewData);
    XLSX.utils.book_append_sheet(workbook, slaSheet, "SLA Overview");

    // Summary sheet
    const summaryData = [
      { "Metric": "Total SLAs", "Value": slaData.length },
      { "Metric": "Active SLAs", "Value": slaData.filter(sla => sla.isActive).length },
      { "Metric": "Overall Compliance", "Value": `${overallCompliance.toFixed(1)}%` },
      { "Metric": "Breached SLAs", "Value": slaData.filter(sla => sla.status === "breached").length },
      { "Metric": "At Risk SLAs", "Value": slaData.filter(sla => sla.status === "at_risk").length },
      { "Metric": "Generated Date", "Value": new Date().toLocaleDateString() }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    return workbook;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: ExportFormat) => {
    setIsGenerating(format.id);
    
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `sla-report-${timestamp}.${format.fileExtension}`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      switch (format.id) {
        case "csv":
          const csvContent = generateCSV();
          downloadFile(csvContent, filename, "text/csv");
          break;

        case "pdf":
          try {
            console.log("Starting PDF generation...");
            const pdfDoc = generatePDF();
            console.log("PDF generated successfully, saving...");
            pdfDoc.save(filename);
            console.log("PDF save called successfully");
          } catch (pdfError) {
            console.error("PDF generation error:", pdfError);
            throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`);
          }
          break;

        case "excel":
          const excelWorkbook = generateExcel();
          XLSX.writeFile(excelWorkbook, filename);
          break;

        case "png":
          // For now, show a message about chart export
          toast({
            title: "Chart Export",
            description: "Chart image export will be available in a future update",
          });
          return;
      }

      toast({
        title: "Export Successful",
        description: `SLA report exported as ${format.name}`,
      });

      // Close modal after successful export
      setTimeout(() => onClose(), 1000);

    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${format.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="sla-export-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export SLA Report</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose your preferred format to export the current SLA data and analytics
          </p>
        </DialogHeader>

        <div className="py-4">
          {/* Report Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Report Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-slate-400">Total SLAs:</span>
                <span className="ml-2 font-medium">{slaData.length}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">Active:</span>
                <span className="ml-2 font-medium">{slaData.filter(sla => sla.isActive).length}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">Compliance:</span>
                <span className="ml-2 font-medium">{overallCompliance.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">Breached:</span>
                <span className="ml-2 font-medium text-red-600">{slaData.filter(sla => sla.status === "breached").length}</span>
              </div>
            </div>
          </div>

          {/* Export Format Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Choose Export Format</h3>
            
            {exportFormats.map((format, index) => {
              const Icon = format.icon;
              const isCurrentlyGenerating = isGenerating === format.id;
              
              return (
                <motion.div
                  key={format.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all duration-200
                    hover:border-primary hover:shadow-md
                    ${isCurrentlyGenerating ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-slate-700'}
                  `}
                  onClick={() => !isCurrentlyGenerating && handleExport(format)}
                  data-testid={`export-format-${format.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-${format.color}-100 dark:bg-${format.color}-900/30 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 text-${format.color}-600 dark:text-${format.color}-400`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{format.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{format.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        .{format.fileExtension}
                      </Badge>
                      {isCurrentlyGenerating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          <span className="text-xs text-primary">Generating...</span>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium">Report includes:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Current SLA status and compliance metrics</li>
                  <li>• Breach analysis and escalation policies</li>
                  <li>• Generated on {new Date().toLocaleDateString()}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
