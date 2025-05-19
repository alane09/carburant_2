"use client"

import { StatsCard } from "@/components/stats/stats-card"
import { motion } from "framer-motion"
import { AreaChart, Droplets, Gauge, LineChart, Package, Truck } from "lucide-react"
import { DashboardStats } from "@/app/dashboard/interactive-dashboard-client"

interface StatsOverviewProps {
  stats: DashboardStats | null;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  // Default values if stats is null
  const totalConsommation = stats?.totalConsommation || 0
  const totalConsommationTEP = stats?.totalConsommationTEP || 0
  const totalKilometrage = stats?.totalKilometrage || 0
  const avgIPE = stats?.avgIPE || 0
  const totalTonnage = stats?.totalTonnage || 0
  const vehicleCount = stats?.vehicleCount || 0

  return (
    <motion.div 
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <StatsCard
          title="Consommation totale"
          value={`${(totalConsommation / 1000).toFixed(2)}k L`}
          description="Total pour la période sélectionnée"
          icon={<Droplets className="text-blue-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>
      
      <motion.div variants={item}>
        <StatsCard
          title="IPE"
          value={`${avgIPE.toFixed(2)} L/100km`}
          description="Indice de Performance Énergétique"
          icon={<Gauge className="text-green-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Kilométrage"
          value={`${(totalKilometrage / 1000).toFixed(2)}k km`}
          description="Total pour la période sélectionnée"
          icon={<LineChart className="text-purple-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Tonnage"
          value={`${totalTonnage.toFixed(2)} t`}
          description="Total pour la période sélectionnée"
          icon={<Truck className="text-amber-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Consommation en TEP"
          value={`${totalConsommationTEP.toFixed(2)} TEP`}
          description="Tonne équivalent pétrole"
          icon={<AreaChart className="text-red-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>

      <motion.div variants={item}>
        <StatsCard
          title="Nombre de véhicules"
          value={vehicleCount}
          description="Dans la sélection actuelle"
          icon={<Package className="text-yellow-500" />}
          trend={{
            value: 0,
            label: "vs période précédente",
            direction: "neutral",
          }}
          isLoading={!stats}
        />
      </motion.div>
    </motion.div>
  )
}