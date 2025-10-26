// ecosystem.config.js - Configuração do PM2
// Este arquivo configura como o PM2 gerencia a aplicação Node.js

module.exports = {
  apps: [{
    // Configurações básicas
    name: 'sigma-backend',
    script: './dist/index.js',
    cwd: './backend', // Diretório de trabalho

    // Modo de execução
    instances: 1, // Quantidade de instâncias (1 para desenvolvimento, 2-4 para produção)
    exec_mode: 'fork', // 'fork' ou 'cluster' (cluster para múltiplas instâncias)

    // Recursos
    max_memory_restart: '500M', // Reinicia se consumir mais que 500MB

    // Reinicialização
    autorestart: true, // Reinicia automaticamente se cair
    watch: false, // Não monitora arquivos em produção (use true em dev)
    max_restarts: 10, // Máximo de reinicializações em 1 minuto
    min_uptime: '10s', // Tempo mínimo rodando para considerar inicialização bem-sucedida

    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Variáveis de ambiente para DESENVOLVIMENTO
    env: {
      NODE_ENV: 'development',
      PORT: 3001
      // Em desenvolvimento, outras variáveis vêm do .env
    },

    // Variáveis de ambiente para PRODUÇÃO
    // IMPORTANTE: No Windows Server, configure as variáveis de ambiente do sistema
    // Em vez de colocá-las aqui. Este arquivo pode ser commitado no git.
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
      // Não coloque secrets aqui! Use variáveis de ambiente do Windows:
      // - JWT_SECRET
      // - JWT_REFRESH_SECRET
      // - DATABASE_URL
      // - etc.
    },

    // Configurações Windows-specific
    windowsHide: true, // Esconde janela do console no Windows

    // Scripts de ciclo de vida
    post_update: ['npm install', 'npm run build'], // Executa após atualização

    // Configurações de processo
    kill_timeout: 5000, // Tempo de espera antes de forçar kill (ms)
    listen_timeout: 3000, // Tempo de espera para app estar pronta (ms)
    shutdown_with_message: true // Permite shutdown gracioso
  }]
};

/*
==============================================
COMANDOS ÚTEIS DO PM2
==============================================

INICIAR APLICAÇÃO:
  pm2 start ecosystem.config.js                    # Modo desenvolvimento
  pm2 start ecosystem.config.js --env production   # Modo produção

GERENCIAR:
  pm2 status                 # Ver status de todas as apps
  pm2 show sigma-backend     # Detalhes da aplicação
  pm2 logs sigma-backend     # Ver logs em tempo real
  pm2 logs sigma-backend --lines 100  # Ver últimas 100 linhas

CONTROLE:
  pm2 restart sigma-backend  # Reiniciar aplicação
  pm2 reload sigma-backend   # Reload sem downtime (cluster mode)
  pm2 stop sigma-backend     # Parar aplicação
  pm2 delete sigma-backend   # Remover do PM2

MONITORAMENTO:
  pm2 monit                  # Monitor interativo
  pm2 list                   # Listar todas as apps

SALVAR CONFIGURAÇÃO:
  pm2 save                   # Salva lista atual de processos
  pm2 resurrect              # Restaura processos salvos

INSTALAR COMO SERVIÇO WINDOWS:
  npm install -g pm2-windows-service
  pm2-service-install        # Instala PM2 como serviço do Windows
  pm2 save                   # Após iniciar suas apps, salvar

ATUALIZAR APLICAÇÃO:
  git pull                   # Atualizar código
  npm install                # Atualizar dependências
  npm run build              # Rebuildar
  pm2 restart sigma-backend  # Reiniciar com novo código

==============================================
*/
