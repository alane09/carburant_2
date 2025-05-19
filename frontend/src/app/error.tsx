"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { Logo } from "@/components/ui/logo"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#171923] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#FEF2F2] dark:bg-[#3B1D1D]">
          <AlertTriangle className="h-12 w-12 text-[#EF4444] dark:text-[#F56565]" />
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-[#1F2937] dark:text-white">
          Une erreur est survenue
        </h1>
        
        <p className="mb-8 text-[#6B7280] dark:text-[#A0AEC0]">
          Désolé, une erreur inattendue s&apos;est produite. Veuillez réessayer ou contacter l&apos;administrateur si le problème persiste.
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169] text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </motion.div>
      
      <div className="mt-12">
        <Logo />
      </div>
    </div>
  )
}
