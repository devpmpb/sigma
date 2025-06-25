import {
  PrismaClient,
  TipoPerfil,
  ModuloSistema,
  AcaoPermissao,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedAuth() {
  console.log("🔐 Criando permissões do sistema...");

  // 1. Criar todas as permissões possíveis usando ENUMs
  const permissoes = [
    // Módulo Obras - USANDO ENUM
    {
      modulo: ModuloSistema.OBRAS,
      acao: AcaoPermissao.VIEW,
      descricao: "Visualizar módulo de obras",
    },
    {
      modulo: ModuloSistema.OBRAS,
      acao: AcaoPermissao.CREATE,
      descricao: "Criar registros em obras",
    },
    {
      modulo: ModuloSistema.OBRAS,
      acao: AcaoPermissao.EDIT,
      descricao: "Editar registros em obras",
    },
    {
      modulo: ModuloSistema.OBRAS,
      acao: AcaoPermissao.DELETE,
      descricao: "Excluir registros em obras",
    },

    // Módulo Agricultura - USANDO ENUM
    {
      modulo: ModuloSistema.AGRICULTURA,
      acao: AcaoPermissao.VIEW,
      descricao: "Visualizar módulo de agricultura",
    },
    {
      modulo: ModuloSistema.AGRICULTURA,
      acao: AcaoPermissao.CREATE,
      descricao: "Criar registros em agricultura",
    },
    {
      modulo: ModuloSistema.AGRICULTURA,
      acao: AcaoPermissao.EDIT,
      descricao: "Editar registros em agricultura",
    },
    {
      modulo: ModuloSistema.AGRICULTURA,
      acao: AcaoPermissao.DELETE,
      descricao: "Excluir registros em agricultura",
    },

    // Módulo Comum - USANDO ENUM
    {
      modulo: ModuloSistema.COMUM,
      acao: AcaoPermissao.VIEW,
      descricao: "Visualizar módulo comum",
    },
    {
      modulo: ModuloSistema.COMUM,
      acao: AcaoPermissao.CREATE,
      descricao: "Criar registros comuns",
    },
    {
      modulo: ModuloSistema.COMUM,
      acao: AcaoPermissao.EDIT,
      descricao: "Editar registros comuns",
    },
    {
      modulo: ModuloSistema.COMUM,
      acao: AcaoPermissao.DELETE,
      descricao: "Excluir registros comuns",
    },

    // Módulo Admin - USANDO ENUM
    {
      modulo: ModuloSistema.ADMIN,
      acao: AcaoPermissao.VIEW,
      descricao: "Visualizar módulo administrativo",
    },
    {
      modulo: ModuloSistema.ADMIN,
      acao: AcaoPermissao.CREATE,
      descricao: "Criar registros administrativos",
    },
    {
      modulo: ModuloSistema.ADMIN,
      acao: AcaoPermissao.EDIT,
      descricao: "Editar registros administrativos",
    },
    {
      modulo: ModuloSistema.ADMIN,
      acao: AcaoPermissao.DELETE,
      descricao: "Excluir registros administrativos",
    },
  ];

  // Criar cada permissão usando ENUMs
  for (const permissao of permissoes) {
    await prisma.permissao.upsert({
      where: {
        modulo_acao: {
          modulo: permissao.modulo,
          acao: permissao.acao,
        },
      },
      update: {},
      create: {
        modulo: permissao.modulo,
        acao: permissao.acao,
        descricao: permissao.descricao,
      },
    });
  }

  console.log("✅ Permissões criadas com ENUMs!");

  // 2. Criar perfis usando ENUMs
  console.log("👥 Criando perfis de usuário...");

  const perfilAdmin = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.ADMIN }, // USANDO ENUM
    update: {},
    create: {
      nome: TipoPerfil.ADMIN, // USANDO ENUM
      descricao: "Administrador do sistema - Acesso total",
    },
  });

  const perfilObras = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.OBRAS }, // USANDO ENUM
    update: {},
    create: {
      nome: TipoPerfil.OBRAS, // USANDO ENUM
      descricao: "Usuário da Secretaria de Obras",
    },
  });

  const perfilAgricultura = await prisma.perfil.upsert({
    where: { nome: TipoPerfil.AGRICULTURA }, // USANDO ENUM
    update: {},
    create: {
      nome: TipoPerfil.AGRICULTURA, // USANDO ENUM
      descricao: "Usuário da Secretaria de Agricultura",
    },
  });

  console.log("✅ Perfis criados com ENUMs!");

  // 3. Associar permissões aos perfis usando ENUMs
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

  // Perfil Obras: obras (todas ações) + comum (apenas view) - USANDO ENUMs
  const permissoesObras = await prisma.permissao.findMany({
    where: {
      OR: [
        { modulo: ModuloSistema.OBRAS }, // USANDO ENUM - todas as ações de obras
        {
          modulo: ModuloSistema.COMUM, // USANDO ENUM
          acao: AcaoPermissao.VIEW, // USANDO ENUM - apenas view do comum
        },
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

  // Perfil Agricultura: agricultura (todas ações) + comum (apenas view) - USANDO ENUMs
  const permissoesAgricultura = await prisma.permissao.findMany({
    where: {
      OR: [
        { modulo: ModuloSistema.AGRICULTURA }, // USANDO ENUM - todas as ações de agricultura
        {
          modulo: ModuloSistema.COMUM, // USANDO ENUM
          acao: AcaoPermissao.VIEW, // USANDO ENUM - apenas view do comum
        },
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

  console.log("✅ Permissões associadas usando ENUMs!");

  // 4. Criar usuários iniciais
  console.log("👤 Criando usuários iniciais...");

  const senhaHash = await bcrypt.hash("123456", 10);

  // Criar usuário ADMIN
  await prisma.usuario.upsert({
    where: { email: "admin@sigma.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@sigma.com",
      senha: senhaHash,
      perfilId: perfilAdmin.id, // Referência ao perfil ADMIN
    },
  });

  // Criar usuário OBRAS
  await prisma.usuario.upsert({
    where: { email: "obras@sigma.com" },
    update: {},
    create: {
      nome: "Usuário Obras",
      email: "obras@sigma.com",
      senha: senhaHash,
      perfilId: perfilObras.id, // Referência ao perfil OBRAS
    },
  });

  // Criar usuário AGRICULTURA
  await prisma.usuario.upsert({
    where: { email: "agricultura@sigma.com" },
    update: {},
    create: {
      nome: "Usuário Agricultura",
      email: "agricultura@sigma.com",
      senha: senhaHash,
      perfilId: perfilAgricultura.id, // Referência ao perfil AGRICULTURA
    },
  });

  console.log("✅ Usuários criados!");
  console.log("");
  console.log("📧 Credenciais de acesso:");
  console.log("   Admin: admin@sigma.com / 123456");
  console.log("   Obras: obras@sigma.com / 123456");
  console.log("   Agricultura: agricultura@sigma.com / 123456");
  console.log("");
  console.log("🔍 Verificação dos ENUMs criados:");

  // Mostrar os ENUMs que foram criados
  const enumVerification = await prisma.permissao.findMany({
    select: {
      modulo: true,
      acao: true,
    },
    distinct: ["modulo", "acao"],
    orderBy: [{ modulo: "asc" }, { acao: "asc" }],
  });

  const modulosEncontrados = [
    ...new Set(enumVerification.map((p) => p.modulo)),
  ];
  const acoesEncontradas = [...new Set(enumVerification.map((p) => p.acao))];

  console.log(`   Módulos: ${modulosEncontrados.join(", ")}`);
  console.log(`   Ações: ${acoesEncontradas.join(", ")}`);

  const perfisEncontrados = await prisma.perfil.findMany({
    select: { nome: true },
  });
  console.log(`   Perfis: ${perfisEncontrados.map((p) => p.nome).join(", ")}`);
}

// Para usar no seed principal
export default seedAuth;
