"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportsAPI } from "@/lib/api"
import { BarChart4, FileCog, FileDown, FileText, LineChart, PieChart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SavedReport {
  id: string;
  title: string;
  type: string;
  format: string;
  dateGenerated: string;
  downloadUrl: string;
}

interface ReportsClientProps {
  initialReportTypes: ReportType[];
  initialSavedReports: SavedReport[];
  vehicleTypes: string[];
}

export function ReportsClient({ initialReportTypes, initialSavedReports, vehicleTypes }: ReportsClientProps) {
  const [reportTypes] = useState<ReportType[]>(initialReportTypes);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(initialSavedReports);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [dateRange, setDateRange] = useState<string>("last-month");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error("Veuillez sélectionner un type de rapport");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Calculate date range based on selection
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (dateRange) {
        case "last-month":
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
          break;
        case "last-quarter":
          startDate.setMonth(now.getMonth() - 3);
          endDate = now;
          break;
        case "last-year":
          startDate.setFullYear(now.getFullYear() - 1);
          endDate = now;
          break;
        case "ytd":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Get the selected report type details
      const reportType = reportTypes.find(r => r.id === selectedReportType);
      
      // Generate report using the API
      const result = await ReportsAPI.generateReport({
        type: selectedReportType,
        vehicleType: selectedVehicleType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        options: {
          format: selectedFormat as 'pdf' | 'excel',
          title: `${reportType?.title} - ${selectedVehicleType !== 'all' ? selectedVehicleType : 'Tous les véhicules'}`
        }
      });
      
      if (result) {
        // Add the new report to the list
        const newReport: SavedReport = {
          id: result.reportId,
          title: `${reportType?.title} - ${selectedVehicleType !== 'all' ? selectedVehicleType : 'Tous les véhicules'}`,
          type: selectedReportType,
          format: selectedFormat,
          dateGenerated: new Date().toISOString(),
          downloadUrl: result.downloadUrl
        };
        
        setSavedReports([newReport, ...savedReports]);
        toast.success("Rapport généré avec succès");
        
        // Reset selections
        setSelectedReportType("");
      } else {
        toast.error("Erreur lors de la génération du rapport");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async (report: SavedReport) => {
    try {
      // In a real app, this would trigger the download from the URL
      window.open(report.downloadUrl, '_blank');
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };
  
  const handleDelete = async (reportId: string) => {
    try {
      // Delete the report using the API
      const success = await ReportsAPI.deleteReport(reportId);
      
      if (success) {
        // Remove the report from the list
        setSavedReports(savedReports.filter(report => report.id !== reportId));
        toast.success("Rapport supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erreur lors de la suppression");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Rapports</h3>
        <p className="text-sm text-muted-foreground">
          Générez et consultez des rapports détaillés sur vos données de consommation
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Générer un rapport</CardTitle>
            <CardDescription>
              Créez un nouveau rapport personnalisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de rapport</Label>
              <RadioGroup 
                value={selectedReportType} 
                onValueChange={setSelectedReportType}
                className="grid grid-cols-1 gap-4"
              >
                {reportTypes.map((reportType) => (
                  <div key={reportType.id}>
                    <RadioGroupItem 
                      value={reportType.id} 
                      id={`report-${reportType.id}`} 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor={`report-${reportType.id}`}
                      className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <div className="flex items-center gap-4">
                        {reportType.icon}
                        <div>
                          <div className="font-medium">{reportType.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {reportType.description}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Type de véhicule</Label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger id="vehicle-type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date-range">Période</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-month">Dernier mois</SelectItem>
                  <SelectItem value="last-quarter">Dernier trimestre</SelectItem>
                  <SelectItem value="last-year">Dernière année</SelectItem>
                  <SelectItem value="ytd">Année en cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateReport} 
              disabled={!selectedReportType || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Génération en cours..." : "Générer le rapport"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Rapports sauvegardés</CardTitle>
            <CardDescription>
              Consultez et téléchargez vos rapports précédents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedReports.length === 0 ? (
              <div className="text-center py-8">
                <FileCog className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">Aucun rapport</h3>
                <p className="text-sm text-muted-foreground">
                  Générez votre premier rapport pour le voir ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {report.format === "pdf" ? (
                        <FileText className="h-8 w-8 text-red-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {report.format.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.dateGenerated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDownload(report)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDelete(report.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
