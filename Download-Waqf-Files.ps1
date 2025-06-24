# Download-Waqf-Files.ps1
# This script downloads files from the Waqf Scraper backend to your Downloads folder

# Configuration
$backendUrl = "http://localhost:5001"
$downloadFolder = "$env:USERPROFILE\Downloads"

# Function to download a file
function Download-File {
    param (
        [string]$folder,
        [string]$fileName
    )
    
    $downloadUrl = "$backendUrl/download-file?folder=$folder&file=$fileName"
    $outputPath = Join-Path -Path $downloadFolder -ChildPath "$folder-$fileName"
    
    Write-Host "Downloading $fileName from $folder to $outputPath"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath
        Write-Host "Successfully downloaded to $outputPath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error downloading file: $_" -ForegroundColor Red
        return $false
    }
}

# Function to download a ZIP file
function Download-ZipFile {
    param (
        [string]$folder
    )
    
    $downloadUrl = "$backendUrl/download-zip?folder=$folder"
    $outputPath = Join-Path -Path $downloadFolder -ChildPath "$folder.zip"
    
    Write-Host "Downloading $folder as ZIP to $outputPath"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath
        Write-Host "Successfully downloaded to $outputPath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Error downloading ZIP: $_" -ForegroundColor Red
        return $false
    }
}

# Main menu
function Show-Menu {
    Clear-Host
    Write-Host "=== Waqf Scraper Download Tool ===" -ForegroundColor Cyan
    Write-Host "1: Download WAMSI data file"
    Write-Host "2: Download WAMSI data as ZIP"
    Write-Host "3: Download test district files"
    Write-Host "4: Download test district as ZIP"
    Write-Host "5: Check scraping status"
    Write-Host "Q: Quit"
    
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" { Download-File -folder "wamsi_data" -fileName "1_MH000013_MQ001.pdf"; Pause; Show-Menu }
        "2" { Download-ZipFile -folder "wamsi_data"; Pause; Show-Menu }
        "3" { 
            Download-File -folder "test_district" -fileName "test_file_1.pdf"
            Download-File -folder "test_district" -fileName "test_file_2.pdf"
            Download-File -folder "test_district" -fileName "test_file_3.pdf"
            Pause
            Show-Menu
        }
        "4" { Download-ZipFile -folder "test_district"; Pause; Show-Menu }
        "5" { 
            Write-Host "Checking scraping status..."
            $response = Invoke-RestMethod -Uri "$backendUrl/scraping-status"
            $status = if ($response.isScrapingActive) { "ACTIVE" } else { "INACTIVE" }
            Write-Host "Scraping status: $status" -ForegroundColor Yellow
            if ($response.logs -and $response.logs.Count -gt 0) {
                Write-Host "Recent logs:" -ForegroundColor Yellow
                $response.logs | ForEach-Object { Write-Host "  $_" }
            }
            Pause
            Show-Menu
        }
        "Q" { return }
        "q" { return }
        default { Write-Host "Invalid choice, try again" -ForegroundColor Red; Pause; Show-Menu }
    }
}

# Start the menu
Show-Menu
