# SIGMA - Guia de Deploy para Ubuntu Server 22.04 (VM Linux)

## Pré-requisitos
- Ubuntu Server 22.04 LTS instalado
- Acesso SSH ao servidor
- IP fixo configurado
- Portas 22, 80 e 443 liberadas

---

# PARTE 1: Configuração Inicial do Servidor

**Conecte via SSH e execute os comandos abaixo.**

## 1.1 Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

## 1.2 Instalar Node.js 22 LTS

```bash
# Instalar via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v
npm -v
```

## 1.3 Instalar PM2

```bash
sudo npm install -g pm2

# Configurar para iniciar com o sistema
pm2 startup systemd
# Execute o comando que aparecer na tela (começa com sudo env...)
```

## 1.4 Instalar Git

```bash
sudo apt install -y git

git config --global user.name "Servidor Prefeitura"
git config --global user.email "ti@patobragado.pr.gov.br"
```

## 1.5 Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Criar banco e usuário:

```bash
# Acessar o PostgreSQL
sudo -u postgres psql
```

No prompt do PostgreSQL, execute:
```sql
-- Criar bancos
CREATE DATABASE sigma_producao;
CREATE DATABASE sigma_teste;

-- Criar usuário (TROQUE A SENHA!)
CREATE USER sigma_user WITH PASSWORD 'SENHA_FORTE_AQUI';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE sigma_producao TO sigma_user;
GRANT ALL PRIVILEGES ON DATABASE sigma_teste TO sigma_user;

-- Sair
\q
```

## 1.6 Instalar Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Verificar
caddy version
```

---

**✅ PARE AQUI e me avise quando terminar a Parte 1!**

---

# PARTE 2: Clonar e Configurar o Projeto

## 2.1 Criar diretório e clonar

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/devpmpb/sigma.git
sudo chown -R $USER:$USER /var/www/sigma
cd sigma
```

## 2.2 Configurar variáveis de ambiente (.env)

```bash
cd /var/www/sigma/backend
cp .env.production.example .env
```

### Gerar chaves JWT:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**Execute 2 vezes e anote os resultados.**

### Editar .env:
```bash
nano .env
```

**Altere estas linhas:**
```env
DATABASE_URL="postgresql://sigma_user:SUA_SENHA_DO_POSTGRES@localhost:5432/sigma_producao"
JWT_SECRET="PRIMEIRA_CHAVE_GERADA"
JWT_REFRESH_SECRET="SEGUNDA_CHAVE_GERADA"
APP_URL="https://sigma.patobragado.pr.gov.br"
FRONTEND_URL="https://sigma.patobragado.pr.gov.br"
NODE_ENV="production"
```

Salvar: `Ctrl+O`, Enter, `Ctrl+X`

## 2.3 Instalar dependências e compilar

```bash
# Backend
cd /var/www/sigma/backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd /var/www/sigma/frontend
npm ci
npm run build
```

## 2.4 Criar usuário admin (seed)

```bash
cd /var/www/sigma/backend
npx prisma db seed
```

**Usuário criado:**
- Email: `admin@sigma.com`
- Senha: `123456` (TROQUE APÓS PRIMEIRO LOGIN!)

---

**✅ PARE AQUI e me avise quando terminar a Parte 2!**

---

# PARTE 3: Configurar Caddy (HTTPS automático)

## 3.1 Configurar DNS

No painel DNS da prefeitura:
- **Tipo:** A
- **Nome:** sigma
- **Valor:** IP_DO_SERVIDOR

Testar: `nslookup sigma.patobragado.pr.gov.br`

## 3.2 Configurar Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

**Apague tudo e cole isto:**
```
sigma.patobragado.pr.gov.br {
    root * /var/www/sigma/frontend/dist

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

Salvar: `Ctrl+O`, Enter, `Ctrl+X`

## 3.3 Reiniciar Caddy

```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

Deve mostrar **active (running)**.

---

**✅ PARE AQUI e me avise quando terminar a Parte 3!**

---

# PARTE 4: Iniciar o Backend com PM2

## 4.1 Criar arquivo de configuração PM2

```bash
cd /var/www/sigma
nano ecosystem.config.js
```

Cole:
```javascript
module.exports = {
  apps: [{
    name: "sigma-api",
    cwd: "/var/www/sigma/backend",
    script: "dist/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "production",
      PORT: 3001
    }
  }]
};
```

Salvar: `Ctrl+O`, Enter, `Ctrl+X`

## 4.2 Iniciar aplicação

```bash
cd /var/www/sigma
pm2 start ecosystem.config.js
pm2 save
```

## 4.3 Verificar

```bash
pm2 status
pm2 logs sigma-api
```

## 4.4 Testar no navegador

Acesse:
- https://sigma.patobragado.pr.gov.br
- https://sigma.patobragado.pr.gov.br/painel

**Login:**
- Email: admin@sigma.com
- Senha: 123456

---

**✅ PRONTO! Sistema no ar!**

---

# Comandos Úteis

## Atualizar sistema (após alterações no código)

```bash
cd /var/www/sigma
git pull origin main

# Backend
cd backend
npm ci
npm run build
npx prisma migrate deploy

# Frontend
cd ../frontend
npm ci
npm run build

# Reiniciar
pm2 restart sigma-api
```

## Ver logs

```bash
pm2 logs sigma-api
pm2 logs sigma-api --lines 100
```

## Reiniciar

```bash
pm2 restart sigma-api
```

## Status

```bash
pm2 status
```

## Reiniciar Caddy

```bash
sudo systemctl restart caddy
```

## Ver logs do Caddy

```bash
sudo journalctl -u caddy -f
```

---

# Troubleshooting

## Erro de conexão com banco
```bash
# Testar conexão
psql -U sigma_user -d sigma_producao -h localhost

# Ver status PostgreSQL
sudo systemctl status postgresql
```

## Backend não inicia
```bash
# Ver logs detalhados
pm2 logs sigma-api --lines 50

# Testar manual
cd /var/www/sigma/backend
node dist/index.js
```

## SSL não funciona
```bash
# Verificar DNS
nslookup sigma.patobragado.pr.gov.br

# Ver logs do Caddy
sudo journalctl -u caddy --no-pager -n 50

# Portas 80 e 443 devem estar abertas!
sudo ufw status
```

## Permissões
```bash
# Se der erro de permissão
sudo chown -R $USER:$USER /var/www/sigma
```

---

# Checklist

- [ ] Ubuntu atualizado
- [ ] Node.js 22 instalado
- [ ] PM2 instalado
- [ ] Git instalado e configurado
- [ ] PostgreSQL instalado
- [ ] Bancos criados (sigma_producao)
- [ ] Usuário sigma_user criado
- [ ] Caddy instalado
- [ ] Repositório clonado
- [ ] .env configurado
- [ ] Chaves JWT geradas
- [ ] npm ci + build executados
- [ ] Migrations executadas
- [ ] Seed executado
- [ ] DNS configurado
- [ ] Caddyfile configurado
- [ ] PM2 iniciado
- [ ] Site acessível via HTTPS
- [ ] Login funcionando
- [ ] Senha admin alterada
