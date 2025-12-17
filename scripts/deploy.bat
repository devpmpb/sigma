@echo off
REM =============================================================================
REM SIGMA - Script de Deploy para Windows Server
REM =============================================================================
REM Execute este script no servidor após fazer git pull

echo.
echo ============================================
echo   SIGMA - Deploy Script
echo ============================================
echo.

REM Definir diretório base (ajuste conforme seu servidor)
set BASE_DIR=C:\sigma

REM Navegar para o diretório
cd /d %BASE_DIR%

echo [1/6] Atualizando codigo do Git...
git pull origin main

echo.
echo [2/6] Instalando dependencias do Backend...
cd backend
call npm ci --only=production

echo.
echo [3/6] Gerando Prisma Client...
call npx prisma generate

echo.
echo [4/6] Executando migrations do banco...
call npx prisma migrate deploy

echo.
echo [5/6] Compilando Backend (TypeScript)...
call npm run build

echo.
echo [6/6] Instalando e compilando Frontend...
cd ..\frontend
call npm ci
call npm run build

echo.
echo ============================================
echo   Reiniciando servicos com PM2...
echo ============================================
cd ..
call pm2 restart ecosystem.config.js --env production

echo.
echo ============================================
echo   Deploy concluido com sucesso!
echo ============================================
echo.
echo Verifique os logs com: pm2 logs sigma-api
echo Status dos processos: pm2 status
echo.

pause
