@echo off
chcp 65001 >nul
title ORTAC Geo^|Science - Akademik Asistan

echo ========================================================
echo   ORTAC Geo^|Science — Akademik Asistan v0.0.1
echo   Yapay Zeka Destekli Arastirma ve Literatur Platformu
echo ========================================================
echo.

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%dev\backend
set FRONTEND_DIR=%PROJECT_ROOT%dev\frontend
set VENV_PYTHON=%PROJECT_ROOT%dev\backend\.venv\Scripts\python.exe

echo [1/3] Backend kontrol ediliyor...
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo [+] Backend (FastAPI) baslatiliyor...
    start /B "" "%VENV_PYTHON%" "%BACKEND_DIR%\main.py"
    timeout /t 2 /nobreak >nul
) else (
    echo [i] Backend zaten calisiyor (Port 8000).
)

echo [2/3] Frontend kontrol ediliyor...
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo [+] Frontend (Vite) baslatiliyor...
    cd /d "%FRONTEND_DIR%"
    start /B cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo [i] Frontend zaten calisiyor (Port 5173).
)

echo [3/3] Masaustu Uygulama Penceresi Aciliyor...
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:5173 --name="Akademik Asistan"
) else (
    where chrome >nul 2>nul
    if %errorlevel% equ 0 (
        start chrome --app=http://localhost:5173
    ) else (
        start http://localhost:5173
    )
)

echo.
echo ========================================================
echo   Uygulama basariyla acildi!
echo   Kapatmak icin pencereyi kapatmaniz yeterlidir.
echo ========================================================
timeout /t 3 >nul
exit
