"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Clock, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { toast } from "sonner"

interface SettingsClientProps {
  initialSettings?: {
    dataRetention?: string;
    autoBackup?: boolean;
    analyticsEnabled?: boolean;
    exportFormat?: string;
    theme?: string;
  }
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [dataRetention, setDataRetention] = useState(initialSettings?.dataRetention || "3-months")
  const [autoBackup, setAutoBackup] = useState(initialSettings?.autoBackup !== false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialSettings?.analyticsEnabled !== false)
  const [exportFormat, setExportFormat] = useState(initialSettings?.exportFormat || "excel")
  
  const handleSaveSettings = () => {
    // Dans une application réelle, nous sauvegarderions ces paramètres via une API
    setSettingsSaved(true)
    toast.success("Paramètres sauvegardés avec succès")
    
    // Réinitialiser l'indicateur après quelques secondes
    setTimeout(() => {
      setSettingsSaved(false)
    }, 3000)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres</h3>
        <p className="text-sm text-muted-foreground">
          Configurez vos préférences et options pour l&apos;application
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Général</CardTitle>
              <CardDescription>
                Paramètres généraux de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Format d&apos;exportation par défaut</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format">
                    <SelectValue placeholder="Sélectionner un format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="analytics" className="flex flex-col space-y-1">
                  <span>Analytiques</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Nous collectons des données anonymes pour améliorer l&apos;application
                  </span>
                </Label>
                <Switch
                  id="analytics"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l&apos;apparence de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Thème</Label>
                <RadioGroup 
                  defaultValue={theme} 
                  onValueChange={setTheme}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="light" 
                      id="theme-light" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <Sun className="mb-2 h-6 w-6" />
                      Clair
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem 
                      value="dark" 
                      id="theme-dark" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <Moon className="mb-2 h-6 w-6" />
                      Sombre
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem 
                      value="system" 
                      id="theme-system" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                    >
                      <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full border-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
                      </span>
                      Système
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>
                Gérez la conservation et la sauvegarde de vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data-retention">Période de conservation des données</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger id="data-retention">
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-month">1 mois</SelectItem>
                    <SelectItem value="3-months">3 mois</SelectItem>
                    <SelectItem value="6-months">6 mois</SelectItem>
                    <SelectItem value="1-year">1 an</SelectItem>
                    <SelectItem value="forever">Indéfiniment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Les données plus anciennes seront automatiquement archivées
                </p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-backup" className="flex flex-col space-y-1">
                  <span>Sauvegarde automatique</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Sauvegarde quotidienne automatique de vos données
                  </span>
                </Label>
                <Switch
                  id="auto-backup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configurez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notif-reports" className="flex flex-col space-y-1">
                    <span>Rapports hebdomadaires</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Recevoir un résumé hebdomadaire des consommations
                    </span>
                  </Label>
                  <Switch
                    id="notif-reports"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notif-alerts" className="flex flex-col space-y-1">
                    <span>Alertes de consommation</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Être alerté des pics de consommation inhabituels
                    </span>
                  </Label>
                  <Switch
                    id="notif-alerts"
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notif-maintenance" className="flex flex-col space-y-1">
                    <span>Rappels d&apos;entretien</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Recevoir des rappels pour l&apos;entretien des véhicules
                    </span>
                  </Label>
                  <Switch
                    id="notif-maintenance"
                    defaultChecked={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="w-32">
          {settingsSaved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Sauvegardé
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </div>
    </div>
  )
}
