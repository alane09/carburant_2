"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from '@/lib/api1'
import { Check, Clock, FileType, Upload, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

interface FileUploaderProps {
  onFileUploaded?: (success: boolean) => void
  onDataImported?: (success: boolean) => void
}

export function FileUploader({ onFileUploaded, onDataImported }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    api.upload.getVehicleTypes()
      .catch(() => toast.error('Failed to load vehicle types'))
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)

    try {
      const sheets = await api.upload.uploadFile(selectedFile)
      setSheetNames(sheets)
      if (sheets.length > 0) {
        setSelectedSheet(sheets[0])
      }
      onFileUploaded?.(true)
    } catch {
      toast.error('Failed to process file')
      onFileUploaded?.(false)
    } finally {
      setIsLoading(false)
    }
  }, [onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false
  })

  const handleImport = async () => {
    if (!file || !selectedSheet) {
      toast.error('Please select a file and sheet')
      return
    }

    setIsLoading(true)

    try {
      await api.upload.saveData(
        file,
        selectedSheet,
        new Date().getFullYear().toString(),
        undefined,
        false
      )
      toast.success('Data imported successfully')
      onDataImported?.(true)
    } catch {
      toast.error('Failed to import data')
      onDataImported?.(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the file here'
                : 'Drag and drop an Excel file, or click to select'}
            </p>
          </div>
        </div>

        {file && (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileType className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">{file.name}</span>
            </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setSheetNames([])
                  setSelectedSheet('')
                }}
              >
              <X className="h-4 w-4" />
            </Button>
          </div>

            {sheetNames.length > 0 && (
              <div className="space-y-2">
                <Label>Select Sheet</Label>
                <Select
                  value={selectedSheet}
                  onValueChange={setSelectedSheet}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleImport}
              disabled={isLoading || !selectedSheet}
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
          ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          </div>
          )}
        </div>
    </Card>
  )
}
