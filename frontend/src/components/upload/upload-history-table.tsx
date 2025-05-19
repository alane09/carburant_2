import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2, FileX, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { FileHistoryAPI } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UploadFile {
  id: string;
  date: string;
  vehicleTypes: string[];
  year: number;
  region?: string;
  [key: string]: any;
}

interface Filters {
  vehicleType?: string;
  year?: string;
  matricule?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface UploadHistoryTableProps {
  data: UploadFile[];
  filters?: Filters;
  sortConfig?: SortConfig;
}

// Helper function to render vehicle types
const renderVehicleTypes = (types: string[] | undefined): string => {
  if (!types || types.length === 0) return "Non spécifié";
  return types.join(", ");
};

const UploadHistoryTable = ({ data, filters = {}, sortConfig = { field: 'date', direction: 'desc' } }: UploadHistoryTableProps) => {
  const [filteredFiles, setFilteredFiles] = useState<UploadFile[]>(data);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string | undefined>(filters.vehicleType);
  const [sortField, setSortField] = useState<string>(sortConfig.field);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(sortConfig.direction);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadFile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const columns = [
    {
      accessorKey: "vehicleTypes",
      header: ({ column }: { column: any }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="whitespace-nowrap"
        >
          Type de véhicule
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: any }) => {
        const file = row.original;
        return <div className="font-medium">{renderVehicleTypes(file.vehicleTypes)}</div>;
      },
      filterFn: (row: any, id: string, filterValue: string) => {
        const vehicleTypes = row.getValue(id) as string[] | undefined;
        if (!vehicleTypes || vehicleTypes.length === 0) return false;

        // Check if any of the vehicle types matches the filter value
        return vehicleTypes.some((type: string) =>
          type.toLowerCase().includes(filterValue.toLowerCase())
        );
      },
      sortingFn: (rowA: any, rowB: any, columnId: string) => {
        const vehicleTypesA = rowA.getValue(columnId) as string[] | undefined;
        const vehicleTypesB = rowB.getValue(columnId) as string[] | undefined;

        // For sorting, use the first vehicle type in each array (or empty string if none)
        const typeA = vehicleTypesA && vehicleTypesA.length > 0 ? vehicleTypesA[0] : "";
        const typeB = vehicleTypesB && vehicleTypesB.length > 0 ? vehicleTypesB[0] : "";

        return typeA.localeCompare(typeB);
      }
    }
  ];

  // Apply filters when they change
  useEffect(() => {
    setVehicleTypeFilter(filters.vehicleType);
    handleFilter();
  }, [filters, data]);

  const handleFilter = () => {
    let filtered = [...data];

    // Apply vehicle type filter
    if (vehicleTypeFilter) {
      filtered = filtered.filter(
        (file) => file.vehicleTypes && file.vehicleTypes.some((type: string) => 
          type.toLowerCase().includes(vehicleTypeFilter.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered = getSortedData(filtered);

    setFilteredFiles(filtered);
  };

  const getSortedData = (dataToSort: UploadFile[]) => {
    // For vehicleTypes sort
    if (sortField === "vehicleTypes") {
      return [...dataToSort].sort((a, b) => {
        const typeA = a.vehicleTypes && a.vehicleTypes.length > 0 ? a.vehicleTypes[0] : "";
        const typeB = b.vehicleTypes && b.vehicleTypes.length > 0 ? b.vehicleTypes[0] : "";

        return sortDirection === "asc" 
          ? typeA.localeCompare(typeB) 
          : typeB.localeCompare(typeA);
      });
    }
    
    return dataToSort;
  };

  // Handle deleting a file and its associated vehicle records
  const handleDeleteFile = async (file: UploadFile) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  // Confirm deletion of file and its associated vehicle records
  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await FileHistoryAPI.deleteFile(fileToDelete.id);
      if (success) {
        toast.success(`Fichier et données associées supprimés avec succès`);
        // Remove the file from the filtered files
        setFilteredFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      } else {
        toast.error(`Erreur lors de la suppression du fichier`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Erreur lors de la suppression du fichier`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setFileToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Historique des fichiers importés</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Les fichiers supprimés effaceront également les données associées</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type de véhicule
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Année
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Région
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFiles.map((file, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {file.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {renderVehicleTypes(file.vehicleTypes)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {file.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {file.region || "Toutes les régions"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteFile(file)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileX className="h-10 w-10 text-gray-400 mb-2" />
                    <p>Aucun fichier trouvé</p>
                  </div>
                </td>
              </tr>
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
};

export default UploadHistoryTable;