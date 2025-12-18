# SIGMA - Guia de Deploy para Windows Server (PM2 + Caddy)

## Pré-requisitos
- Windows Server 2016 ou superior
- Acesso de Administrador
- Porta 80 e 443 liberadas no firewall
- DNS configurado (sigma.patobragado.pr.gov.br apontando para o servidor)

---

# PARTE 1: Preparar o Servidor

**Faça até aqui, depois me avise. Qualquer problema, reporte o erro.**

## 1.1 Instalar Node.js (versão LTS)

1. Baixe o instalador: https://nodejs.org/en/download/
2. Execute como Administrador
3. Marque a opção "Automatically install necessary tools"
4. Verifique a instalação (abra novo CMD):
```cmd
node -v
npm -v
```
**Deve mostrar versão 20.x ou 22.x**

---

## 1.2 Instalar PM2 (gerenciador de processos)

Abra o PowerShell como Administrador:
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

---

## 1.3 Instalar Git

1. Baixe: https://git-scm.com/download/win
2. Instale com opções padrão
3. Configure (abra Git Bash ou CMD):
```cmd
git config --global user.name "Servidor Prefeitura"
git config --global user.email "ti@patobragado.pr.gov.br"
```

---

## 1.4 Instalar PostgreSQL

1. Baixe: https://www.postgresql.org/download/windows/
2. Durante instalação:
   - Defina senha do usuário `postgres` (ANOTE!)
   - Porta padrão: 5432
   - Locale: Portuguese, Brazil

3. Abra o **pgAdmin** (instalado junto) e crie os bancos:

```sql
-- Execute no Query Tool do pgAdmin
CREATE DATABASE sigma_producao;
CREATE DATABASE sigma_teste;

-- Criar usuário específico (recomendado)
CREATE USER sigma_user WITH PASSWORD 'COLOQUE_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE sigma_producao TO sigma_user;
GRANT ALL PRIVILEGES ON DATABASE sigma_teste TO sigma_user;
```

---

## 1.5 Instalar Caddy (servidor web com SSL automático)

1. Baixe: https://caddyserver.com/download
   - Selecione: **Windows amd64**
2. Crie a pasta `C:\Caddy`
3. Extraia o `caddy.exe` para `C:\Caddy\caddy.exe`
4. Abra PowerShell como Admin na pasta C:\Caddy:
```powershell
cd C:\Caddy
.\caddy.exe version
```
**Deve mostrar a versão do Caddy**

---

**✅ PARE AQUI e me avise quando terminar a Parte 1!**

---

# PARTE 2: Clonar e Configurar o Projeto

## 2.1 Clonar o repositório

```cmd
cd C:\
git clone https://github.com/devpmpb/sigma.git
cd sigma
```

---

## 2.2 Configurar variáveis de ambiente (.env)

### Passo 1: Copie o arquivo de exemplo
```cmd
cd C:\sigma\backend
copy .env.production.example .env
```

### Passo 2: Gere as chaves JWT (execute cada comando e copie o resultado)
```cmd
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**Execute 2 vezes - uma para JWT_SECRET e outra para JWT_REFRESH_SECRET**

### Passo 3: Edite o arquivo .env
```cmd
notepad .env
```

### Passo 4: Altere OBRIGATORIAMENTE estas linhas:

```env
# Coloque a senha do PostgreSQL que você criou no passo 1.4
DATABASE_URL="postgresql://sigma_user:SUA_SENHA_DO_POSTGRES@localhost:5432/sigma_producao"

# Cole as chaves que você gerou no Passo 2
JWT_SECRET="COLE_A_PRIMEIRA_CHAVE_AQUI"
JWT_REFRESH_SECRET="COLE_A_SEGUNDA_CHAVE_AQUI"

# URLs corretas
APP_URL="https://sigma.patobragado.pr.gov.br"
FRONTEND_URL="https://sigma.patobragado.pr.gov.br"
```

Salve e feche o Notepad (Ctrl+S, depois feche)

---

## 2.3 Instalar dependências e compilar

```cmd
cd C:\sigma\backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

