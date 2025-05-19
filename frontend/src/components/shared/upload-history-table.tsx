"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
    AlertCircle,
    ArrowUpDown,
    Download,
    Eye,
    FileX,
    MoreHorizontal,
    Search,
    Trash,
    Trash2
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Define a universal upload file interface
export interface UploadedFileRecord {
  id: string;
  filename?: string;
  uploadDate: string;
  date?: string; // Alternative date field
  year: string | number;
  size?: number;
  recordCount?: number;
  vehicleTypes: string[];
  region?: string;
  [key: string]: any; // Allow for flexible additional properties
}

interface UploadHistoryTableProps {
  files: UploadedFileRecord[];
  onViewDetails?: (fileId: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onDownloadFile?: (fileId: string) => void;
  className?: string;
  variant?: "simple" | "detailed"; // Different UI variants
  showFileSize?: boolean;
  showRecordCount?: boolean;
  showRegion?: boolean;
  // Add support for filtering and sorting config
  initialFilters?: {
    vehicleType?: string;
    year?: string;
    region?: string;
    dateRange?: {
      from: Date | null;
      to: Date | null;
    };
  };
  initialSortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export function UploadHistoryTable({
  files,
  onViewDetails,
  onDeleteFile,
  onDownloadFile,
  className,
  variant = "detailed",
  showFileSize = true,
  showRecordCount = true,
  showRegion = false,
  initialFilters = {},
  initialSortConfig = { field: 'uploadDate', direction: 'desc' }
}: UploadHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<UploadedFileRecord | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sortField, setSortField] = useState<string>(initialSortConfig.field)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortConfig.direction)

  // Set initial filters from props
  useEffect(() => {
    if (initialFilters.vehicleType) setVehicleTypeFilter(initialFilters.vehicleType)
    if (initialFilters.year) setYearFilter(initialFilters.year)
    if (initialFilters.region) setRegionFilter(initialFilters.region)
  }, [initialFilters])

  // Get unique years from files
  const years = Array.from(
    new Set(files.map((file) => typeof file.year === 'number' ? file.year.toString() : file.year))
  ).sort().reverse()

  // Get unique vehicle types from files
  const vehicleTypes = Array.from(
    new Set(files.flatMap((file) => file.vehicleTypes))
  ).sort()

