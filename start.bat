@echo off
setlocal

set "ROOT=%~dp0"

title GreenCycle

cd /d "%ROOT%"

echo Starting GreenCycle...
echo.
echo [1/3] Starting PostgreSQL with Docker...
docker compose up -d
if errorlevel 1 goto :error

echo.
echo [2/3] Waiting for PostgreSQL on localhost:5433...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(45); while((Get-Date) -lt $deadline){ if(Test-NetConnection -ComputerName localhost -Port 5433 -InformationLevel Quiet){ exit 0 }; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo PostgreSQL did not become ready in time.
  goto :error
)

echo.
echo [3/3] Opening backend and frontend terminals...

start "GreenCycle Backend" cmd /k "cd /d ""%ROOT%server"" && call npx.cmd prisma migrate deploy && call npx.cmd prisma generate && call npm.cmd run dev"
start "GreenCycle Frontend" cmd /k "cd /d ""%ROOT%client"" && call npm.cmd run dev"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo GreenCycle is starting in separate windows.
exit /b 0

:error
echo.
echo Failed to start GreenCycle. Check Docker and your .env files.
pause
exit /b 1
