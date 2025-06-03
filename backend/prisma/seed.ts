// backend/prisma/seeds/authSeed.ts - ARQUIVO COMPLETO
import { PrismaClient, TipoPerfil, ModuloSistema, AcaoPermissao } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedAuth() {
  console.log("🔐 Criando permissões do sistema...");

  // 1. Criar todas as permissões possíveis usando ENUMs
  const permissoes = [
    // Módulo Obras
    { modulo: ModuloSistema.OBRAS, acao: AcaoPermissao.VIEW, descricao: "Visualizar módulo de obras" },
    { modulo: ModuloSistema.OBRAS, acao: AcaoPermissao.CREATE, descricao: "Criar registros em obras" },
    { modulo: ModuloSistema.OBRAS, acao: AcaoPermissao.EDIT, descricao: "Editar registros em obras" },
    { modulo: ModuloSistema.OBRAS, acao: AcaoPermissao.DELETE, descricao: "Excluir registros em obras" },

    // Módulo Agricultura
    { modulo: ModuloSistema.AGRICULTURA, acao: AcaoPermissao.VIEW, descricao: "Visualizar módulo de agricultura" },
    { modulo: ModuloSistema.AGRICULTURA, acao: AcaoPermissao.CREATE, descricao: "Criar registros em agricultura" },
    { modulo: ModuloSistema.AGRICULTURA, acao: AcaoPermissao.EDIT, descricao: "Editar registros em agricultura" },
    { modulo: ModuloSistema.AGRICULTURA, acao: AcaoPermissao.DELETE, descricao: "Excluir registros em agricultura" },

    // Módulo Comum
    { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.VIEW, descricao: "Visualizar módulo comum" },
    { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.CREATE, descricao: "Criar registros comuns" },
    { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.EDIT, descricao: "Editar registros comuns" },
    { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.DELETE, descricao: "Excluir registros comuns" },

    // Módulo Admin
    { modulo: ModuloSistema.ADMIN, acao: AcaoPermissao.VIEW, descricao: "Visualizar módulo administrativo" },
    { modulo: ModuloSistema.ADMIN, acao: AcaoPermissao.CREATE, descricao: "Criar registros administrativos" },
    { modulo: ModuloSistema.ADMIN, acao: AcaoPermissao.EDIT, descricao: "Editar registros administrativos" },
    { modulo: ModuloSistema.ADMIN, acao: AcaoPermissao.DELETE, descricao: "Excluir registros administrativos" },
  ];

  for (const permissao of permissoes) {
    await prisma.permissao.upsert({
      where: { 
        modulo_acao: { 
          modulo: permissao.modulo, 
          acao: permissao.acao 
        } 
      },
      update: {},
      create: permissao,
    });
  }

  console.log("✅ Permissões criadas!");

  // 2. Criar perfis usando ENUMs
  console.log("👥 Criando perfis de usuário...");

  const perfilAdmin = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.ADMIN },
    update: {},
    create: {
      nome: TipoPerfil.ADMIN,
      descricao: "Administrador do sistema - Acesso total",
    },
  });

  const perfilObras = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.OBRAS },
    update: {},
    create: {
      nome: TipoPerfil.OBRAS,
      descricao: "Usuário da Secretaria de Obras",
    },
  });

  const perfilAgricultura = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.AGRICULTURA },
    update: {},
    create: {
      nome: TipoPerfil.AGRICULTURA, 
      descricao: "Usuário da Secretaria de Agricultura",
    },
  });

  console.log("✅ Perfis criados!");

  // 3. Associar permissões aos perfis
  console.log("🔗 Associando permissões aos perfis...");

  // Admin tem todas as permissões
  const todasPermissoes = await prisma.permissao.findMany();
  for (const permissao of todasPermissoes) {
    await prisma.perfilPermissao.upsert({
      where: {
        perfilId_permissaoId: {
          perfilId: perfilAdmin.id,
          permissaoId: permissao.id,
        },
      },
      update: {},
      create: {
        perfilId: perfilAdmin.id,
        permissaoId: permissao.id,
      },
    });
  }

  // Perfil Obras: obras (todas) + comum (view)
  const permissoesObras = await prisma.permissao.findMany({
    where: {
      OR: [
        { modulo: ModuloSistema.OBRAS },
        { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.VIEW },
      ],
    },
  });

  for (const permissao of permissoesObras) {
    await prisma.perfilPermissao.upsert({
      where: {
        perfilId_permissaoId: {
          perfilId: perfilObras.id,
          permissaoId: permissao.id,
        },
      },
      update: {},
      create: {
        perfilId: perfilObras.id,
        permissaoId: permissao.id,
      },
    });
  }

  // Perfil Agricultura: agricultura (todas) + comum (view)
  const permissoesAgricultura = await prisma.permissao.findMany({
    where: {
      OR: [
        { modulo: ModuloSistema.AGRICULTURA },
        { modulo: ModuloSistema.COMUM, acao: AcaoPermissao.VIEW },
      ],
    },
  });

  for (const permissao of permissoesAgricultura) {
    await prisma.perfilPermissao.upsert({
      where: {
        perfilId_permissaoId: {
          perfilId: perfilAgricultura.id,
          permissaoId: permissao.id,
        },
      },
      update: {},
      create: {
        perfilId: perfilAgricultura.id,
        permissaoId: permissao.id,
      },
    });
  }

  console.log("✅ Permissões associadas!");

  // 4. Criar usuários iniciais
  console.log("👤 Criando usuários iniciais...");

  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@sigma.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sigma.com",
      senha: senhaHash,
      perfilId: perfilAdmin.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "obras@sigma.com" },
    update: {},
    create: {
      nome: "Usuário Obras",
      email: "obras@sigma.com",
      senha: senhaHash,
      perfilId: perfilObras.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "agricultura@sigma.com" },
    update: {},
    create: {
      nome: "Usuário Agricultura",
      email: "agricultura@sigma.com",
      senha: senhaHash,
      perfilId: perfilAgricultura.id,
    },
  });

  console.log("✅ Usuários criados!");
  console.log("📧 Credenciais:");
  console.log("   Admin: admin@sigma.com / 123456");
  console.log("   Obras: obras@sigma.com / 123456");
  console.log("   Agricultura: agricultura@sigma.com / 123456");
}

// Para usar no seed principal
export default seedAuth;