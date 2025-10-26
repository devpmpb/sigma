# 🔒 Melhorias de Segurança Implementadas - SIGMA

Este documento descreve todas as melhorias de segurança implementadas no sistema SIGMA.

---

## ✅ Correções Implementadas

### **CRÍTICO** ✔️

1. ✅ **JWT Secrets Criptograficamente Seguros**
   - Gerados com `crypto.randomBytes(64)` (512 bits)
   - Secrets de 128 caracteres hexadecimais
   - Arquivo: `backend/.env`

2. ✅ **Validação Obrigatória de Variáveis de Ambiente**
   - Validação na inicialização da aplicação
   - Falha imediatamente se variáveis obrigatórias estiverem faltando
   - Detecta secrets fracos em produção
   - Arquivo: `backend/src/utils/validateEnv.ts`

3. ✅ **Remoção de Fallbacks Inseguros**
   - Removido `|| "sigma_secret_key"` dos códigos
   - Agora usa `process.env.JWT_SECRET!` (non-null assertion)
   - Sistema falha se secret não existir
   - Arquivos: `authMiddleware.ts`, `authController.ts`

4. ✅ **Geração Segura de Senhas Aleatórias**
   - Trocado `Math.random()` por `crypto.randomBytes()`
   - Senhas de 16 caracteres com alta entropia
   - Arquivo: `backend/src/controllers/admin/usuarioController.ts`

---

### **ALTO** ✔️

5. ✅ **CORS Restritivo**
   - **Desenvolvimento**: Libera localhost (portas 3000, 5173, 5174)
   - **Produção**: Apenas `process.env.FRONTEND_URL`
   - Credentials habilitado para cookies/sessões
   - Arquivo: `backend/src/index.ts`

6. ✅ **Rate Limiting**
   - **Desenvolvimento**: DESATIVADO (testa à vontade!)
   - **Produção**: ATIVADO automaticamente
   - Login: 5 tentativas / 15 minutos
   - API Geral: 100 requests / 15 minutos
   - Criação de recursos: 10 / minuto
   - Arquivo: `backend/src/middleware/rateLimitMiddleware.ts`

7. ✅ **Headers de Segurança (Helmet)**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-XSS-Protection: 1; mode=block`
   - `Content-Security-Policy` (ajustado por ambiente)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security` (apenas HTTPS em produção)
   - Arquivo: `backend/src/middleware/securityHeaders.ts`

8. ✅ **Correção de Timing Attack**
   - Login **sempre** executa `bcrypt.compare()` (mesmo se usuário não existir)
   - Usa hash dummy quando usuário não existe
   - Tempo de resposta consistente
   - Arquivo: `backend/src/controllers/auth/authController.ts`

9. ✅ **Correção de User Enumeration**
   - Mensagem genérica: "Credenciais inválidas" (para tudo)
   - Não diferencia se usuário existe ou senha está errada
   - Log de auditoria apenas após todas validações
   - Arquivo: `backend/src/controllers/auth/authController.ts`

10. ✅ **Proteção de Módulo ADMIN**
    - Rotas `/usuarios` e `/perfis` agora exigem `ModuloSistema.ADMIN`
    - Apenas usuários com permissões ADMIN podem acessar
    - Arquivo: `backend/src/routes/index.ts`

---

## 📁 Arquivos Criados/Modificados

### **Novos Arquivos:**
```
backend/
├── .env.example                           # Template de variáveis
├── ecosystem.config.js                    # Configuração PM2
├── src/
│   ├── utils/
│   │   └── validateEnv.ts                # ✨ Validação de env vars
│   └── middleware/
│       ├── rateLimitMiddleware.ts        # ✨ Rate limiting
│       └── securityHeaders.ts            # ✨ Headers de segurança

frontend/
└── web.config                             # Configuração IIS

DEPLOY.md                                  # Documentação de deploy
SECURITY.md                                # Este arquivo
```

### **Arquivos Modificados:**
```
backend/
├── .env                                   # Secrets atualizados
├── package.json                           # Scripts de deploy/PM2
└── src/
    ├── index.ts                          # CORS, rate limiting, headers
    ├── controllers/
    │   ├── auth/authController.ts        # Timing attack, user enum
    │   └── admin/usuarioController.ts    # Senha aleatória segura
    ├── middleware/
    │   └── authMiddleware.ts             # Remoção de fallbacks
    └── routes/
        ├── auth/authRoutes.ts            # Rate limiting no login
        └── index.ts                      # Proteção módulo ADMIN
```

---

## 🔍 Como Funciona em Desenvolvimento vs Produção

### **Desenvolvimento (NODE_ENV=development)**

| Feature | Comportamento |
|---------|---------------|
| **CORS** | ✅ Libera localhost (3000, 5173, 5174) |
| **Rate Limiting** | ❌ DESATIVADO (requests ilimitados) |
| **Security Headers** | ✅ Ativo, mas CSP permissivo |
| **Timing Attack Fix** | ✅ Sempre ativo |
| **User Enumeration Fix** | ✅ Sempre ativo |
| **JWT Validation** | ✅ Sempre ativo |
| **HTTPS Enforcement** | ❌ Não força HTTPS |

### **Produção (NODE_ENV=production)**

| Feature | Comportamento |
|---------|---------------|
| **CORS** | 🔒 Apenas FRONTEND_URL configurado |
| **Rate Limiting** | ✅ ATIVO (5 login / 100 API) |
| **Security Headers** | ✅ Ativo, CSP restritivo |
| **Timing Attack Fix** | ✅ Sempre ativo |
| **User Enumeration Fix** | ✅ Sempre ativo |
| **JWT Validation** | ✅ Valida secrets fortes (64+ chars) |
| **HTTPS Enforcement** | ✅ Strict-Transport-Security |

