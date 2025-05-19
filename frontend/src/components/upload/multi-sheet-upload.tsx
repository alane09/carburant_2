import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API } from "@/lib/api";
import { validateEmissionData } from "@/lib/emission-utils";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface SheetUpload {
  file: File;
  sheetName: string;
  year: string;
  month: string;
  status: 'pending' | 'uploading' | 'validating' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function MultiSheetUpload() {
  const [uploads, setUploads] = useState<SheetUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newUploads: SheetUpload[] = Array.from(files).map(file => ({
      file,
      sheetName: file.name.split('.')[0],
      year: new Date().getFullYear().toString(),
      month: 'all',
      status: 'pending',
      progress: 0
    }));

    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  const updateUploadStatus = useCallback((index: number, updates: Partial<SheetUpload>) => {
    setUploads(prev => prev.map((upload, i) => 
      i === index ? { ...upload, ...updates } : upload
    ));
  }, []);

  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    const pendingUploads = uploads.filter(u => u.status === 'pending');

    for (let i = 0; i < pendingUploads.length; i++) {
      const upload = pendingUploads[i];
      const index = uploads.findIndex(u => u === upload);

      try {
        // Update status to uploading
        updateUploadStatus(index, { status: 'uploading', progress: 0 });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          updateUploadStatus(index, {
            progress: Math.min(uploads[index].progress + 10, 90)
          });
        }, 500);

        // Upload file
        const success = await API.Upload.saveData(
          upload.file,
          upload.sheetName,
          upload.year,
          upload.month,
          false // replaceExisting
        );

        clearInterval(progressInterval);

        if (success) {
          // Validate data
          updateUploadStatus(index, { status: 'validating', progress: 95 });
          const records = await API.Vehicle.getRecords({
            year: upload.year,
            mois: upload.month !== 'all' ? upload.month : undefined
          });

          const validation = validateEmissionData(records);
          if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'));
          }

          updateUploadStatus(index, { status: 'success', progress: 100 });
          toast.success(`Sheet ${upload.sheetName} uploaded and validated successfully`);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        updateUploadStatus(index, {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        toast.error(`Error uploading ${upload.sheetName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsUploading(false);
  }, [uploads, updateUploadStatus]);

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Multiple Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isUploading}
          >
            Select Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={handleUpload}
            disabled={isUploading || uploads.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload All'}
          </Button>
        </div>

        <div className="space-y-4">
          {uploads.map((upload, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {upload.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {upload.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {upload.status === 'pending' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    {upload.status === 'uploading' && <Upload className="h-5 w-5 text-blue-500 animate-bounce" />}
                    <span className="font-medium">{upload.sheetName}</span>
                  </div>
                  {upload.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Progress value={upload.progress} className="h-2" />
                {upload.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{upload.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 