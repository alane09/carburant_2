import { Metadata } from "next"
import { SettingsClient } from "./settings-client"

export const metadata: Metadata = {
  title: "Paramètres | Facture",
  description: "Configurer les paramètres de l'application",
}

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Paramètres
        </h1>
      </div>
      
      <div>
        <SettingsClient initialSettings={{
          dataRetention: "3-months",
          autoBackup: true,
          analyticsEnabled: true,
          exportFormat: "excel",
          theme: "system"
        }} />
      </div>
    </div>
  )
}
