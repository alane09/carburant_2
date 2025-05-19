/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VehicleAPI } from "@/lib/api"
import type { VehicleRecord } from "@/types/api"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertCircle, Calendar, Download, Filter, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { UploadedFile } from "./types"
// Import the shared upload history table component
import { UploadHistoryTable, UploadedFileRecord } from "@/components/shared"

// Define the vehicle record type
export interface HistoricalRecord {
  id: string;
  date: string;
  vehicleType: string;
  vehicleId: string;
  distance: number;
  fuelConsumption: number;
  tonnage: number;
  region: string;
  driver: string;
  efficiency: number;
  consommationTEP: number;
  coutDT: number;
  ipeL100TonneKm: number;
  year: string | number;
  mois: string;
  rawValues?: Record<string, number>;
  sourceFile?: string;
  uploadDate?: string;
}

// Interface for standard API records
interface ExtendedVehicleRecord {
  id?: string;
  type?: string;
  matricule?: string;
  mois?: string;
  year?: string | number;
  annee?: string | number;
  kilometrage?: number;
  consommationL?: number;
  produitsTonnes?: number;
  region?: string;
  driver?: string;
  ipeL100km?: number;
  consommationTEP?: number;
  coutDT?: number;
  ipeL100TonneKm?: number;
  rawValues?: Record<string, number>;
  sourceFile?: string;
  uploadDate?: string;
}

interface HistoricalClientProps {
  initialData: ExtendedVehicleRecord[];
  vehicleType?: string;
  region?: string;
  year?: string;
  matricule?: string;
  availableVehicleTypes?: string[];
  availableRegions?: string[];
  error?: string;
}

