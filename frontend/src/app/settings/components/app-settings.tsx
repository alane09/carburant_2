"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useData } from "@/context/data-context"
import { motion } from "framer-motion"
import { Database, Download, Gauge, RotateCcw, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AppSettings() {
  const { userPreferences, updateUserPreference } = useData()
  
  const [dataRetention, setDataRetention] = useState(
    userPreferences.dataRetention || "3-months"
  )
  const [autoBackup, setAutoBackup] = useState(
    userPreferences.autoBackup !== undefined ? userPreferences.autoBackup : true
  )
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    userPreferences.analyticsEnabled !== undefined ? userPreferences.analyticsEnabled : true
  )
  const [exportFormat, setExportFormat] = useState(
    userPreferences.exportFormat || "excel"
  )
  const [apiEndpoint, setApiEndpoint] = useState(
    userPreferences.apiEndpoint || "http://localhost:8080/api"
  )
  
  const handleSaveSettings = () => {
    updateUserPreference("dataRetention", dataRetention)
    updateUserPreference("autoBackup", autoBackup)
    updateUserPreference("analyticsEnabled", analyticsEnabled)
    updateUserPreference("exportFormat", exportFormat)
    updateUserPreference("apiEndpoint", apiEndpoint)
    
    toast.success("Paramètres enregistrés avec succès")
  }
  
  const handleResetSettings = () => {
    setDataRetention("3-months")
    setAutoBackup(true)
    setAnalyticsEnabled(true)
    setExportFormat("excel")
    setApiEndpoint("http://localhost:8080/api")
    
    updateUserPreference("dataRetention", "3-months")
    updateUserPreference("autoBackup", true)
    updateUserPreference("analyticsEnabled", true)
    updateUserPreference("exportFormat", "excel")
    updateUserPreference("apiEndpoint", "http://localhost:8080/api")
    
    toast.success("Paramètres réinitialisés")
  }
  
  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            <Database className="mr-2 h-5 w-5 text-[#4CAF50] dark:text-[#48BB78]" />
            Paramètres des données
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Configurer la gestion des données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data-retention" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Conservation des données
            </Label>
            <select
              id="data-retention"
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] px-3 py-2 text-sm text-[#4B5563] dark:text-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#48BB78]"
            >
              <option value="1-month">1 mois</option>
              <option value="3-months">3 mois</option>
              <option value="6-months">6 mois</option>
              <option value="1-year">1 an</option>
              <option value="forever">Indéfiniment</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-backup" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Sauvegarde automatique
            </Label>
            <Switch
              id="auto-backup"
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="analytics-enabled" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Activer les analyses
            </Label>
            <Switch
              id="analytics-enabled"
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="export-format" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Format d'export
            </Label>
            <select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] px-3 py-2 text-sm text-[#4B5563] dark:text-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#48BB78]"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            <Gauge className="mr-2 h-5 w-5 text-[#4CAF50] dark:text-[#48BB78]" />
            Paramètres avancés
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Configuration avancée de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint" className="text-[#4B5563] dark:text-[#E2E8F0]">
              URL de l'API
            </Label>
            <Input
              id="api-endpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleSaveSettings}
              className="flex-1 bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169] text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
            <Button
              variant="outline"
              onClick={handleResetSettings}
              className="border-[#E5E7EB] dark:border-[#4A5568] text-[#4B5563] dark:text-[#E2E8F0] hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
          
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full border-[#E5E7EB] dark:border-[#4A5568] text-[#4B5563] dark:text-[#E2E8F0] hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748]"
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter toutes les données
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
