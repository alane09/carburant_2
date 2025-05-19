# Frontend Architecture Documentation

## Shared Components

### UploadHistoryTable

A unified component for displaying file upload history across the application. This component supports
multiple view modes and configurations to fit different use cases.

#### Usage

```tsx
import { UploadHistoryTable, UploadedFileRecord } from '@/components/shared';

// Sample data
const files: UploadedFileRecord[] = [
  {
    id: '1',
    filename: 'sample-file.xlsx',
    uploadDate: '2025-05-19T10:00:00',
    year: '2025',
    size: 15000,
    recordCount: 150,
    vehicleTypes: ['Car', 'Truck']
  }
];

// Example usage with detailed variant
<UploadHistoryTable
  files={files}
  onViewDetails={(id) => console.log(`View details for ${id}`)}
  onDeleteFile={(id) => console.log(`Delete file ${id}`)}
  onDownloadFile={(id) => console.log(`Download file ${id}`)}
  variant="detailed"
  showFileSize={true}
  showRecordCount={true}
/>

// Example usage with simple variant
<UploadHistoryTable
  files={files}
  onDeleteFile={(id) => console.log(`Delete file ${id}`)}
  variant="simple"
  showRegion={true}
/>
```

## Services

### FileService

A centralized service for managing file operations across the application.

#### Key Methods

- `getUploadHistory()`: Fetches the list of uploaded files
- `deleteFile(fileId)`: Deletes a file and its associated data
- `downloadFile(fileId)`: Downloads a file
- `getFileDetails(fileId)`: Gets detailed information about a file

## Hooks

### useFileManagement

A React hook that provides easy access to file management functionality.

#### Usage

```tsx
import { useFileManagement } from '@/hooks';

function MyComponent() {
  const { 
    isLoading,
    files,
    currentFile,
    fetchFileHistory,
    deleteFile,
    downloadFile,
    viewFileDetails
  } = useFileManagement();

  useEffect(() => {
    // Load files when component mounts
    fetchFileHistory();
  }, [fetchFileHistory]);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <UploadHistoryTable
          files={files}
          onDeleteFile={deleteFile}
          onDownloadFile={downloadFile}
          onViewDetails={viewFileDetails}
        />
      )}
    </div>
  );
}
```

## Code Organization Best Practices

1. **Component Structure**
   - Components should be organized by feature first, then by type
   - Shared components should be in the `components/shared` directory
   - Page-specific components should be in their respective feature directories

2. **State Management**
   - Use React hooks for local state
   - Consider using context for shared state across components
   - Keep API calls in services or hooks, not directly in components

3. **File Naming**
   - Use kebab-case for file names (e.g., `upload-history-table.tsx`)
   - Use PascalCase for component names (e.g., `UploadHistoryTable`)
   - Use camelCase for variables, functions, and instances

4. **Code Duplication**
   - Avoid duplicating components with similar functionality
   - Extract common logic into hooks or utilities
   - Use composition over inheritance for component reuse

5. **Project Configuration**
   - Keep build artifacts out of version control (use .gitignore)
   - Organize logs in a dedicated directory
   - Use environment variables for configuration