export function HistoricalClient({ 
  initialData, 
  vehicleType, 
  region, 
  year,
  matricule,
  availableVehicleTypes = [],
  availableRegions = [],
  error: initialError
}: HistoricalClientProps) {
  const router = useRouter();
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  
  // Specific regions as per requirements
  const specificRegions = ["Tunis", "Mjez ELBEB"];
  
  // Filters
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicleType || "all");
  const [selectedRegion, setSelectedRegion] = useState<string>(region || "all");
  const [selectedMatricule, setSelectedMatricule] = useState<string>(matricule || "");
  const [selectedYear, setSelectedYear] = useState<string>(year || new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState<{
    type: 'year' | 'custom';
    year?: string;
    startDate?: Date;
    endDate?: Date;
  }>({
    type: 'year',
    year: year || new Date().getFullYear().toString()
  });

  // Transform initial data when component mounts
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      const transformedData: HistoricalRecord[] = initialData.map((item) => ({
        id: item.id || `record-${Math.random().toString(36).substr(2, 9)}`,
        date: formatDate(item.mois, item.year || item.annee),
        vehicleType: item.type || 'Unknown',
        vehicleId: item.matricule || 'Unknown',
        distance: item.kilometrage || 0,
        fuelConsumption: item.consommationL || 0,
        tonnage: item.produitsTonnes || 0,
        region: item.region || 'Unknown',
        driver: item.driver || 'Unknown',
        efficiency: item.ipeL100km || 0,
        consommationTEP: item.consommationTEP || 0,
        coutDT: item.coutDT || 0,
        ipeL100TonneKm: item.ipeL100TonneKm || 0,
        year: item.year || 'Unknown',
        mois: item.mois || 'Unknown',
        rawValues: item.rawValues,
        sourceFile: item.sourceFile,
        uploadDate: item.uploadDate
      }));
      
      setRecords(transformedData);
    }
  }, [initialData]);

  // Fetch uploaded files when component mounts
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  // Fetch uploaded files from MongoDB using FileHistoryAPI
  const fetchUploadedFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await fetchFileHistory();
      // Convert to the format expected by the component
      const mappedFiles: UploadedFileRecord[] = files.map(file => ({
        id: file.id,
        filename: file.filename || file.name,
        uploadDate: file.uploadDate,
        year: file.year?.toString() || new Date().getFullYear().toString(),
        size: file.size,
        recordCount: file.recordCount,
        vehicleTypes: file.vehicleType ? [file.vehicleType] : []
      }));
      setUploadedFiles(mappedFiles);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      toast.error('Erreur lors du chargement des fichiers importés');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Handle file download
  const handleFileDownload = async (id: string, filename: string) => {
    try {
      const downloadUrl = await VehicleAPI.downloadFile(id);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        toast.success('Téléchargement du fichier en cours');
      } else {
        toast.error('Erreur lors du téléchargement du fichier');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  // Handle file deletion
  const handleFileDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        const success = await VehicleAPI.deleteFile(id);
        if (success) {
          setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
          toast.success('Fichier supprimé avec succès');
        } else {
          toast.error('Erreur lors de la suppression du fichier');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Erreur lors de la suppression du fichier');
      }
    }
  };

  // Format date from month and year
  const formatDate = (month: string | undefined, year?: string | number) => {
    if (!month) return 'Unknown';
    
    // Handle different month formats (numeric, name, abbreviation)
    const monthValue = month.trim();
    
    // If it's already a formatted date, return it
    if (monthValue.includes('/') || monthValue.includes('-')) {
      return monthValue;
    }
    
    // If it's a month name, try to format it
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const monthNamesShort = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    
    let monthIndex = monthNames.findIndex(m => 
      monthValue.toLowerCase() === m.toLowerCase()
    );
    
    if (monthIndex === -1) {
      monthIndex = monthNamesShort.findIndex(m => 
        monthValue.toLowerCase() === m.toLowerCase()
      );
    }
    
    if (monthIndex !== -1) {
      return `${monthNames[monthIndex]} ${year || new Date().getFullYear()}`;
    }
    
    // If it's a numeric month, format it
    const numericMonth = parseInt(monthValue, 10);
    if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
      return `${monthNames[numericMonth - 1]} ${year || new Date().getFullYear()}`;
    }
    
    // Return the original value if we couldn't format it
    return `${monthValue} ${year || ''}`.trim();
  };

  // Fetch records based on selected filters
  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare params for the API call
      const params: Record<string, string | undefined> = {};
      
      // Add filter parameters only if they're not the default 'all' value
      if (selectedVehicleType !== "all") params.type = selectedVehicleType;
      if (selectedRegion !== "all") params.region = selectedRegion;
      if (selectedMatricule) params.matricule = selectedMatricule;
      
      // Add date filtering
      if (dateRange.type === 'year' && dateRange.year) {
        params.year = dateRange.year;
      } else if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
        params.dateFrom = format(dateRange.startDate, 'yyyy-MM-dd');
        params.dateTo = format(dateRange.endDate, 'yyyy-MM-dd');
      }
      
      console.log('Fetching historical records with params:', params);
      
      // Use VehicleAPI to get records
      const apiRecords = await VehicleAPI.getAll({ ...params }) as ExtendedVehicleRecord[];
      
      // Transform the data to match the HistoricalRecord interface, even if empty
      const transformedData: HistoricalRecord[] = apiRecords.map((item) => ({
        id: item.id || `record-${Math.random().toString(36).substr(2, 9)}`,
        date: formatDate(item.mois, item.year || item.annee),
        vehicleType: item.type || 'Unknown',
        vehicleId: item.matricule || 'Unknown',
        distance: item.kilometrage || 0,
        fuelConsumption: item.consommationL || 0,
        tonnage: item.produitsTonnes || 0,
        region: item.region || 'Unknown',
        driver: item.driver || 'Unknown',
        efficiency: item.ipeL100km || 0,
        consommationTEP: item.consommationTEP || 0,
        coutDT: item.coutDT || 0,
        ipeL100TonneKm: item.ipeL100TonneKm || 0,
        year: item.year || 'Unknown',
        mois: item.mois || 'Unknown',
        rawValues: item.rawValues,
        sourceFile: item.sourceFile,
        uploadDate: item.uploadDate
      }));
      
      setRecords(transformedData);
      
      if (transformedData.length > 0) {
        toast.success("Données historiques chargées avec succès");
      } else {
        setError('Aucune donnée trouvée avec les filtres sélectionnés');
        toast.error('Aucune donnée historique trouvée');
      }
      
      // Update URL with filters for bookmarking/sharing
      updateUrlWithFilters();
    } catch (err) {
      console.error('Error fetching records:', err);
      setError('Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données historiques');
      
      // If API call fails but we have initial data, use that as fallback
      if (initialData && initialData.length > 0) {
        // Transform initial data as fallback
        const transformedData: HistoricalRecord[] = initialData.map((item) => ({
          id: item.id || `record-${Math.random().toString(36).substr(2, 9)}`,
          date: formatDate(item.mois, item.year || item.annee),
          vehicleType: item.type || 'Unknown',
          vehicleId: item.matricule || 'Unknown',
          distance: item.kilometrage || 0,
          fuelConsumption: item.consommationL || 0,
          tonnage: item.produitsTonnes || 0,
          region: item.region || 'Unknown',
          driver: item.driver || 'Unknown',
          efficiency: item.ipeL100km || 0,
          consommationTEP: item.consommationTEP || 0,
          coutDT: item.coutDT || 0,
          ipeL100TonneKm: item.ipeL100TonneKm || 0,
          year: item.year || 'Unknown',
          mois: item.mois || 'Unknown',
          rawValues: item.rawValues,
          sourceFile: item.sourceFile,
          uploadDate: item.uploadDate
        }));
        
        setRecords(transformedData);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update URL with current filters without page reload
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams();
    
    if (selectedVehicleType !== "all") {
      params.set("type", selectedVehicleType);
    }
    
    if (selectedRegion !== "all") {
      params.set("region", selectedRegion);
    }
    
    if (dateRange.type === 'year' && dateRange.year) {
      params.set("year", dateRange.year);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
  };

  // Apply filters when user clicks search
  const handleApplyFilters = () => {
    fetchRecords();
  };

  // Reset filters to defaults
  const handleResetFilters = () => {
    setSelectedVehicleType("all");
    setSelectedRegion("all");
    setSelectedMatricule("");
    setDateRange({
      type: 'year',
      year: new Date().getFullYear().toString()
    });
    
    // Reset URL parameters
    router.push(window.location.pathname, { scroll: false });
  };

  // Export data to Excel
  const handleExport = async () => {
    try {
      toast.info("Préparation du téléchargement...");
      
      // Build export parameters
      const params: Record<string, string | undefined> = {};
      if (selectedVehicleType !== "all") params.type = selectedVehicleType;
      if (selectedRegion !== "all") params.region = selectedRegion;
      if (selectedMatricule) params.matricule = selectedMatricule;
      
      // Add date filtering
      if (dateRange.type === 'year' && dateRange.year) {
        params.year = dateRange.year;
      } else if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
        params.dateFrom = format(dateRange.startDate, 'yyyy-MM-dd');
        params.dateTo = format(dateRange.endDate, 'yyyy-MM-dd');
      }
      
      // Call export API
      const records = await VehicleAPI.getAll({ ...params });
      
      if (records.length > 0) {
        // Create a CSV string from the records
        const csvContent = "data:text/csv;charset=utf-8," + 
          "ID,Type,Matricule,Date,Région,Distance,Consommation,Tonnage,IPE\n" +
          records.map((record: VehicleRecord) => {
            return `${record.id || ''},${record.type || ''},${record.matricule || ''},${record.mois || ''}/${record.year || ''},${'N/A'},${record.kilometrage || 0},${record.consommationL || 0},${record.produitsTonnes || 0},${record.ipeL100km || 0}`;
          }).join("\n");
        
        // Encode the CSV content for URL
        const encodedContent = encodeURI(csvContent);
        
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = encodedContent;
        link.download = `historical-data-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Téléchargement démarré");
      } else {
        toast.error("Aucune donnée à exporter");
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erreur lors de l'export des données");
    }
  };

  // Filter the records based on search input
  const [searchTerm, setSearchTerm] = useState<string>('');
  const filteredData = records.filter(item => 
    searchTerm === '' || 
    item.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p>{error}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
          <CardDescription>
            Affinez votre recherche en utilisant les filtres ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Type de véhicule</label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {availableVehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Région</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  <SelectItem value="Tunis">Tunis</SelectItem>
                  <SelectItem value="Mjez ELBEB">Mjez ELBEB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Matricule</label>
              <Input
                placeholder="Rechercher par matricule"
                value={selectedMatricule}
                onChange={(e) => setSelectedMatricule(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Année</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={dateRange.type === 'year' ? dateRange.year : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setDateRange({
                        type: 'custom',
                        startDate: new Date(new Date().getFullYear(), 0, 1),
                        endDate: new Date()
                      });
                    } else {
                      setDateRange({
                        type: 'year',
                        year: value
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => {
                      const year = (new Date().getFullYear() - i).toString();
                      return (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      );
                    })}
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full animate-spin" />
                    Chargement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Rechercher
                  </span>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
            
            <Button variant="outline" onClick={handleExport} disabled={records.length === 0 || isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* File Upload History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des fichiers importés</CardTitle>
            <CardDescription>
              Liste des fichiers de données importés dans le système
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {loadingFiles ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement des fichiers...
            </div>
          ) : (
            <UploadHistoryTable 
              files={uploadedFiles}
              onViewDetails={(fileId) => handleFileDownload(fileId, uploadedFiles.find(f => f.id === fileId)?.filename || '')}
              onDownloadFile={(fileId) => handleFileDownload(fileId, uploadedFiles.find(f => f.id === fileId)?.filename || '')}
              onDeleteFile={handleFileDelete}
              variant="simple"
              showFileSize={false}
              showRecordCount={false}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Show/Hide advanced fields toggle */}
      <div className="flex justify-end mb-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAdvancedFields(!showAdvancedFields)}
        >
          {showAdvancedFields ? "Masquer les colonnes avancées" : "Afficher toutes les colonnes"}
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Données historiques</CardTitle>
            <CardDescription>
              {records.length} enregistrements trouvés
            </CardDescription>
          </div>
          
          <div className="w-full max-w-sm">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        
        <CardContent className="overflow-auto">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ID Véhicule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Distance (km)</TableHead>
                  <TableHead className="text-right">Carburant (L)</TableHead>
                  <TableHead className="text-right">Tonnage</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead className="text-right">IPE (L/100km)</TableHead>
                  {showAdvancedFields && (
                    <>
                      <TableHead className="text-right">TEP</TableHead>
                      <TableHead className="text-right">Coût (DT)</TableHead>
                      <TableHead className="text-right">IPE (L/100km·T)</TableHead>
                      <TableHead>Conducteur</TableHead>
                      <TableHead>Fichier source</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Show loading skeletons while data is being fetched
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      {Array(showAdvancedFields ? 13 : 8).fill(0).map((_, cellIndex) => (
                        <TableCell key={`loading-cell-${cellIndex}`}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showAdvancedFields ? 13 : 8} className="text-center py-4 text-muted-foreground">
                      Aucune donnée ne correspond aux critères sélectionnés
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.vehicleId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.vehicleType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.distance.toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{item.fuelConsumption.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                      <TableCell className="text-right">{item.tonnage.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                      <TableCell>{item.region}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.efficiency < 20 ? "success" : item.efficiency < 30 ? "default" : "destructive"}>
                          {item.efficiency.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                      </TableCell>
                      {showAdvancedFields && (
                        <>
                          <TableCell className="text-right">{item.consommationTEP.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">{item.coutDT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">{item.ipeL100TonneKm.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                          <TableCell>{item.driver}</TableCell>
                          <TableCell>{item.sourceFile || 'Non spécifié'}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Dernière mise à jour: {format(new Date(), "PPP 'à' HH:mm", { locale: fr })}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
