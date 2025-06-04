const axios = require("axios");

const API_BASE = "http://localhost:3001/api";

async function testAuth() {
  console.log("🧪 Testando sistema de autenticação...\n");

  const testUsers = [
    { email: "admin@sigma.com", password: "123456", expectedRole: "ADMIN" },
    { email: "obras@sigma.com", password: "123456", expectedRole: "OBRAS" },
    {
      email: "agricultura@sigma.com",
      password: "123456",
      expectedRole: "AGRICULTURA",
    },
  ];

  for (const user of testUsers) {
    try {
      console.log(`🔐 Testando login: ${user.email}`);

      // 1. Fazer login
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: user.password,
      });

      if (loginResponse.status === 200) {
        console.log(`  ✅ Login bem-sucedido`);
        console.log(`  👤 Usuário: ${loginResponse.data.user.nome}`);
        console.log(`  🎭 Perfil: ${loginResponse.data.user.perfil.nome}`);
        console.log(
          `  🔑 Permissões: ${loginResponse.data.user.permissions.length}`
        );

        const token = loginResponse.data.accessToken;

        // 2. Testar rota protegida
        const verifyResponse = await axios.get(`${API_BASE}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (verifyResponse.status === 200) {
          console.log(`  ✅ Token válido`);
        }

        // 3. Testar logout
        const logoutResponse = await axios.post(
          `${API_BASE}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (logoutResponse.status === 200) {
          console.log(`  ✅ Logout bem-sucedido`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Erro: ${error.response?.data?.error || error.message}`);
    }

    console.log(""); // Linha em branco
  }

  console.log("🎉 Teste de autenticação concluído!");
}

// Só executar se o servidor estiver rodando
axios
  .get(`${API_BASE}/auth/verify`)
  .then(() => testAuth())
  .catch(() => {
    console.log(
      '❌ Servidor não está rodando. Execute "npm run dev" primeiro.'
    );
  });

// backend/scripts/create-admin.js - Script para criar admin adicional
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function createAdmin() {
  console.log("👑 Criando novo usuário administrador...\n");

  try {
    const nome = await ask("Nome do administrador: ");
    const email = await ask("Email: ");
    const senha = await ask("Senha: ");

    // Verificar se email já existe
    const existente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existente) {
      console.log("❌ Já existe um usuário com este email.");
      return;
    }

    // Buscar perfil admin
    const perfilAdmin = await prisma.perfil.findUnique({
      where: { nome: "ADMIN" },
    });

    if (!perfilAdmin) {
      console.log("❌ Perfil ADMIN não encontrado. Execute o seed primeiro.");
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoAdmin = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        perfilId: perfilAdmin.id,
      },
    });

    console.log(`\n✅ Administrador criado com sucesso!`);
    console.log(`   ID: ${novoAdmin.id}`);
    console.log(`   Nome: ${novoAdmin.nome}`);
    console.log(`   Email: ${novoAdmin.email}`);
  } catch (error) {
    console.error("❌ Erro ao criar administrador:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
