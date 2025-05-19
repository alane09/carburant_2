import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#171923]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#4CAF50] dark:text-[#48BB78]" />
        <p className="text-lg font-medium text-[#4B5563] dark:text-[#E2E8F0]">
          Chargement en cours...
        </p>
      </div>
    </div>
  )
}
