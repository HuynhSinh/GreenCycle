@echo off

echo Setting up GreenCycle...

docker compose up -d

cd server
call npm install
call npx prisma db push
call npx prisma generate

cd ..\client
call npm install

echo.
echo Setup completed.
pause