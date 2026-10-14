# ============================================================
#  Cline + Qwen3.5-9B + Backend + Frontend Başlatma Script'i
#  Bağlam: 96K | KV Cache: q4_0 | Flash Attention: Açık
# ============================================================

# UTF-8 encoding (Türkçe karakterler için)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"

function Write-Step { param($msg) Write-Host "`n[+] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    !! $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "    XX: $msg" -ForegroundColor Red }

$PROJECT_ROOT    = "E:\Makale YZ"
$BACKEND_DIR     = "E:\Makale YZ\dev\backend"
$FRONTEND_DIR    = "E:\Makale YZ\dev\frontend"
$VENV_ACTIVATE   = "E:\Makale YZ\dev\backend\.venv\Scripts\Activate.ps1"

# ============================================================
# 0. ÖNCEKİ SÜREÇLERİ TEMİZLE
# ============================================================
Write-Step "Önceki süreçler kapatılıyor"

foreach ($p in @("ollama", "llama-server", "uvx")) {
    $running = Get-Process -Name $p -ErrorAction SilentlyContinue
    if ($running) {
        Stop-Process -Name $p -Force -ErrorAction SilentlyContinue
        Write-Ok "$p kapatıldı"
    }
}

# Port 8000 ve 5173 meşgul mü kontrol et
foreach ($port in @(8000, 5173)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $procId = $conn.OwningProcess | Select-Object -First 1
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Write-Ok "Port $port serbest bırakıldı"
    }
}

Start-Sleep -Seconds 3

# ============================================================
# 1. OLLAMA ORTAM DEĞİŞKENLERİ
# ============================================================
Write-Step "Ollama ortam değişkenleri ayarlanıyor"

$env:OLLAMA_KEEP_ALIVE      = "40m"
$env:OLLAMA_NUM_PARALLEL    = "1"
$env:OLLAMA_CONTEXT_LENGTH  = "98304"    # 96K
$env:OLLAMA_KV_CACHE_TYPE   = "q4_0"     # VRAM tasarrufu
$env:OLLAMA_FLASH_ATTENTION = "1"

Write-Ok "OLLAMA_CONTEXT_LENGTH  = 98304 (96K)"
Write-Ok "OLLAMA_KV_CACHE_TYPE   = q4_0"
Write-Ok "OLLAMA_FLASH_ATTENTION = 1"
Write-Ok "OLLAMA_KEEP_ALIVE      = 40m"
Write-Ok "OLLAMA_NUM_PARALLEL    = 1"

# ============================================================
# 2. OLLAMA'YI BAŞLAT
# ============================================================
Write-Step "Ollama başlatılıyor"
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden

$maxWait = 30; $waited = 0
while ($waited -lt $maxWait) {
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 2
        Write-Ok "Ollama API hazır (http://localhost:11434)"
        break
    } catch { Start-Sleep -Seconds 2; $waited += 2 }
}
if ($waited -ge $maxWait) { Write-Warn "Ollama API yanıt vermedi" }

# ============================================================
# 3. MODELİ ÖN YÜKLE (96K)
# ============================================================
Write-Step "Qwen3.5-9B VRAM'e yükleniyor (96K bağlam)"

try {
    $body = @{
        model      = "qwen3.5:9b"
        prompt     = ""
        keep_alive = "40m"
        options    = @{ num_ctx = 98304 }
    } | ConvertTo-Json -Depth 5

    $null = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
                              -Method Post -Body $body `
                              -ContentType "application/json" `
                              -TimeoutSec 120
    Write-Ok "Model yüklendi ve VRAM'de"
} catch {
    Write-Warn "Model ön yükleme başarısız: $_"
}

# ============================================================
# 4. TOOLRAILS PROXY
# ============================================================
Write-Step "Toolrails proxy başlatılıyor (port 11500)"

