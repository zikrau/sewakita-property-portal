@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Dependency belum terpasang. Jalankan install-windows.bat terlebih dahulu.
  pause
  exit /b 1
)
echo Menjalankan SewaKita...
npm run dev
