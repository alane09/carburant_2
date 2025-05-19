"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ReportsAPI } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import { Download, FileText, Search, Trash2 } from "lucide-react"
import { useState, useMemo, useCallback, memo } from "react"
import { toast } from "sonner"

interface SavedReport {
  id: string
  name: string
  type: string
  title: string
  format: string
  dateGenerated: string
  downloadUrl: string
}

interface ReportsListProps {
  savedReports: SavedReport[]
}

// Memoize the ReportItem component to prevent unnecessary re-renders
const ReportItem = memo(({ report, index, onDownload, onDelete }: {
  report: SavedReport;
  index: number;
  onDownload: (report: SavedReport) => void;
  onDelete: (report: SavedReport) => void;
}) => (
  <motion.div
    key={report.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.05 }}
    className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-[#4A5568] p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] transition-colors"
  >
    <div className="flex items-center space-x-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] dark:bg-[#2D3748]">
        <FileText className="h-5 w-5 text-[#4CAF50] dark:text-[#48BB78]" />
      </div>
      <div>
        <p className="font-medium text-[#4B5563] dark:text-[#E2E8F0]">
          {report.name}
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0]">
          {formatDate(report.dateGenerated)} • {report.format}
        </p>
      </div>
    </div>
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#4B5563] hover:text-[#4CAF50] dark:text-[#E2E8F0] dark:hover:text-[#48BB78]"
        title="Télécharger"
        onClick={() => onDownload(report)}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#4B5563] hover:text-[#EF4444] dark:text-[#E2E8F0] dark:hover:text-[#F56565]"
        title="Supprimer"
        onClick={() => onDelete(report)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </motion.div>
));

ReportItem.displayName = 'ReportItem';

export function ReportsList({ savedReports }: ReportsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [reports, setReports] = useState(savedReports)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null)
  
  // Update reports state when savedReports prop changes
  useMemo(() => {
    setReports(savedReports);
  }, [savedReports]);
  
  // Memoize filtered and sorted reports
  const sortedReports = useMemo(() => {
    // Filter reports based on search term
    const filtered = reports.filter((report) => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        report.name.toLowerCase().includes(searchLower) ||
        report.title.toLowerCase().includes(searchLower) ||
        report.type.toLowerCase().includes(searchLower)
      );
    });
    
    // Sort reports by date (newest first)
    return [...filtered].sort((a, b) => {
      return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime();
    });
  }, [reports, searchTerm]);
  
  // Memoize the download handler
  const handleDownload = useCallback((report: SavedReport) => {
    if (report.downloadUrl && report.downloadUrl !== "#") {
      try {
        // Create a temporary anchor element to trigger the download
        const link = document.createElement("a");
        link.href = report.downloadUrl;
        link.download = `${report.name}.${report.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Téléchargement démarré. Le rapport "${report.name}" est en cours de téléchargement.`);
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Erreur de téléchargement. Une erreur est survenue lors du téléchargement du rapport.");
      }
    } else {
      toast.error("Lien indisponible. Le lien de téléchargement pour ce rapport n'est pas disponible.");
    }
  }, []);
  
  // Memoize the confirm delete handler
  const confirmDelete = useCallback((report: SavedReport) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  }, []);
  
  // Memoize the delete handler
  const handleDelete = useCallback(async () => {
    if (!reportToDelete) return;
    
    try {
      const success = await ReportsAPI.deleteReport(reportToDelete.id);
      
      if (success) {
        // Remove the deleted report from the state
        setReports(prevReports => 
          prevReports.filter(report => report.id !== reportToDelete.id)
        );
        
        toast.success(`Rapport supprimé. Le rapport "${reportToDelete.name}" a été supprimé avec succès.`);
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erreur de suppression. Une erreur est survenue lors de la suppression du rapport.");
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  }, [reportToDelete]);
  
  return (
    <>
      <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            Rapports enregistrés
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Consultez et téléchargez vos rapports précédemment générés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#718096]" />
            <Input
              placeholder="Rechercher un rapport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
            />
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {sortedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-[#9CA3AF] dark:text-[#718096] mb-3" />
                <p className="text-[#4B5563] dark:text-[#E2E8F0] font-medium">
                  Aucun rapport trouvé
                </p>
                <p className="text-sm text-[#6B7280] dark:text-[#A0AEC0] mt-1">
                  {searchTerm ? "Essayez une autre recherche" : "Générez votre premier rapport"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReports.map((report, index) => (
                  <ReportItem
                    key={report.id}
                    report={report}
                    index={index}
                    onDownload={handleDownload}
                    onDelete={confirmDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rapport "{reportToDelete?.name}"? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
