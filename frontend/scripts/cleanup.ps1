#!/usr/bin/env pwsh
# Cleanup script for frontend project
# Removes build artifacts, logs, and other unnecessary files

# Display a colored message
function Write-ColoredMessage {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColoredMessage "Starting frontend project cleanup..." "Cyan"
Write-ColoredMessage "Current directory: $(Get-Location)" "Gray"

# Create directories if they don't exist
if (-not (Test-Path -Path "logs")) {
    Write-ColoredMessage "Creating logs directory..." "Yellow"
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Move log files to the logs directory
Write-ColoredMessage "Moving log files to logs directory..." "Yellow"
$logFiles = Get-ChildItem -Path "." -Filter "*.log" -File
if ($logFiles.Count -gt 0) {
    foreach ($file in $logFiles) {
        Move-Item -Path $file.FullName -Destination "logs/" -Force
        Write-ColoredMessage "  Moved $($file.Name) to logs/" "Green"
    }
} else {
    Write-ColoredMessage "  No log files found in root directory" "Gray"
}

# Remove build artifacts
Write-ColoredMessage "Removing build artifacts..." "Yellow"
$buildDirs = @(".next", "out", "build", "dist")
foreach ($dir in $buildDirs) {
    if (Test-Path -Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-ColoredMessage "  Removed $dir directory" "Green"
    } else {
        Write-ColoredMessage "  No $dir directory found" "Gray"
    }
}

# Remove node_modules (optional - uncomment if needed)
# Write-ColoredMessage "Removing node_modules..." "Yellow"
# if (Test-Path -Path "node_modules") {
#     Remove-Item -Path "node_modules" -Recurse -Force
#     Write-ColoredMessage "  Removed node_modules directory" "Green"
# } else {
#     Write-ColoredMessage "  No node_modules directory found" "Gray"
# }

# Clean temporary files
Write-ColoredMessage "Cleaning temporary files..." "Yellow"
$tempFiles = @("*.tmp", "*.temp", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", ".DS_Store")
foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path "." -Filter $pattern -File -Recurse
    foreach ($file in $files) {
        Remove-Item -Path $file.FullName -Force
        Write-ColoredMessage "  Removed $($file.FullName)" "Green"
    }
}

# Verify .gitignore is up to date
Write-ColoredMessage "Verifying .gitignore configuration..." "Yellow"
$gitignoreContent = Get-Content -Path ".gitignore" -ErrorAction SilentlyContinue
$requiredEntries = @(
    "# dependencies",
    "/node_modules",
    "/.pnp",
    ".pnp.*",
    "# next.js",
    "/.next/",
    "/out/",
    "# production",
    "/build",
    "# logs",
    "/logs",
    "*.log",
    "# misc",
    ".DS_Store",
    "*.pem"
)

$missingEntries = @()
foreach ($entry in $requiredEntries) {    if (-not ($gitignoreContent -like "*$entry*")) {
        $missingEntries += $entry
    }
}

if ($missingEntries.Count -gt 0) {
    Write-ColoredMessage "Missing entries in .gitignore:" "Red"
    foreach ($entry in $missingEntries) {
        Write-ColoredMessage "  $entry" "Red"
    }
    Write-ColoredMessage "Please update your .gitignore file" "Red"
} else {
    Write-ColoredMessage "  .gitignore is properly configured" "Green"
}

# Summary
Write-ColoredMessage "`nCleanup completed successfully!" "Cyan"
Write-ColoredMessage "Your frontend project should now be clean and organized." "Cyan"
Write-ColoredMessage "Remember to run 'npm run build' to rebuild your project if needed." "Gray"
