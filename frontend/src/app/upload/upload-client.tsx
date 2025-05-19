"use client"

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// API Services
import { UploadAPI, VehicleAPI } from "@/lib/api"
import StorageService, { UploadedFile } from "@/lib/storage-service"
import api from '@/lib/api1'

// Icons
import { AlertCircle, Calendar, Check, FileSpreadsheet, Filter, UploadCloud, X } from "lucide-react"

// React Hooks and Libraries
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

// Type Definitions
interface UploadClientProps {
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

interface ImportOptions {
  vehicleType: string;
  year: string;
  replaceExisting: boolean;
  region: string; 
}

interface PreviewDataItem {
  [key: string]: any;
}

type SheetSelectorProps = {
  sheets: string[];
  selectedSheet: string | null;
  onSelectSheet: (sheet: string) => void;
};

type FilePreviewProps = {
  file: File;
  onCancel: () => void;
  uploading: boolean;
};

// Application Constants
const STANDARD_VEHICLE_TYPES = [
  'CAMION',
  'VOITURE',
  'CHARIOT'
];

const REGIONS = [
  'Tunis',
  'MDjez Elbeb'
];

const DEFAULT_MAX_FILE_SIZE = 100; // MB
const DEFAULT_ALLOWED_FILE_TYPES = ['.xlsx', '.xls', 'csv'];

// Local Storage Keys
const STORAGE_KEY_PARAMETERS = 'confirmedParameters';


/**
 * Sheet Selector Component
 * Displays available Excel sheets and handles selection
 */
const SheetSelector = memo(({ sheets, selectedSheet, onSelectSheet }: SheetSelectorProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
    {sheets.map((sheet, index) => {
      const isSelected = selectedSheet === sheet;
      return (
        <div 
          key={index}
          className={`p-2 border rounded-md cursor-pointer transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-card hover:border-primary/50 hover:bg-muted/20'}`}
          onClick={() => onSelectSheet(sheet)}
        >
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
            <span className="text-sm font-medium truncate">{sheet}</span>
          </div>
        </div>
      );
    })}
  </div>
));

SheetSelector.displayName = 'SheetSelector';

/**
 * File Preview Component
 * Displays selected file information and provides cancel option
 */
const FilePreview = memo(({ file, onCancel, uploading }: FilePreviewProps) => {
  // Calculate file size in MB with 2 decimal places
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-green-50 p-2 rounded-md">
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{file.name}</p>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
              {fileSizeMB} MB
            </span>
            <span className="text-xs">Excel</span>
          </div>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onCancel}
        disabled={uploading}
        className="rounded-full hover:bg-red-50 hover:text-red-500"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
});

FilePreview.displayName = 'FilePreview';

export function UploadClient() {
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load vehicle types on component mount
  useEffect(() => {
    api.upload.getVehicleTypes()
      .then(types => setVehicleTypes(types))
      .catch(error => toast.error('Failed to load vehicle types'))
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)

    try {
      const sheets = await api.upload.uploadFile(selectedFile)
      setSheetNames(sheets)
      if (sheets.length > 0) {
        setSelectedSheet(sheets[0])
      }
    } catch (error) {
      toast.error('Failed to process file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (options: ImportOptions) => {
    if (!file || !selectedSheet) {
      toast.error('Please select a file and sheet')
      return
    }
    
    setIsLoading(true)

    try {
      await api.upload.saveData(
        file,
        selectedSheet,
        options.year,
        undefined,
        options.replaceExisting
      )
      toast.success('Data imported successfully')
    } catch (error) {
      toast.error('Failed to import data')
    } finally {
      setIsLoading(false)
    }
  }

  return (
            <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Excel File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="mt-1 block w-full"
          disabled={isLoading}
                      />
                    </div>
                    
      {sheetNames.length > 0 && (
                            <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Sheet
          </label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isLoading}
          >
            {sheetNames.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
                </div>
              )}
              
      {/* Add your import options form here */}
    </div>
  )
}

// Helper to format column headers
function formatColumnHeader(key: string): string {
  const headerMappings: Record<string, string> = {
    'id': 'ID',
    'matricule': 'Matricule',
    'type': 'Type',
    'mois': 'Mois',
    'annee': 'Année',
    'year': 'Année',
    'consommationL': 'Consommation (L)',
    'consommation': 'Consommation (L)',
    'consommationTEP': 'Cons. (TEP)',
    'coutDT': 'Coût (DT)',
    'kilometrage': 'Kilométrage',
    'km': 'Kilométrage',
    'produitsTonnes': 'Tonnage',
    'tonnage': 'Tonnage',
    'ipeL100km': 'IPE (L/100km)',
    'ipe': 'IPE',
    'ipeTonne': 'IPE (tonne)',
    'driver': 'Conducteur',
    'location': 'Emplacement',
    'region': 'Région'
  };
  
  return headerMappings[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// Helper to format cell values based on column type
function formatCellValue(key: string, value: any): string {
  if (value === null || value === undefined) return '-';

  // Numeric columns
  if (typeof value === 'number') {
    // Financial or large numbers
    if (key.toLowerCase().includes('consommation') || 
        key.toLowerCase().includes('cout') || 
        key.toLowerCase().includes('kilometrage') ||
        key.toLowerCase().includes('km')) {
      return value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    // Efficiency metrics (IPE)
    if (key.toLowerCase().includes('ipe')) {
      return value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // Default number formatting
    return value.toString();
  }
  
  // Date-like string
  if (typeof value === 'string' && 
      (key.toLowerCase().includes('date') || 
       key.toLowerCase() === 'mois')) {
    return value;
  }
  
  // Default string formatting
  return value.toString();
}
