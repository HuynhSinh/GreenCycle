@echo off
setlocal

set "ROOT=%~dp0"

echo.
echo ========================================
echo  GreenCycle setup
echo ========================================
echo.

cd /d "%ROOT%"

echo [1/7] Preparing environment files...
if not exist "%ROOT%server\.env" (
  copy "%ROOT%server\.env.example" "%ROOT%server\.env" >nul
  echo Created server\.env from server\.env.example
) else (
  echo server\.env already exists
)

if not exist "%ROOT%client\.env" (
  copy "%ROOT%client\.env.example" "%ROOT%client\.env" >nul
  echo Created client\.env from client\.env.example
) else (
  echo client\.env already exists
)

echo.
echo [2/7] Installing backend dependencies...
cd /d "%ROOT%server"
call npm.cmd install
if errorlevel 1 goto :error

echo.
echo [3/7] Installing frontend dependencies...
cd /d "%ROOT%client"
call npm.cmd install
if errorlevel 1 goto :error

echo.
echo [4/7] Starting PostgreSQL with Docker...
cd /d "%ROOT%"
docker compose up -d
if errorlevel 1 goto :error

echo.
echo [5/7] Waiting for PostgreSQL on localhost:5433...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(45); while((Get-Date) -lt $deadline){ if(Test-NetConnection -ComputerName localhost -Port 5433 -InformationLevel Quiet){ exit 0 }; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo PostgreSQL did not become ready in time.
  goto :error
)

echo.
echo [6/7] Applying Prisma migrations and generating client...
cd /d "%ROOT%server"
call npx.cmd prisma migrate deploy
if errorlevel 1 goto :error
call npx.cmd prisma generate
if errorlevel 1 goto :error

echo.
set /p SEED_DEMO="Seed demo data now? This resets demo tables. (Y/N): "
if /I "%SEED_DEMO%"=="Y" (
  echo.
  echo [7/7] Seeding demo data...
  call npm.cmd run seed
  if errorlevel 1 goto :error
) else (
  echo.
  echo [7/7] Skipping demo seed.
)

echo.
echo ========================================
echo  Setup completed successfully.
echo ========================================
echo.
echo Run start.bat to start GreenCycle.
pause
exit /b 0

:error
echo.
echo ========================================
echo  Setup failed. Check the message above.
echo ========================================
echo.
pause
exit /b 1
