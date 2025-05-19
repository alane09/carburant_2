"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useData } from "@/context/data-context"
import { useTheme } from "@/context/theme-context"
import { motion } from "framer-motion"
import { Moon, Sun, Monitor, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function UserSettings() {
  const { theme, setTheme } = useTheme()
  const { userPreferences, updateUserPreference } = useData()
  
  const [username, setUsername] = useState(userPreferences.username || "")
  const [email, setEmail] = useState(userPreferences.email || "")
  
  const handleSaveProfile = () => {
    updateUserPreference("username", username)
    updateUserPreference("email", email)
    toast.success("Profil mis à jour avec succès")
  }
  
  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            <User className="mr-2 h-5 w-5 text-[#4CAF50] dark:text-[#48BB78]" />
            Profil utilisateur
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Gérer vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#4B5563] dark:text-[#E2E8F0]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] text-[#4B5563] dark:text-[#E2E8F0]"
            />
          </div>
          
          <Button 
            onClick={handleSaveProfile}
            className="bg-[#4CAF50] hover:bg-[#43A047] dark:bg-[#48BB78] dark:hover:bg-[#38A169] text-white"
          >
            Enregistrer
          </Button>
        </CardContent>
      </Card>
      
      <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
            Apparence
          </CardTitle>
          <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
            Personnaliser l'apparence de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
            className="grid grid-cols-3 gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Label
                htmlFor="light"
                className={`flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] ${
                  theme === "light"
                    ? "border-[#4CAF50] dark:border-[#48BB78]"
                    : "border-[#E5E7EB] dark:border-[#4A5568]"
                }`}
              >
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Sun className="h-6 w-6 text-[#F59E0B] dark:text-[#F6AD55]" />
                <span className="mt-2 text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                  Clair
                </span>
              </Label>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Label
                htmlFor="dark"
                className={`flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] ${
                  theme === "dark"
                    ? "border-[#4CAF50] dark:border-[#48BB78]"
                    : "border-[#E5E7EB] dark:border-[#4A5568]"
                }`}
              >
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Moon className="h-6 w-6 text-[#6366F1] dark:text-[#A5B4FC]" />
                <span className="mt-2 text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                  Sombre
                </span>
              </Label>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Label
                htmlFor="system"
                className={`flex cursor-pointer flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-[#F9FAFB] dark:hover:bg-[#2D3748] ${
                  theme === "system"
                    ? "border-[#4CAF50] dark:border-[#48BB78]"
                    : "border-[#E5E7EB] dark:border-[#4A5568]"
                }`}
              >
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <Monitor className="h-6 w-6 text-[#6B7280] dark:text-[#A0AEC0]" />
                <span className="mt-2 text-sm font-medium text-[#4B5563] dark:text-[#E2E8F0]">
                  Système
                </span>
              </Label>
            </motion.div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