Start-Process -FilePath "uvx" `
              -ArgumentList "toolrails", "--ollama", "http://localhost:11434", "--port", "11500" `
              -WindowStyle Minimized

$maxWait = 30; $waited = 0
while ($waited -lt $maxWait) {
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:11500/v1/models" -TimeoutSec 2
        Write-Ok "Toolrails hazır: $($resp.data.id -join ', ')"
        break
    } catch { Start-Sleep -Seconds 2; $waited += 2 }
}
if ($waited -ge $maxWait) { Write-Warn "Toolrails yanıt vermedi" }

# ============================================================
# 5. BACKEND SUNUCUSU (FastAPI)
# ============================================================
Write-Step "Backend sunucusu başlatılıyor (port 8000)"

if (Test-Path $BACKEND_DIR) {
    $backendCmd = @"
`$host.UI.RawUI.WindowTitle = 'Backend - FastAPI (port 8000)'
Set-Location -Path '$BACKEND_DIR'
if (Test-Path '$VENV_ACTIVATE') {
    & '$VENV_ACTIVATE'
    Write-Host 'Sanal ortam aktif.' -ForegroundColor Green
} else {
    Write-Host 'UYARI: .venv bulunamadı!' -ForegroundColor Yellow
}
Write-Host 'Backend başlatılıyor...' -ForegroundColor Cyan
python -m uvicorn main:app --reload --port 8000
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Write-Ok "Backend başlatıldı: http://localhost:8000"
    Start-Sleep -Seconds 5
} else {
    Write-Err "Backend dizini bulunamadı: $BACKEND_DIR"
}

# ============================================================
# 6. FRONTEND SUNUCUSU (Vite)
# ============================================================
Write-Step "Frontend sunucusu başlatılıyor (port 5173)"

if (Test-Path $FRONTEND_DIR) {
    $frontendCmd = @"
`$host.UI.RawUI.WindowTitle = 'Frontend - Vite (port 5173)'
Set-Location -Path '$FRONTEND_DIR'
if (-not (Test-Path 'node_modules')) {
    Write-Host 'node_modules yok, npm install yapılıyor...' -ForegroundColor Yellow
    npm install
}
Write-Host 'Frontend başlatılıyor...' -ForegroundColor Cyan
npm run dev
"@
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Write-Ok "Frontend başlatıldı: http://localhost:5173"
} else {
    Write-Err "Frontend dizini bulunamadı: $FRONTEND_DIR"
}

# ============================================================
# 7. VS CODE
# ============================================================
Write-Step "VS Code açılıyor"
if (Test-Path $PROJECT_ROOT) {
    Start-Process -FilePath "code" -ArgumentList $PROJECT_ROOT
    Write-Ok "VS Code açıldı: $PROJECT_ROOT"
} else {
    Write-Warn "Proje yolu bulunamadı: $PROJECT_ROOT"
}

# ============================================================
# 8. ÖZET
# ============================================================
Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  Kurulum hazır!" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Ollama API      : http://localhost:11434" -ForegroundColor White
Write-Host "  Toolrails Proxy : http://localhost:11500/v1" -ForegroundColor White
Write-Host "  Backend         : http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend        : http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Bağlam Penceresi: 98304 (96K)" -ForegroundColor White
Write-Host "  KV Cache        : q4_0" -ForegroundColor White
Write-Host ""
Write-Host "  Cline Ayarlarını Kontrol Edin:" -ForegroundColor Yellow
Write-Host "    - Context Window = 98304" -ForegroundColor Yellow
Write-Host "    - Base URL       = http://localhost:11500/v1" -ForegroundColor Yellow
Write-Host "    - Model          = qwen3.5:9b" -ForegroundColor Yellow
Write-Host ""
Write-Host "  NOT: Chrome GPU hızlandırma kapalı olmalı" -ForegroundColor Cyan
Write-Host "       (chrome://settings/system)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Durdurmak için: .\stop.ps1" -ForegroundColor Green
Write-Host ""