---

## 🧪 Como Testar

### **Testar Rate Limiting (Produção):**

```bash
# 1. Configurar ambiente para produção
$env:NODE_ENV = "production"

# 2. Iniciar servidor
npm run dev

# 3. Fazer múltiplas requisições de login (mais de 5)
# Deve bloquear após a 5ª tentativa
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@sigma.com","password":"errado"}'

# Repetir 6 vezes - na 6ª deve retornar:
# HTTP 429 Too Many Requests
```

### **Testar CORS (Produção):**

```bash
# 1. Configurar produção
$env:NODE_ENV = "production"
$env:FRONTEND_URL = "http://localhost:3000"

# 2. Requisição de origem diferente deve ser bloqueada
curl -X POST http://localhost:3001/api/auth/login `
  -H "Origin: http://malicioso.com" `
  -H "Content-Type: application/json"

# Deve bloquear (CORS error)
```

### **Testar Timing Attack (Sempre):**

```bash
# Medir tempo para usuário inexistente
Measure-Command { curl http://localhost:3001/api/auth/login -Method POST -Body '{"email":"naoexiste@test.com","password":"123456"}' -ContentType "application/json" }

# Medir tempo para usuário existente com senha errada
Measure-Command { curl http://localhost:3001/api/auth/login -Method POST -Body '{"email":"admin@sigma.com","password":"errado"}' -ContentType "application/json" }

# Tempos devem ser similares (diferença < 100ms)
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | ❌ Antes | ✅ Depois |
|---------|---------|-----------|
| **JWT Secrets** | Fracos e previsíveis | 512 bits criptográficos |
| **Fallbacks** | `\|\| "sigma_secret_key"` | Falha se não definido |
| **Senhas Aleatórias** | `Math.random()` | `crypto.randomBytes()` |
| **CORS** | Totalmente aberto (`*`) | Restrito por ambiente |
| **Rate Limiting** | ❌ Nenhum | ✅ 5 login / 100 API |
| **Security Headers** | ❌ Nenhum | ✅ 7 headers implementados |
| **Timing Attack** | ⚠️ Vulnerável | ✅ Protegido |
| **User Enumeration** | ⚠️ Possível enumerar | ✅ Mensagens genéricas |
| **Rotas Admin** | ⚠️ Sem proteção explícita | ✅ Módulo ADMIN obrigatório |
| **Nível de Segurança** | 🔴 Médio/Baixo | 🟢 Alto |

---

## 🚀 Próximos Passos (Melhorias Futuras)

### **MÉDIO** (Implementar em 1-2 meses)

- [ ] **Limpeza de Sessões Expiradas**
  - Cron job para deletar sessões antigas
  - Evita crescimento do banco

- [ ] **Senha Mínima de 8-12 Caracteres**
  - Atualizar validação Zod
  - Exigir complexidade (maiúsculas, números, símbolos)

- [ ] **Índices no Banco de Dados**
  - `UsuarioSessao`: índices em `usuarioId`, `expiresAt`
  - `AuditoriaLogin`: índices em `email`, `createdAt`, `sucesso`
  - Melhora performance e consultas de segurança

- [ ] **Logging Estruturado**
  - Trocar `console.log` por Winston ou Pino
  - Logs em JSON para análise

### **BAIXO** (Melhorias de Longo Prazo)

- [ ] **2FA (Autenticação em Dois Fatores)**
  - TOTP com `speakeasy`
  - Obrigatório para admins

- [ ] **Password Strength Validator**
  - Biblioteca `zxcvbn` ou similar
  - Feedback em tempo real

- [ ] **Recuperação de Senha por Email**
  - Token temporário
  - Envio por SMTP

- [ ] **Monitoramento de Atividades Suspeitas**
  - Alertas para múltiplos logins falhados
  - Detecção de padrões anormais

---

## 🛡️ Checklist de Segurança para Deploy

Antes de fazer deploy em produção, verificar:

- [ ] ✅ JWT_SECRET e JWT_REFRESH_SECRET gerados com `crypto.randomBytes(64)`
- [ ] ✅ Variáveis de ambiente configuradas no Windows Server (não .env)
- [ ] ✅ NODE_ENV=production
- [ ] ✅ FRONTEND_URL configurado corretamente
- [ ] ✅ HTTPS/SSL configurado no IIS
- [ ] ✅ Senhas padrão do banco alteradas
- [ ] ✅ Senhas de usuários padrão alteradas
- [ ] ✅ Firewall configurado (apenas portas 80/443 abertas)
- [ ] ✅ Backups automáticos do banco configurados
- [ ] ✅ Logs monitorados regularmente
- [ ] ✅ BCRYPT_ROUNDS=12 em produção
- [ ] ✅ Rate limiting testado
- [ ] ✅ CORS testado

---

## 📞 Suporte e Dúvidas

Em caso de problemas de segurança:

1. Verificar logs: `pm2 logs sigma-backend`
2. Verificar auditoria de login no banco de dados
3. Verificar variáveis de ambiente: `Get-ChildItem Env:`
4. Consultar este documento (SECURITY.md)
5. Consultar documentação de deploy (DEPLOY.md)

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
**Status**: ✅ Todas as correções CRÍTICAS e ALTAS implementadas
