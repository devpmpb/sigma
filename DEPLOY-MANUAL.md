# Deploy Manual - SIGMA

## Servidor
- **IP interno**: 192.168.0.201
- **IP público**: 191.7.167.225
- **Domínio**: https://sigma.patobragado.pr.gov.br
- **Sistema**: Debian
- **Serviços**: Caddy (web server + SSL), PM2 (Node.js), PostgreSQL

## Após fazer alterações no código

Execute esses comandos no servidor:

```bash
# 1. Atualizar código
cd /var/www/sigma
git pull origin main

# 2. Build do Backend (se alterou backend)
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart sigma-backend

# 3. Build do Frontend (se alterou frontend)
cd ../frontend
npm ci
npm run build
```

**Importante:**
- Alterou **backend**? → Precisa `pm2 restart sigma-backend`
- Alterou **frontend**? → Só `npm run build` (Caddy serve automaticamente)
- Alterou **Caddyfile**? → `systemctl restart caddy`

## Comandos úteis - PM2 (Backend)

```bash
# Ver status do backend
pm2 status

# Ver logs do backend
pm2 logs sigma-backend

# Ver logs em tempo real
pm2 logs sigma-backend --lines 100

# Reiniciar backend
pm2 restart sigma-backend

# Parar backend
pm2 stop sigma-backend
```

## Comandos úteis - Caddy (Web Server)

```bash
# Ver status do Caddy
systemctl status caddy

# Reiniciar Caddy
systemctl restart caddy

# Ver logs do Caddy
journalctl -u caddy --no-pager | tail -50

# Testar configuração
caddy validate --config /etc/caddy/Caddyfile
```

## Configuração do Caddy

Arquivo: `/etc/caddy/Caddyfile`

```
:80 {
    handle /api/* {
        reverse_proxy localhost:3001
    }

    handle {
        root * /var/www/sigma/frontend/dist
        try_files {path} /index.html
        file_server
    }
}

sigma.patobragado.pr.gov.br {
    handle /api/* {
        reverse_proxy localhost:3001
    }

    handle {
        root * /var/www/sigma/frontend/dist
        try_files {path} /index.html
        file_server
    }
}
```

## Primeira instalação

### 1. Clonar repositório
```bash
cd /var/www
git clone https://github.com/devpmpb/sigma.git
cd sigma
```

### 2. Backend
```bash
cd backend
npm ci
cp .env.example .env
# Editar .env com as configurações do banco
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/index.js --name sigma-backend
pm2 save
pm2 startup
```

### 3. Frontend
```bash
cd ../frontend
npm ci
npm run build
```

### 4. Instalar Caddy
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

### 5. Configurar Caddy
```bash
nano /etc/caddy/Caddyfile
# Colar a configuração acima
systemctl restart caddy
```

### 6. Configurar DNS do servidor
```bash
nano /etc/resolv.conf
# Adicionar: nameserver 192.168.0.252
```

## DNS e SSL

O certificado SSL é obtido automaticamente pelo Caddy via Let's Encrypt.

**Requisitos:**
- Registro A no DNS: `sigma.patobragado.pr.gov.br` → IP público
- Portas 80 e 443 liberadas no firewall
- Servidor com acesso à internet (DNS 192.168.0.252)

O Caddy renova o certificado automaticamente antes de expirar.
