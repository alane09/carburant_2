"use client";

import { Button } from "@/components/ui/button";
import { Calculator, Edit, Loader2, Save } from "lucide-react";

interface SERControlsProps {
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onGenerate: () => void;
  onCalculateApi?: () => void;
}

export function SERControls({
  isEditing,
  isLoading,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onGenerate,
  onCalculateApi
}: SERControlsProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col space-y-2 mt-6">
          <Button 
            variant="outline"
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Générer l'équation
              </>
            )}
          </Button>
          {onCalculateApi && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCalculateApi}
              className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200 transition-all duration-300 hover:shadow-md"
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              Calculer via API
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="default"
            onClick={onSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <Button 
        onClick={onEdit}
        className="w-full"
      >
        <Edit className="mr-2 h-4 w-4" />
        Modifier les coefficients
      </Button>
    </div>
  );
}
