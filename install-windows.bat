@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang. Instal Node.js 20.9+ terlebih dahulu.
  pause
  exit /b 1
)
echo Memasang dependency SewaKita...
npm install
if errorlevel 1 (
  echo.
  echo npm install gagal. Periksa koneksi internet dan coba lagi.
  pause
  exit /b 1
)
echo.
echo Selesai. Selanjutnya salin .env.example menjadi .env.local dan isi kredensial Supabase.
pause
