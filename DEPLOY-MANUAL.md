# Deploy Manual - SIGMA

## Servidor
- **IP interno**: 192.168.0.201
- **Domínio**: sigma.patobragado.pr.gov.br (após DNS configurado)
- **Sistema**: Debian
- **Serviços**: Caddy (web server), PM2 (Node.js), PostgreSQL

## Após fazer alterações no código

Execute esses comandos no servidor:

```bash
# 1. Atualizar código
cd /var/www/sigma
git pull origin main

# 2. Build do Backend
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart sigma-backend

# 3. Build do Frontend
cd ../frontend
npm ci
npm run build
```

O Caddy serve os arquivos do frontend automaticamente, não precisa reiniciar.

## Comandos úteis - PM2 (Backend)

```bash
# Ver status do backend
pm2 status

# Ver logs do backend
pm2 logs sigma-backend

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
    root * /var/www/sigma/frontend/dist
    file_server

    handle /api/* {
        reverse_proxy localhost:3333
    }

    try_files {path} /index.html
}

sigma.patobragado.pr.gov.br {
    root * /var/www/sigma/frontend/dist
    file_server

    handle /api/* {
        reverse_proxy localhost:3333
    }

    try_files {path} /index.html
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

## DNS e SSL

Para habilitar HTTPS com certificado automático:

1. **Administrador do DNS** deve criar registro A:
   - `sigma.patobragado.pr.gov.br` → IP público do servidor

2. **Firewall** deve liberar portas:
   - 80 (HTTP - necessário para validação do certificado)
   - 443 (HTTPS)

3. O Caddy obtém e renova o certificado SSL automaticamente via Let's Encrypt.

Após DNS configurado, remover o bloco `:80` do Caddyfile e deixar só o domínio.
