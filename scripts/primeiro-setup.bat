@echo off
REM =============================================================================
REM SIGMA - Primeiro Setup no Servidor Windows
REM =============================================================================
REM Execute APENAS na primeira vez, para configurar tudo

echo.
echo ============================================
echo   SIGMA - Primeiro Setup
echo ============================================
echo.

set BASE_DIR=C:\sigma

echo [1/8] Criando diretorios...
mkdir %BASE_DIR%\logs 2>nul

echo.
echo [2/8] Clonando repositorio...
cd /d C:\
git clone https://github.com/devpmpb/sigma.git
cd sigma

echo.
echo [3/8] Instalando dependencias do Backend...
cd backend
call npm ci

echo.
echo [4/8] Gerando Prisma Client...
call npx prisma generate

echo.
echo [5/8] Executando migrations no banco...
call npx prisma migrate deploy

echo.
echo [6/8] Criando usuario admin inicial...
call npx prisma db seed

echo.
echo [7/8] Compilando Backend...
call npm run build

echo.
echo [8/8] Compilando Frontend...
cd ..\frontend
call npm ci
call npm run build

echo.
echo ============================================
echo   Iniciando com PM2...
echo ============================================
cd ..
call pm2 start ecosystem.config.js --env production
call pm2 save
call pm2 startup

echo.
echo ============================================
echo   Setup concluido!
echo ============================================
echo.
echo PROXIMOS PASSOS:
echo 1. Configure o arquivo .env em backend\.env
echo 2. Configure o Caddy para HTTPS
echo 3. Aponte o DNS sigma.patobragado.pr.gov.br para este servidor
echo.
echo Usuario padrao: admin@sigma.com
echo Senha padrao: 123456 (TROQUE IMEDIATAMENTE!)
echo.

pause
