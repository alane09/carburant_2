"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, FileQuestion } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

// Dynamically import the Logo component with no SSR to avoid hydration issues
const Logo = dynamic(() => import("@/components/ui/logo").then(mod => ({ default: mod.Logo })), {
  ssr: false
})

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#171923] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F3F4F6] dark:bg-[#2D3748]">
          <FileQuestion className="h-12 w-12 text-[#4CAF50] dark:text-[#48BB78]" />
        </div>
        
        <h1 className="mb-2 text-3xl font-bold text-[#1F2937] dark:text-white">
          Page introuvable
        </h1>
        
        <p className="mb-8 text-[#6B7280] dark:text-[#A0AEC0]">
          Désolé, la page que vous recherchez n&apos;existe pas .
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
          <Button
            asChild
            className="bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169] text-white"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </motion.div>
      
      <div className="mt-12">
        <Logo />
      </div>
    </div>
  )
}