  // Get unique regions if available
  const regions = showRegion ? Array.from(
    new Set(files.map((file) => file.region || "Toutes les régions").filter(Boolean))
  ).sort() : []

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Sort function
  const getSortedData = (dataToSort: UploadedFileRecord[]) => {
    return [...dataToSort].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Handle different field types
      if (sortField === "vehicleTypes") {
        valueA = a.vehicleTypes && a.vehicleTypes.length > 0 ? a.vehicleTypes[0] : "";
        valueB = b.vehicleTypes && b.vehicleTypes.length > 0 ? b.vehicleTypes[0] : "";
      } else if (sortField === "uploadDate" || sortField === "date") {
        // Use either uploadDate or date depending on availability
        valueA = a.uploadDate || a.date || "";
        valueB = b.uploadDate || b.date || "";
      } else if (sortField === "size" || sortField === "recordCount") {
        valueA = a[sortField] || 0;
        valueB = b[sortField] || 0;
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }

      // Perform actual comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc" 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === "asc" 
          ? (valueA > valueB ? 1 : -1)
          : (valueA < valueB ? 1 : -1);
      }
    });
  };

  // Filter and sort files
  const filteredFiles = files
    .filter((file) => {
      // For string comparison, ensure we're comparing strings
      const fileYear = typeof file.year === 'number' ? file.year.toString() : file.year;
      
      const matchesSearch = file.filename 
        ? file.filename.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesYear = yearFilter === "all" || fileYear === yearFilter;
      
      const matchesVehicleType = vehicleTypeFilter === "all" || 
        (file.vehicleTypes && file.vehicleTypes.includes(vehicleTypeFilter));
      
      const matchesRegion = !showRegion || regionFilter === "all" || 
        file.region === regionFilter || 
        (!file.region && regionFilter === "Toutes les régions");

      return matchesSearch && matchesYear && matchesVehicleType && matchesRegion;
    });

  // Apply sorting
  const sortedAndFilteredFiles = getSortedData(filteredFiles);

  // Handle confirming file deletion
  const handleDeleteFile = (file: UploadedFileRecord) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  // Confirm deletion of file
  const confirmDelete = async () => {
    if (!fileToDelete || !onDeleteFile) return;
    
    setIsDeleting(true);
    try {
      await onDeleteFile(fileToDelete.id);
      toast.success(`Fichier et données associées supprimés avec succès`);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Erreur lors de la suppression du fichier`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  // Toggle sort direction
  const toggleSort = (field: string) => {
    setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  // Simple variant UI
  if (variant === "simple") {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Historique des fichiers importés</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Les fichiers supprimés effaceront également les données associées</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#718096]" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
            <SelectTrigger className="w-[150px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showRegion && (
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[150px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('uploadDate')}
                >
                  Date
                  <ArrowUpDown className="inline ml-2 h-4 w-4" />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('vehicleTypes')}
                >
                  Type de véhicule
                  <ArrowUpDown className="inline ml-2 h-4 w-4" />
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('year')}
                >
                  Année
                  <ArrowUpDown className="inline ml-2 h-4 w-4" />
                </th>
                {showRegion && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Région
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAndFilteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={showRegion ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileX className="h-10 w-10 text-gray-400 mb-2" />
                      <p>Aucun fichier trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {file.uploadDate || file.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {file.vehicleTypes?.join(", ") || "Non spécifié"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {file.year}
                    </td>
                    {showRegion && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {file.region || "Toutes les régions"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        {onViewDetails && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewDetails(file.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        )}
                        {onDownloadFile && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDownloadFile(file.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        )}
                        {onDeleteFile && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteFile(file)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le fichier et les données associées</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement le fichier et toutes les données de véhicule associées pour 
                <strong> {fileToDelete?.vehicleTypes?.[0] || 'ce type de véhicule'}</strong> de l'année 
                <strong> {fileToDelete?.year}</strong>
                {fileToDelete?.region && fileToDelete.region !== "All Regions" && (
                  <> dans la région <strong>{fileToDelete.region}</strong></>  
                )}.
                <br /><br />
                Cette action ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Detailed variant UI (card-based)
  return (
    <Card className={cn("border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] shadow-sm", className)}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
              Historique des fichiers
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
              Liste des fichiers téléchargés et leur contenu
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-[#718096]" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-[150px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
                <SelectValue placeholder="Type de véhicule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showRegion && (
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[150px] border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]">
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[#E5E7EB] dark:border-[#4A5568] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F3F4F6] dark:bg-[#374151] hover:bg-[#F3F4F6] dark:hover:bg-[#374151]">
                  <TableHead 
                    className="text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                    onClick={() => toggleSort('filename')}
                  >
                    Nom du fichier <ArrowUpDown className="inline ml-1 h-3 w-3" />
                  </TableHead>
                  <TableHead 
                    className="text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                    onClick={() => toggleSort('uploadDate')}
                  >
                    Date d'upload <ArrowUpDown className="inline ml-1 h-3 w-3" />
                  </TableHead>
                  <TableHead 
                    className="text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                    onClick={() => toggleSort('year')}
                  >
                    Année <ArrowUpDown className="inline ml-1 h-3 w-3" />
                  </TableHead>
                  {showFileSize && (
                    <TableHead 
                      className="text-right text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                      onClick={() => toggleSort('size')}
                    >
                      Taille <ArrowUpDown className="inline ml-1 h-3 w-3" />
                    </TableHead>
                  )}
                  {showRecordCount && (
                    <TableHead 
                      className="text-right text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                      onClick={() => toggleSort('recordCount')}
                    >
                      Enregistrements <ArrowUpDown className="inline ml-1 h-3 w-3" />
                    </TableHead>
                  )}
                  <TableHead 
                    className="text-[#4B5563] dark:text-[#E2E8F0] cursor-pointer"
                    onClick={() => toggleSort('vehicleTypes')}
                  >
                    Types de véhicules <ArrowUpDown className="inline ml-1 h-3 w-3" />
                  </TableHead>
                  {showRegion && (
                    <TableHead className="text-[#4B5563] dark:text-[#E2E8F0]">
                      Région
                    </TableHead>
                  )}
                  <TableHead className="text-right text-[#4B5563] dark:text-[#E2E8F0]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={6 + (showRegion ? 1 : 0) + (showFileSize ? 1 : 0) + (showRecordCount ? 1 : 0)} 
                      className="h-24 text-center text-[#6B7280] dark:text-[#A0AEC0]"
                    >
                      Aucun fichier trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredFiles.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-t border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] hover:bg-[#F9FAFB] dark:hover:bg-[#374151]"
                    >
                      <TableCell className="font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                        {file.filename || `Fichier-${file.id.substring(0, 8)}`}
                      </TableCell>
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">
                        {file.uploadDate || file.date || "N/A"}
                      </TableCell>
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">{file.year}</TableCell>
                      {showFileSize && (
                        <TableCell className="text-right text-[#4B5563] dark:text-[#E2E8F0]">
                          {file.size ? formatFileSize(file.size) : "N/A"}
                        </TableCell>
                      )}
                      {showRecordCount && (
                        <TableCell className="text-right text-[#4B5563] dark:text-[#E2E8F0]">
                          {file.recordCount || "N/A"}
                        </TableCell>
                      )}
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">
                        <div className="flex flex-wrap gap-1">
                          {file.vehicleTypes?.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center rounded-full bg-[#F3F4F6] dark:bg-[#374151] px-2 py-1 text-xs font-medium text-[#4B5563] dark:text-[#E2E8F0]"
                            >
                              {type}
                            </span>
                          )) || "Non spécifié"}
                        </div>
                      </TableCell>
                      {showRegion && (
                        <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">
                          {file.region || "Toutes les régions"}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[#6B7280] dark:text-[#A0AEC0] hover:bg-[#F3F4F6] dark:hover:bg-[#374151]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            {onViewDetails && (
                              <DropdownMenuItem onClick={() => onViewDetails(file.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Voir détails</span>
                              </DropdownMenuItem>
                            )}
                            {onDownloadFile && (
                              <DropdownMenuItem onClick={() => onDownloadFile(file.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Télécharger</span>
                              </DropdownMenuItem>
                            )}
                            {onDeleteFile && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteFile(file)}
                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Supprimer</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fichier et les données associées</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le fichier et toutes les données de véhicule associées pour 
              <strong> {fileToDelete?.vehicleTypes?.[0] || 'ce type de véhicule'}</strong> de l'année 
              <strong> {fileToDelete?.year}</strong>
              {fileToDelete?.region && fileToDelete.region !== "All Regions" && (
                <> dans la région <strong>{fileToDelete.region}</strong></>  
              )}.
              <br /><br />
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
