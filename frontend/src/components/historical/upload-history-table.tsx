"use client"

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
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import { ChevronDown, Download, Eye, Filter, MoreHorizontal, Search, Trash } from "lucide-react"
import { useState } from "react"

interface UploadedFile {
  id: string
  filename: string
  uploadDate: string
  year: string
  size: number
  recordCount: number
  vehicleTypes: string[]
}

interface UploadHistoryTableProps {
  files: UploadedFile[]
  onViewDetails: (fileId: string) => void
  onDeleteFile: (fileId: string) => void
  onDownloadFile: (fileId: string) => void
  className?: string
}

export function UploadHistoryTable({
  files,
  onViewDetails,
  onDeleteFile,
  onDownloadFile,
  className,
}: UploadHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all")

  // Get unique years from files
  const years = Array.from(new Set(files.map((file) => file.year))).sort().reverse()

  // Get unique vehicle types from files
  const vehicleTypes = Array.from(
    new Set(files.flatMap((file) => file.vehicleTypes))
  ).sort()

  // Filter files based on search term and filters
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = yearFilter === "all" || file.year === yearFilter
    const matchesVehicleType =
      vehicleTypeFilter === "all" || file.vehicleTypes.includes(vehicleTypeFilter)

    return matchesSearch && matchesYear && matchesVehicleType
  })

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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[#E5E7EB] dark:border-[#4A5568] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F3F4F6] dark:bg-[#374151] hover:bg-[#F3F4F6] dark:hover:bg-[#374151]">
                  <TableHead className="text-[#4B5563] dark:text-[#E2E8F0]">Nom du fichier</TableHead>
                  <TableHead className="text-[#4B5563] dark:text-[#E2E8F0]">Date d'upload</TableHead>
                  <TableHead className="text-[#4B5563] dark:text-[#E2E8F0]">Année</TableHead>
                  <TableHead className="text-right text-[#4B5563] dark:text-[#E2E8F0]">Taille</TableHead>
                  <TableHead className="text-right text-[#4B5563] dark:text-[#E2E8F0]">Enregistrements</TableHead>
                  <TableHead className="text-[#4B5563] dark:text-[#E2E8F0]">Types de véhicules</TableHead>
                  <TableHead className="text-right text-[#4B5563] dark:text-[#E2E8F0]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-[#6B7280] dark:text-[#A0AEC0]">
                      Aucun fichier trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-t border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] hover:bg-[#F9FAFB] dark:hover:bg-[#374151]"
                    >
                      <TableCell className="font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                        {file.filename}
                      </TableCell>
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">
                        {format(new Date(file.uploadDate), "dd MMM yyyy, HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">{file.year}</TableCell>
                      <TableCell className="text-right text-[#4B5563] dark:text-[#E2E8F0]">
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell className="text-right text-[#4B5563] dark:text-[#E2E8F0]">
                        {file.recordCount}
                      </TableCell>
                      <TableCell className="text-[#4B5563] dark:text-[#E2E8F0]">
                        <div className="flex flex-wrap gap-1">
                          {file.vehicleTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center rounded-full bg-[#F3F4F6] dark:bg-[#374151] px-2 py-1 text-xs font-medium text-[#4B5563] dark:text-[#E2E8F0]"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => onViewDetails(file.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Voir détails</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDownloadFile(file.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Télécharger</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteFile(file.id)}
                              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
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
    </Card>
  )
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
}
