// PM2 Configuration - Gerenciador de processos Node.js
// Documentação: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    // =========================================================================
    // BACKEND - API Node.js
    // =========================================================================
    {
      name: "sigma-api",
      cwd: "./backend",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_teste: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      // Logs
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 4000,
    },

    // =========================================================================
    // FRONTEND - Servidor estático (opcional, se não usar Caddy para servir)
    // =========================================================================
    // {
    //   name: "sigma-frontend",
    //   cwd: "./frontend",
    //   script: "npx",
    //   args: "serve -s dist -l 3000",
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   env_production: {
    //     NODE_ENV: "production",
    //   },
    // },
  ],
};
