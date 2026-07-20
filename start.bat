@echo off
title GreenCycle

start "Database" cmd /k "docker compose up"
timeout /t 3 >nul

start "Backend" cmd /k "cd /d server && npm run dev"

start "Frontend" cmd /k "cd /d client && npm run dev"