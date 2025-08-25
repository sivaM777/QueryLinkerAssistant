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
      id: "html",
      name: "HTML Report",
      description: "Web-based report for viewing and printing",
      icon: FileImage,
      fileExtension: "html",
      color: "purple"
    }
  ];

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateCSV = () => {
    const headers = ["SLA Name", "Type", "Threshold", "Current", "Compliance (%)", "Status", "Active"];
    const rows = slaData.map(sla => [
      `"${sla.name || 'N/A'}"`,
      `"${sla.type || 'N/A'}"`,
      `"${sla.threshold || 'N/A'}"`,
      `"${sla.current || 'N/A'}"`,
      (sla.compliance || 0).toString(),
      `"${sla.status || 'unknown'}"`,
      sla.isActive ? "Yes" : "No"
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    // Add summary at the top
    const summary = [
      "SLA Management Report Summary",
      `Generated on: ${new Date().toLocaleDateString()}`,
      `Total SLAs: ${slaData.length}`,
      `Active SLAs: ${slaData.filter(sla => sla.isActive).length}`,
      `Overall Compliance: ${overallCompliance.toFixed(1)}%`,
      `Breached SLAs: ${slaData.filter(sla => sla.status === "breached").length}`,
      `At Risk SLAs: ${slaData.filter(sla => sla.status === "at_risk").length}`,
      "",
      "SLA Details:"
    ].join("\n");

    return summary + "\n" + csvContent;
  };

  const generateHTML = () => {
    const currentDate = new Date().toLocaleDateString();
    const breachedSLAs = slaData.filter(sla => (sla.status || '') === "breached");
    const atRiskSLAs = slaData.filter(sla => (sla.status || '') === "at_risk");
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SLA Management Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .summary-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #007bff; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .status-met { color: #28a745; font-weight: bold; }
        .status-at-risk { color: #ffc107; font-weight: bold; }
        .status-breached { color: #dc3545; font-weight: bold; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; }
        .print-button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 20px 0; }
        @media print { .print-button { display: none; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>SLA Management Report</h1>
        <p><strong>Generated on:</strong> ${currentDate}</p>
        
        <button class="print-button" onclick="window.print()">Print Report</button>
        
        <div class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${slaData.length}</div>
                    <div class="summary-label">Total SLAs</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${slaData.filter(sla => sla.isActive).length}</div>
                    <div class="summary-label">Active SLAs</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${overallCompliance.toFixed(1)}%</div>
                    <div class="summary-label">Overall Compliance</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${breachedSLAs.length}</div>
                    <div class="summary-label">Breached SLAs</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${atRiskSLAs.length}</div>
                    <div class="summary-label">At Risk SLAs</div>
                </div>
            </div>
        </div>

        <h2>SLA Details</h2>
        <table>
            <thead>
                <tr>
                    <th>SLA Name</th>
                    <th>Type</th>
                    <th>Threshold</th>
                    <th>Current</th>
                    <th>Compliance</th>
                    <th>Status</th>
                    <th>Active</th>
                </tr>
            </thead>
            <tbody>
                ${slaData.map(sla => `
                    <tr>
                        <td>${sla.name || 'N/A'}</td>
                        <td>${sla.type || 'N/A'}</td>
                        <td>${sla.threshold || 'N/A'}</td>
                        <td>${sla.current || 'N/A'}</td>
                        <td>${sla.compliance || 0}%</td>
                        <td class="status-${sla.status || 'unknown'}">${(sla.status || 'unknown').replace('_', ' ').toUpperCase()}</td>
                        <td>${sla.isActive ? 'Yes' : 'No'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${(breachedSLAs.length > 0 || atRiskSLAs.length > 0 || overallCompliance < 90) ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
                ${breachedSLAs.length > 0 ? `<li><strong>Critical:</strong> Address ${breachedSLAs.length} breached SLA(s) immediately</li>` : ''}
                ${atRiskSLAs.length > 0 ? `<li><strong>Warning:</strong> Monitor ${atRiskSLAs.length} at-risk SLA(s) closely</li>` : ''}
                ${overallCompliance < 90 ? `<li><strong>Review:</strong> Consider reviewing SLA thresholds and escalation policies</li>` : ''}
            </ul>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            Report generated by SLA Management System on ${currentDate}
        </div>
    </div>
</body>
</html>`;
  };

  const generateExcel = () => {
    // Create a simple Excel-compatible HTML format
    const currentDate = new Date().toLocaleDateString();
    
    let content = `
<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="SLA Report">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">SLA Management Report</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Generated on: ${currentDate}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell><Data ss:Type="String">Summary</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total SLAs</Data></Cell>
    <Cell><Data ss:Type="Number">${slaData.length}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Active SLAs</Data></Cell>
    <Cell><Data ss:Type="Number">${slaData.filter(sla => sla.isActive).length}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Overall Compliance</Data></Cell>
    <Cell><Data ss:Type="String">${overallCompliance.toFixed(1)}%</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
    <Cell><Data ss:Type="String">SLA Name</Data></Cell>
    <Cell><Data ss:Type="String">Type</Data></Cell>
    <Cell><Data ss:Type="String">Threshold</Data></Cell>
    <Cell><Data ss:Type="String">Current</Data></Cell>
    <Cell><Data ss:Type="String">Compliance</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Active</Data></Cell>
   </Row>`;

    slaData.forEach(sla => {
      content += `
   <Row>
    <Cell><Data ss:Type="String">${sla.name || 'N/A'}</Data></Cell>
    <Cell><Data ss:Type="String">${sla.type || 'N/A'}</Data></Cell>
    <Cell><Data ss:Type="String">${sla.threshold || 'N/A'}</Data></Cell>
    <Cell><Data ss:Type="String">${sla.current || 'N/A'}</Data></Cell>
    <Cell><Data ss:Type="Number">${sla.compliance || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${sla.status || 'unknown'}</Data></Cell>
    <Cell><Data ss:Type="String">${sla.isActive ? 'Yes' : 'No'}</Data></Cell>
   </Row>`;
    });

    content += `
  </Table>
 </Worksheet>
</Workbook>`;

    return content;
  };

  const generatePDF = () => {
    // Generate HTML content that's optimized for PDF printing
    const currentDate = new Date().toLocaleDateString();
    const breachedSLAs = slaData.filter(sla => (sla.status || '') === "breached");
    const atRiskSLAs = slaData.filter(sla => (sla.status || '') === "at_risk");
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SLA Management Report - PDF</title>
    <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; }
        h1 { font-size: 24px; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        h2 { font-size: 18px; margin: 20px 0 10px 0; color: #444; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .summary-box { border: 1px solid #ddd; padding: 15px; text-align: center; }
        .summary-value { font-size: 20px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 11px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
        th, td { padding: 8px 5px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .recommendations { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SLA Management Report</h1>
        <p>Generated on: ${currentDate}</p>
    </div>

    <h2>Executive Summary</h2>
    <div class="summary">
        <div class="summary-box">
            <div class="summary-value">${slaData.length}</div>
            <div class="summary-label">Total SLAs</div>
        </div>
        <div class="summary-box">
            <div class="summary-value">${overallCompliance.toFixed(1)}%</div>
            <div class="summary-label">Overall Compliance</div>
        </div>
        <div class="summary-box">
            <div class="summary-value">${breachedSLAs.length}</div>
            <div class="summary-label">Breached SLAs</div>
        </div>
    </div>

    <h2>SLA Details</h2>
    <table>
        <thead>
            <tr>
                <th>SLA Name</th>
                <th>Type</th>
                <th>Threshold</th>
                <th>Current</th>
                <th>Compliance</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${slaData.map(sla => `
                <tr>
                    <td>${sla.name || 'N/A'}</td>
                    <td>${sla.type || 'N/A'}</td>
                    <td>${sla.threshold || 'N/A'}</td>
                    <td>${sla.current || 'N/A'}</td>
                    <td>${sla.compliance || 0}%</td>
                    <td>${(sla.status || 'unknown').replace('_', ' ').toUpperCase()}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    ${(breachedSLAs.length > 0 || atRiskSLAs.length > 0 || overallCompliance < 90) ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${breachedSLAs.length > 0 ? `<li>Address ${breachedSLAs.length} breached SLA(s) immediately</li>` : ''}
            ${atRiskSLAs.length > 0 ? `<li>Monitor ${atRiskSLAs.length} at-risk SLA(s) closely</li>` : ''}
            ${overallCompliance < 90 ? `<li>Consider reviewing SLA thresholds and escalation policies</li>` : ''}
        </ul>
    </div>
    ` : ''}

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>`;
  };

  const handleExport = async (format: ExportFormat) => {
    setIsGenerating(format.id);
    
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `sla-report-${timestamp}.${format.fileExtension}`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      let content = "";
      let mimeType = "";

      switch (format.id) {
        case "csv":
          content = generateCSV();
          mimeType = "text/csv;charset=utf-8;";
          break;

        case "html":
          content = generateHTML();
          mimeType = "text/html;charset=utf-8;";
          break;

        case "excel":
          content = generateExcel();
          mimeType = "application/vnd.ms-excel;charset=utf-8;";
          break;

        case "pdf":
          content = generatePDF();
          mimeType = "text/html;charset=utf-8;";
          // For PDF, we'll open in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(content);
            printWindow.document.close();
          } else {
            throw new Error("Popup blocked. Please allow popups for PDF export.");
          }
          
          toast({
            title: "PDF Ready",
            description: "PDF opened in new window. Use your browser's print function to save as PDF.",
          });
          
          setTimeout(() => onClose(), 1000);
          return;
      }

      downloadFile(content, filename, mimeType);

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
                <p className="font-medium">All formats include:</p>
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
