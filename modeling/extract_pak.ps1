# PvZ HE Pak Extractor
# XOR Key: 0xF7

param(
    [string]$PakFile = "D:\新建文件夹\pvzHE\main.pak",
    [string]$OutputDir = "D:\实训\pvz-game\modeling\extracted"
)

Write-Host "=== PvZ HE Pak Extractor ===" -ForegroundColor Cyan
Write-Host "Pak: $PakFile"
Write-Host "Output: $OutputDir"
Write-Host ""

# Create output directory
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Read pak file header (first 20MB for directory)
Write-Host "[1/4] Reading Pak file header..." -ForegroundColor Yellow
$headerBytes = 20971520  # 20MB
$stream = [System.IO.File]::OpenRead($PakFile)
$buffer = New-Object byte[] $headerBytes
$bytesRead = $stream.Read($buffer, 0, $headerBytes)
$stream.Close()
Write-Host "Read $bytesRead bytes"

# XOR decrypt
Write-Host "[2/4] XOR Decrypting (0xF7)..." -ForegroundColor Yellow
$decrypted = New-Object byte[] $bytesRead
for ($i = 0; $i -lt $bytesRead; $i++) {
    $decrypted[$i] = $buffer[$i] -bxor 0xF7
}
Write-Host "Decrypt complete"

# Convert to text
Write-Host "[3/4] Extracting file list..." -ForegroundColor Yellow
$text = [System.Text.Encoding]::ASCII.GetString($decrypted)

# Extract image files from images\ directory
$imageFiles = @{}
$pattern = "images\\([a-zA-Z0-9_]+\.(png|jpg|gif))"
$regex = [regex]::new($pattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase)
$matches = $regex.Matches($text)

foreach ($match in $matches) {
    $fileName = $match.Groups[1].Value
    if (!$imageFiles.ContainsKey($fileName)) {
        $imageFiles[$fileName] = $match.Groups[0].Value
    }
}

Write-Host "Found $($imageFiles.Count) unique image files" -ForegroundColor Green

# Show sample files
Write-Host ""
Write-Host "=== Sample Image Files ===" -ForegroundColor Cyan
$fileList = @($imageFiles.Keys) | Sort-Object
$fileList | Select-Object -First 60 | ForEach-Object { Write-Host "  $_" }

# Reanim count
$reanimPattern = "compiled\\([a-zA-Z0-9_]+\.reanim\.compiled)"
$reanimRegex = [regex]::new($reanimPattern)
$reanimMatches = $reanimRegex.Matches($text)
$reanimCount = ($reanimMatches | Measure-Object).Count
Write-Host ""
Write-Host "Reanim files: $reanimCount"

# XML count
$xmlPattern = "[a-zA-Z0-9_\\]+\.xml"
$xmlRegex = [regex]::new($xmlPattern)
$xmlMatches = $xmlRegex.Matches($text)
$xmlCount = ($xmlMatches | Measure-Object).Count
Write-Host "XML files: $xmlCount"

# Save file list
Write-Host ""
Write-Host "[4/4] Saving file list..." -ForegroundColor Yellow
$listFile = Join-Path $OutputDir "image_files.txt"
$fileList | Out-File -FilePath $listFile -Encoding UTF8

# Save all files found
$allFilesFile = Join-Path $OutputDir "all_files.txt"
$decryptedText = $text -replace '[^\x20-\x7E\r\n]', ''
$decryptedText | Out-File -FilePath $allFilesFile -Encoding ASCII

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Green
Write-Host "Image list saved to: $listFile"
Write-Host "All text saved to: $allFilesFile"

# Search for specific plant images
Write-Host ""
Write-Host "=== Plant Sprite Analysis ===" -ForegroundColor Cyan
$plantKeywords = @("Sunflower", "Peashooter", "Wallnut", "CherryBomb", "SnowPea", "Chomper", "Repeater", "Squash", "Tallnut", "Jalapeno", "Gravebuster", "Hypnoshroom", "Iceshroom", "Doomshroom", "Puffshroom", "Sunshroom", "Shroom", "Blover", "Cattail")

foreach ($kw in $plantKeywords) {
    $plantFiles = $fileList | Where-Object { $_ -match $kw -or $_ -match $kw.ToLower() }
    if (($plantFiles | Measure-Object).Count -gt 0) {
        Write-Host "[$kw] Found $($plantFiles.Count) files:"
        $plantFiles | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" }
    }
}
