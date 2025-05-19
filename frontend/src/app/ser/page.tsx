"use client"

import { SERPageClient } from "./ser-page-client"
import { useEffect, useState } from "react"

export default function SERPage() {
  const [vehicleType, setVehicleType] = useState<string>('all');
  
  // Extract parameters from URL query on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const vehicleTypeParam = urlParams.get('vehicleType');
      
      if (vehicleTypeParam) {
        setVehicleType(vehicleTypeParam);
      }
    }
  }, []);
  
  return (
    <SERPageClient initialVehicleType={vehicleType} />
  )
}