cd C:\sigma\frontend
npm ci
npm run build
```

**Se der erro em algum comando, me mande o erro completo!**

---

## 2.4 Criar usuário admin inicial (seed)

```cmd
cd C:\sigma\backend
npx prisma db seed
```

**Usuário criado:**
- Email: `admin@sigma.com`
- Senha: `123456`

⚠️ **TROQUE A SENHA IMEDIATAMENTE após primeiro login!**

---

**✅ PARE AQUI e me avise quando terminar a Parte 2!**

---

# PARTE 3: Configurar SSL e Domínio

## 3.1 Configurar DNS

No painel DNS da prefeitura (ou provedor), crie um registro:
- **Tipo:** A
- **Nome:** sigma
- **Valor:** IP_PUBLICO_DO_SERVIDOR

Resultado esperado: `sigma.patobragado.pr.gov.br` → IP do servidor

**Para testar se propagou (pode demorar alguns minutos):**
```cmd
nslookup sigma.patobragado.pr.gov.br
```

---

## 3.2 Configurar Caddy

### Passo 1: Crie o arquivo de configuração
```cmd
notepad C:\Caddy\Caddyfile
```

### Passo 2: Cole este conteúdo (ajuste o domínio se necessário):

```
sigma.patobragado.pr.gov.br {
    root * C:\sigma\frontend\dist

    handle /api/* {
        reverse_proxy localhost:3001
    }

    handle {
        try_files {path} /index.html
        file_server
    }

    encode gzip
}
```

Salve e feche.

### Passo 3: Inicie o Caddy
```powershell
cd C:\Caddy
.\caddy.exe stop
.\caddy.exe start
```

O Caddy vai automaticamente obter o certificado SSL do Let's Encrypt!

---

## 3.3 Liberar portas no Firewall

Abra o **Windows Defender Firewall com Segurança Avançada**:
1. Regras de Entrada → Nova Regra
2. Porta → TCP → 80, 443
3. Permitir conexão
4. Marcar: Domínio, Particular, Público
5. Nome: "SIGMA Web"

---

**✅ PARE AQUI e me avise quando terminar a Parte 3!**

---

# PARTE 4: Iniciar os Serviços

## 4.1 Iniciar backend com PM2

```cmd
cd C:\sigma
pm2 start ecosystem.config.js --env production
pm2 save
```

## 4.2 Verificar se está funcionando

```cmd
pm2 status
pm2 logs sigma-api
```

Deve mostrar "online" e sem erros nos logs.

## 4.3 Acessar o sistema

Abra no navegador:
- https://sigma.patobragado.pr.gov.br
- https://sigma.patobragado.pr.gov.br/painel (dashboard público)

**Login:**
- Email: admin@sigma.com
- Senha: 123456

---

**✅ PRONTO! Se funcionou, parabéns! Se não, me mande os erros.**

---

# Comandos Úteis (Referência)

## Atualizar o sistema (após alterações no código)
```cmd
cd C:\sigma
git pull origin main
cd backend && npm ci && npm run build && npx prisma migrate deploy
cd ..\frontend && npm ci && npm run build
pm2 restart sigma-api
```

## Ver logs
```cmd
pm2 logs sigma-api
```

## Reiniciar backend
```cmd
pm2 restart sigma-api
```

## Status
```cmd
pm2 status
```

## Parar
```cmd
pm2 stop sigma-api
```

## Reiniciar Caddy
```cmd
cd C:\Caddy
.\caddy.exe reload
```

---

# Troubleshooting

## Erro de conexão com banco
- Verifique se PostgreSQL está rodando (Serviços do Windows)
- Confira a senha no .env
- Teste conexão: `psql -U sigma_user -d sigma_producao -h localhost`

## Erro de SSL / Site não abre
- Verifique se DNS está propagado: `nslookup sigma.patobragado.pr.gov.br`
- Porta 80 deve estar aberta para Let's Encrypt validar
- Verifique logs do Caddy: `C:\Caddy\caddy.exe run`

## Backend não inicia
- Verifique logs: `pm2 logs sigma-api --lines 50`
- Verifique se .env está configurado corretamente
- Teste manual: `cd C:\sigma\backend && node dist/index.js`

## Frontend página em branco
- Verifique se o build foi feito: `dir C:\sigma\frontend\dist`
- Deve ter arquivos index.html, assets/, etc.

---

# Checklist de Deploy

- [ ] Node.js instalado (v20+)
- [ ] PM2 instalado
- [ ] Git instalado
- [ ] PostgreSQL instalado
- [ ] Bancos criados (sigma_producao, sigma_teste)
- [ ] Caddy instalado
- [ ] Repositório clonado em C:\sigma
- [ ] Arquivo .env configurado
- [ ] Chaves JWT geradas
- [ ] npm ci executado (backend e frontend)
- [ ] Prisma migrate deploy executado
- [ ] npm run build executado (backend e frontend)
- [ ] Seed executado (usuário admin criado)
- [ ] DNS configurado
- [ ] Caddyfile configurado
- [ ] Portas 80 e 443 liberadas
- [ ] PM2 iniciado
- [ ] Site acessível via HTTPS
- [ ] Login funcionando
- [ ] Senha admin alterada
