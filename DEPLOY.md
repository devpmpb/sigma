# 🚀 Guia de Deploy - SIGMA

**Sistema Integrado de Gestão Municipal de Atividades**

Este documento contém todas as instruções para fazer deploy do sistema SIGMA em um **Windows Server** com **IIS** e **PM2**.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Servidor](#preparação-do-servidor)
3. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
4. [Deploy do Banco de Dados](#deploy-do-banco-de-dados)
5. [Deploy do Backend](#deploy-do-backend)
6. [Deploy do Frontend](#deploy-do-frontend)
7. [Configuração do IIS](#configuração-do-iis)
8. [Testes e Verificação](#testes-e-verificação)
9. [Manutenção e Atualizações](#manutenção-e-atualizações)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário no Servidor:

- [x] **Windows Server** (2016, 2019 ou 2022)
- [x] **Node.js** versão 18+ ([Download](https://nodejs.org/))
- [x] **PostgreSQL** versão 12+ ([Download](https://www.postgresql.org/download/windows/))
- [x] **Git** ([Download](https://git-scm.com/download/win))
- [x] **IIS** (Internet Information Services) - Já vem no Windows Server
- [x] **URL Rewrite para IIS** ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
- [x] **Application Request Routing (ARR)** ([Download](https://www.iis.net/downloads/microsoft/application-request-routing))

### Portas Necessárias:

- **80** - HTTP (IIS)
- **443** - HTTPS (IIS) - recomendado para produção
- **3001** - Backend Node.js (apenas localhost)
- **5432** - PostgreSQL (apenas localhost)

---

## 🖥️ Preparação do Servidor

### 1. Instalar Node.js

```powershell
# Verificar instalação
node --version  # Deve mostrar v18.x.x ou superior
npm --version
```

### 2. Instalar PostgreSQL

```powershell
# Após instalação, verificar
psql --version

# Adicionar ao PATH se necessário
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### 3. Instalar PM2 Globalmente

```powershell
# Abrir PowerShell como Administrador
npm install -g pm2
npm install -g pm2-windows-service

# Verificar instalação
pm2 --version
```

### 4. Habilitar IIS

```powershell
# PowerShell como Administrador
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
```

### 5. Instalar URL Rewrite e ARR no IIS

1. Baixar e instalar [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Baixar e instalar [Application Request Routing](https://www.iis.net/downloads/microsoft/application-request-routing)
3. Abrir IIS Manager
4. Selecionar o servidor
5. Abrir "Application Request Routing Cache"
6. Clicar em "Server Proxy Settings"
7. Marcar ✅ "Enable proxy"

### 6. Criar Estrutura de Diretórios

```powershell
# Criar diretórios
New-Item -ItemType Directory -Path "C:\inetpub\sigma" -Force
New-Item -ItemType Directory -Path "C:\logs\sigma" -Force

# Dar permissões
icacls "C:\inetpub\sigma" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\logs\sigma" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

---

## 🔐 Configuração de Variáveis de Ambiente

### ⚠️ IMPORTANTE: Gerar Secrets Seguros

```powershell
# Gerar JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# COPIE E GUARDE esses valores em local seguro!
```

### Configurar Variáveis no Windows Server

```powershell
# Abrir PowerShell como Administrador

# Banco de Dados
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://sigma_user:SENHA_FORTE_AQUI@localhost:5432/sigma_prod", "Machine")

# JWT Secrets (usar os valores gerados acima)
[Environment]::SetEnvironmentVariable("JWT_SECRET", "SEU_JWT_SECRET_GERADO", "Machine")
[Environment]::SetEnvironmentVariable("JWT_REFRESH_SECRET", "SEU_JWT_REFRESH_SECRET_GERADO", "Machine")

# Configurações de Token
[Environment]::SetEnvironmentVariable("JWT_EXPIRES_IN", "15m", "Machine")
[Environment]::SetEnvironmentVariable("JWT_REFRESH_EXPIRES_IN", "7d", "Machine")

# Ambiente
[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Machine")
[Environment]::SetEnvironmentVariable("PORT", "3001", "Machine")

# URLs
[Environment]::SetEnvironmentVariable("APP_URL", "https://sigma.prefeitura.gov.br", "Machine")
[Environment]::SetEnvironmentVariable("FRONTEND_URL", "https://sigma.prefeitura.gov.br", "Machine")

# Segurança
[Environment]::SetEnvironmentVariable("BCRYPT_ROUNDS", "12", "Machine")
[Environment]::SetEnvironmentVariable("MAX_LOGIN_ATTEMPTS", "5", "Machine")
[Environment]::SetEnvironmentVariable("LOCKOUT_TIME", "30", "Machine")

# REINICIAR PowerShell após definir variáveis
exit
```

### Verificar Variáveis

```powershell
# Verificar se foram definidas
Get-ChildItem Env: | Where-Object { $_.Name -like "*JWT*" -or $_.Name -like "*DATABASE*" }
```

---

## 🗄️ Deploy do Banco de Dados

### 1. Criar Banco de Dados e Usuário

```powershell
# Conectar ao PostgreSQL como postgres
psql -U postgres

# No prompt do PostgreSQL:
```

```sql
-- Criar banco de dados
CREATE DATABASE sigma_prod;

-- Criar usuário
CREATE USER sigma_user WITH PASSWORD 'SENHA_FORTE_AQUI';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE sigma_prod TO sigma_user;

-- Conectar ao banco
\c sigma_prod

-- Dar permissões no schema public
GRANT ALL ON SCHEMA public TO sigma_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sigma_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sigma_user;

-- Sair
\q
```

### 2. Testar Conexão

```powershell
# Testar se consegue conectar
psql -U sigma_user -d sigma_prod -h localhost

# Se pedir senha, digitar a senha configurada
# Se conectar com sucesso, sair com \q
```

---

## 🔨 Deploy do Backend

### 1. Clonar Repositório

```powershell
cd C:\inetpub
git clone https://github.com/seu-usuario/sigma.git sigma

# Ou copiar arquivos via FTP/RDP
```

### 2. Instalar Dependências

```powershell
cd C:\inetpub\sigma\backend
npm install --production
```

### 3. Build da Aplicação

```powershell
npm run build
```

### 4. Executar Migrations

```powershell
# As variáveis de ambiente já estão configuradas no sistema
npm run migrate:deploy
```

### 5. Seed Inicial (apenas primeira vez)

```powershell
npm run db:seed
```

**⚠️ IMPORTANTE**: O seed cria usuários padrão com senha `123456`. **ALTERE AS SENHAS IMEDIATAMENTE!**

```sql
-- Conectar ao banco e verificar usuários criados
psql -U sigma_user -d sigma_prod

SELECT id, nome, email FROM "Usuario";
```

### 6. Configurar PM2 como Serviço

```powershell
# PowerShell como Administrador
cd C:\inetpub\sigma\backend

# Instalar PM2 como serviço do Windows
pm2-service-install -n PM2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração (importante!)
pm2 save

# Verificar status
pm2 status
pm2 logs
```

### 7. Verificar Backend

```powershell
# Testar se backend está respondendo
curl http://localhost:3001/api/auth/login
```

Deve retornar erro 400 (esperado, pois não enviamos credenciais).

---

## 🎨 Deploy do Frontend

### 1. Build do Frontend

```powershell
cd C:\inetpub\sigma\frontend
npm install
npm run build
```

### 2. Copiar para IIS

```powershell
# Criar diretório se não existir
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\sigma" -Force

# Copiar arquivos do build
xcopy /E /Y dist\* C:\inetpub\wwwroot\sigma\

# Copiar web.config
copy web.config C:\inetpub\wwwroot\sigma\

# Dar permissões
icacls "C:\inetpub\wwwroot\sigma" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

---

## 🌐 Configuração do IIS

### 1. Criar Site no IIS

```powershell
# Via PowerShell (Administrador)
Import-Module WebAdministration

# Criar Application Pool
New-WebAppPool -Name "SigmaAppPool"
Set-ItemProperty IIS:\AppPools\SigmaAppPool -name "managedRuntimeVersion" -value ""

# Criar Site
New-WebSite -Name "SIGMA" `
            -Port 80 `
            -PhysicalPath "C:\inetpub\wwwroot\sigma" `
            -ApplicationPool "SigmaAppPool"

# Iniciar Site
Start-WebSite -Name "SIGMA"
```

### 2. Configurar via Interface Gráfica (Alternativa)

1. Abrir **IIS Manager** (Gerenciador do IIS)
2. Expandir servidor → Sites
3. Clicar com botão direito em "Sites" → "Add Website"
4. Preencher:
   - **Site name**: SIGMA
   - **Physical path**: `C:\inetpub\wwwroot\sigma`
   - **Binding**: HTTP, porta 80
   - **Host name**: (deixar vazio ou colocar domínio)
5. Clicar "OK"

### 3. Configurar HTTPS (Produção)

```powershell
# Obter certificado SSL (Let's Encrypt, Certificado da prefeitura, etc)

# Adicionar binding HTTPS
New-WebBinding -Name "SIGMA" -Protocol https -Port 443

# Associar certificado (via IIS Manager)
# 1. Selecionar site SIGMA
# 2. "Bindings" → "Add"
# 3. Type: https, Port: 443
# 4. Selecionar certificado SSL
```

### 4. Verificar Proxy Reverso

1. IIS Manager → Selecionar site SIGMA
2. Abrir "URL Rewrite"
3. Verificar se existem 2 regras:
   - ✅ "API Proxy"
   - ✅ "SPA Routes"

---

## ✅ Testes e Verificação

### 1. Testar Backend (Diretamente)

```powershell
# Testar healthcheck ou endpoint público
curl http://localhost:3001/api/auth/login
```

### 2. Testar Frontend (via IIS)

```powershell
# Testar página principal
curl http://localhost

# Deve retornar HTML do React
```

### 3. Testar Integração Completa

1. Abrir navegador
2. Acessar `http://localhost` (ou IP/domínio do servidor)
3. Tentar fazer login:
   - Email: `admin@sigma.com`
   - Senha: `123456` (ou a senha que você alterou)
4. Verificar se consegue acessar o sistema

### 4. Verificar Logs

```powershell
# Logs do PM2 (Backend)
pm2 logs sigma-backend

# Logs do IIS
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# Logs de erro do Windows
Get-EventLog -LogName Application -Source "PM2" -Newest 20
```

---

## 🔄 Manutenção e Atualizações

### Atualizar Aplicação

```powershell
# 1. Ir para diretório
cd C:\inetpub\sigma

# 2. Parar PM2
pm2 stop sigma-backend

# 3. Atualizar código
git pull origin main

# 4. Backend - Atualizar dependências e rebuild
cd backend
npm install --production
npm run build

# 5. Executar migrations (se houver)
npm run migrate:deploy

# 6. Frontend - Rebuild e copiar
cd ..\frontend
npm install
npm run build
xcopy /E /Y dist\* C:\inetpub\wwwroot\sigma\

# 7. Reiniciar backend
cd ..\backend
pm2 restart sigma-backend

# 8. Verificar
pm2 status
pm2 logs sigma-backend
```

### Backup do Banco de Dados

```powershell
# Criar backup
$date = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -U sigma_user -d sigma_prod > "C:\backups\sigma_$date.sql"

# Restaurar backup (se necessário)
psql -U sigma_user -d sigma_prod < "C:\backups\sigma_20250126_120000.sql"
```

### Monitoramento

```powershell
# Ver status do PM2
pm2 status

# Ver uso de recursos
pm2 monit

# Ver logs em tempo real
pm2 logs sigma-backend --lines 100

# Ver informações detalhadas
pm2 show sigma-backend
```

---

## 🚨 Troubleshooting

### Problema: Backend não inicia

```powershell
# Verificar logs
pm2 logs sigma-backend

# Verificar variáveis de ambiente
pm2 show sigma-backend

# Testar manualmente
cd C:\inetpub\sigma\backend
node dist/index.js
```

### Problema: Erro "JWT_SECRET must be defined"

```powershell
# Verificar se variável está definida
[Environment]::GetEnvironmentVariable("JWT_SECRET", "Machine")

# Se vazio, definir novamente
[Environment]::SetEnvironmentVariable("JWT_SECRET", "seu_secret", "Machine")

# Reiniciar PM2
pm2 restart sigma-backend
```

### Problema: Frontend não carrega (404)

```powershell
# Verificar se arquivos existem
dir C:\inetpub\wwwroot\sigma

# Verificar web.config
type C:\inetpub\wwwroot\sigma\web.config

# Verificar site no IIS está rodando
Get-WebSite -Name "SIGMA"
```

### Problema: API retorna 502 (Bad Gateway)

```powershell
# Verificar se backend está rodando
pm2 status

# Reiniciar backend
pm2 restart sigma-backend

# Verificar se porta 3001 está ouvindo
netstat -ano | findstr :3001

# Verificar proxy no IIS
# IIS Manager → ARR → Server Proxy Settings → Deve estar habilitado
```

### Problema: Erro de conexão com banco

```sql
-- Testar conexão
psql -U sigma_user -d sigma_prod

-- Verificar se usuário tem permissões
\du

-- Verificar DATABASE_URL
echo $env:DATABASE_URL
```

### Problema: CORS Errors

```typescript
// Verificar backend/src/index.ts
// Deve ter:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `pm2 logs sigma-backend`
2. Verificar IIS logs: `C:\inetpub\logs\LogFiles`
3. Verificar variáveis de ambiente
4. Consultar documentação do projeto

---

## 📌 Checklist de Deploy

- [ ] Node.js instalado
- [ ] PostgreSQL instalado e configurado
- [ ] PM2 instalado globalmente
- [ ] IIS habilitado
- [ ] URL Rewrite e ARR instalados
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado
- [ ] Migrations executadas
- [ ] Backend em execução (PM2)
- [ ] Frontend copiado para IIS
- [ ] Site IIS criado e rodando
- [ ] Proxy reverso funcionando
- [ ] HTTPS configurado (produção)
- [ ] Senhas padrão alteradas
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
