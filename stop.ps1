# durdur.ps1
Write-Host "=== Qwen Ortamı Kapatılıyor ===" -ForegroundColor Cyan

# 1. Toolrails durdur
Write-Host "[1/3] Toolrails durduruluyor..." -ForegroundColor Yellow
$conn = Get-NetTCPConnection -LocalPort 11500 -ErrorAction SilentlyContinue
if ($conn) { 
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "     Toolrails kapatıldı." -ForegroundColor Green
} else {
    Write-Host "     Toolrails zaten kapalı." -ForegroundColor Gray
}

# 2. Ollama modelini boşalt
Write-Host "[2/3] Model VRAM'den boşaltılıyor..." -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body '{"model":"qwen3.5:9b","keep_alive":0}' -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "     Model boşaltıldı." -ForegroundColor Green
} catch {
    Write-Host "     Model boşaltılamadı (Ollama kapalı olabilir)." -ForegroundColor Gray
}

# 3. Ollama'yı durdur
Write-Host "[3/3] Ollama durduruluyor..." -ForegroundColor Yellow
taskkill /F /IM ollama.exe 2>$null | Out-Null
taskkill /F /IM "ollama app.exe" 2>$null | Out-Null

Write-Host ""
Write-Host "=== TAMAMLANDI ===" -ForegroundColor Green
Write-Host "VRAM serbest bırakıldı. İyi oyunlar!" -ForegroundColor Cyan