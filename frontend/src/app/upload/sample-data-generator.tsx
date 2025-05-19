/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { VehicleAPI, VehicleRecord } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Database, FileType, Loader2 } from "lucide-react"

export function SampleDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [vehicleType, setVehicleType] = useState("camions")
  const [year, setYear] = useState("2024")
  const [count, setCount] = useState(20)
  
  const generateSampleData = async () => {
    setIsGenerating(true)
    
    try {
      // Generate sample data for each month
      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
                     "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
      
      const sampleRecords: VehicleRecord[] = []
      
      // Generate random matricules
      const matricules = Array.from({ length: 5 }, (_, i) => 
        `${vehicleType.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`)
      
      // Generate sample records for each month and matricule
      months.forEach(month => {
        matricules.forEach(matricule => {
          // Base values with some randomization
          const kilometrage = Math.floor(5000 + Math.random() * 3000)
          const consommationL = (kilometrage / 100) * (5 + Math.random() * 3) // L/100km between 5 and 8
          const produitsTonnes = vehicleType === "camions" ? Math.floor(8 + Math.random() * 10) : 0
          const consommationTEP = consommationL * 0.00086 // TEP conversion factor
          const coutDT = consommationL * (2.5 + Math.random() * 0.5) // DT/L between 2.5 and 3
          
          // Calculate IPE metrics
          const ipeL100km = (consommationL / kilometrage) * 100
          let ipeL100TonneKm = 0
          if (produitsTonnes > 0) {
            ipeL100TonneKm = ipeL100km / (produitsTonnes / 1000)
          }
          
          // Create record
          const record: VehicleRecord = {
            type: vehicleType,
            matricule,
            mois: month,
            year,
            consommationL,
            consommationTEP,
            coutDT,
            kilometrage,
            produitsTonnes,
            ipeL100km,
            ipeL100TonneKm
          }
          
          sampleRecords.push(record)
        })
      })
      
      // Save records to database
      let savedCount = 0
      for (const record of sampleRecords) {
        try {
          const savedRecord = await VehicleAPI.saveRecord(record)
          if (savedRecord) savedCount++
        } catch (error) {
          console.error("Error saving record:", error)
        }
        
        // Update progress every 10 records
        if (savedCount % 10 === 0) {
          toast.info(`${savedCount}/${sampleRecords.length} enregistrements créés...`)
        }
      }
      
      toast.success(`${savedCount} enregistrements d'exemple ont été générés pour ${vehicleType}.`)
    } catch (error) {
      console.error("Error generating sample data:", error)
      toast.error("Erreur lors de la génération des données d'exemple.")
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Générer des données d&apos;exemple</CardTitle>
        <CardDescription>
          Créez rapidement des données d&apos;exemple pour tester l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Type de véhicule</Label>
              <Select 
                value={vehicleType} 
                onValueChange={setVehicleType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camions">Camions</SelectItem>
                  <SelectItem value="voitures">Voitures</SelectItem>
                  <SelectItem value="chariots">Chariots</SelectItem>
                  <SelectItem value="Sheet1">Sheet1 (Default)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select 
                value={year} 
                onValueChange={setYear}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="count">Nombre d&apos;enregistrements</Label>
              <Input 
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">Par défaut: 20 enregistrements</p>
            </div>
          </div>
          
          <Button 
            onClick={generateSampleData}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Générer des données d&apos;exemple
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}