"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"

interface SERCoefficientInputProps {
  coefficients: {
    kilometrage: number;
    tonnage: number;
    intercept: number;
  } | null | undefined;
  onChange: (coefficients: {
    kilometrage: number;
    tonnage: number;
    intercept: number;
  }) => void;
}

export function SERCoefficientInput({
  coefficients,
  onChange,
}: SERCoefficientInputProps) {
  const [localCoefficients, setLocalCoefficients] = useState({
    kilometrage: "",
    tonnage: "",
    intercept: ""
  });

  useEffect(() => {
    if (coefficients) {
      setLocalCoefficients({
        kilometrage: coefficients.kilometrage.toString().replace('.', ','),
        tonnage: coefficients.tonnage.toString().replace('.', ','),
        intercept: coefficients.intercept.toString().replace('.', ',')
      });
    }
  }, [coefficients]);

  const handleCoefficientChange = (
    name: "kilometrage" | "tonnage" | "intercept",
    value: string
  ) => {
    // Update local state (never block input!)
    setLocalCoefficients(prev => ({
      ...prev,
      [name]: value
    }));

    // Try parsing to float with dot
    const normalized = value.replace(',', '.');

    // Only trigger onChange if valid float
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      onChange({
        ...coefficients!,
        [name]: Math.round(parsed * 100) / 100 // 2 decimal places
      });
    }
  };

  const renderField = (
    label: string,
    name: "kilometrage" | "tonnage" | "intercept",
    description: string
  ) => (
    <div className="space-y-2 mb-4">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={name}
        inputMode="decimal"
        value={localCoefficients[name]}
        onChange={(e) => handleCoefficientChange(name, e.target.value)}
        className="font-mono text-right"
        placeholder="0,00"
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold">Coefficients du modèle</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-8 w-8 p-0 bg-transparent">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Info sur les coefficients</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm">Ces coefficients déterminent l'équation de régression:</p>
                  <p className="text-sm font-mono">Y = A × X₁ + B × X₂ + C</p>
                  <p className="text-sm">où:</p>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Y est la consommation</li>
                    <li>X₁ est le kilométrage</li>
                    <li>X₂ est le tonnage transporté</li>
                    <li>A, B sont les coefficients et C est la constante</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {renderField("Coefficient kilométrage (X₁)", "kilometrage", "Impact du kilométrage sur la consommation")}
        {renderField("Coefficient tonnage (X₂)", "tonnage", "Impact du tonnage sur la consommation")}
        {renderField("Constante (C)", "intercept", "Consommation de base indépendante des variables")}
      </div>
    </div>
  );
}
