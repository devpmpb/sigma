// frontend/src/pages/cadastros/comum/usuario/UsuarioForm.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { FormBase } from "../../../../components/cadastro";
import userService, {
  UsuarioComPerfil,
} from "../../../../services/admin/userService";
import { UsuarioDTO, Profile, TipoPerfilBackend } from "../../../../types";
import { usePermissions } from "../../../../hooks/usePermissions";
import { Shield, User, Mail, Lock, Users } from "lucide-react";

interface UsuarioFormProps {
  id?: string | number;
  onSave?: () => void;
}

/**
 * Formulário para cadastro e edição de usuários
 * Restrito apenas para administradores
 * Usando FormBase seguindo o padrão do projeto
 */
const UsuarioForm: React.FC<UsuarioFormProps> = ({ id, onSave }) => {
  const params = useParams({ strict: false });
  const usuarioId = id || params.id;
  const isNewUser = !usuarioId || usuarioId === "novo";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("admin", "edit");
  const canCreate = hasPermission("admin", "create");

  // Carregar perfis disponíveis
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const data = await userService.getActiveProfiles();
        setProfiles(data);
      } catch (error) {
        console.error("Erro ao carregar perfis:", error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, []);

  // Valores iniciais do formulário
  const initialValues: UsuarioDTO = {
    nome: "",
    email: "",
    senha: "",
    perfilId: 0,
    ativo: true,
  };

  // Validação do formulário
  const validate = (values: UsuarioDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    // Nome obrigatório
    if (!values.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    } else if (values.nome.trim().length < 2) {
      errors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    // Email obrigatório e válido
    if (!values.email?.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Email inválido";
    }

    // Senha obrigatória para novos usuários
    if (isNewUser && (!values.senha || values.senha.length < 6)) {
      errors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    // Perfil obrigatório
    if (
      !values.perfilId ||
      values.perfilId === 0 ||
      isNaN(Number(values.perfilId))
    ) {
      errors.perfilId = "Perfil é obrigatório";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Verificar permissões
  if (isNewUser && !canCreate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-red-600">
            Você não possui permissão para criar novos usuários.
          </p>
        </div>
      </div>
    );
  }

  if (!isNewUser && !canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-red-600">
            Você não possui permissão para editar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormBase<UsuarioComPerfil, UsuarioDTO>
      title={isNewUser ? "Novo Usuário" : "Editar Usuário"}
      service={userService}
      id={usuarioId}
      initialValues={initialValues}
      validate={validate}
      //onSave={onSave}
      returnUrl="/cadastros/comum/usuarios"
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => (
        <div className="space-y-6">
          {/* Header do formulário */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {isNewUser ? "Dados do Novo Usuário" : "Dados do Usuário"}
                </h3>
                <p className="text-sm text-blue-700">
                  {isNewUser
                    ? "Preencha os dados para criar um novo usuário do sistema"
                    : "Edite os dados do usuário selecionado"}
                </p>
              </div>
            </div>
          </div>

          {/* Informações pessoais */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações Pessoais
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={values.nome || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("nome", true)}
                  placeholder="Digite o nome completo"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.nome && errors.nome
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {touched.nome && errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={values.email || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("email", true)}
                  placeholder="Digite o email"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.email && errors.email
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Credenciais de acesso */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Credenciais de Acesso
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNewUser
                    ? "Senha"
                    : "Nova Senha (deixe em branco para manter a atual)"}
                  {isNewUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="senha"
                  value={values.senha || ""}
                  onChange={handleChange}
                  onBlur={() => setFieldTouched("senha", true)}
                  placeholder={
                    isNewUser ? "Digite a senha" : "Digite uma nova senha"
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.senha && errors.senha
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {touched.senha && errors.senha && (
                  <p className="text-red-500 text-sm mt-1">{errors.senha}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {isNewUser
                    ? "Mínimo de 6 caracteres"
                    : "Deixe em branco para manter a senha atual"}
                </p>
              </div>

              {isNewUser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Dica:</strong> O usuário receberá as credenciais por
                    email e poderá alterar a senha no primeiro acesso.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Perfil e permissões */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Perfil e Permissões
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil de Acesso <span className="text-red-500">*</span>
                </label>

                {loadingProfiles ? (
                  <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
                ) : (
                  <select
                    name="perfilId"
                    value={values.perfilId || 0}
                    onChange={(e) => {
                      // Converter string para number aqui
                      const numericValue = parseInt(e.target.value, 10) || 0;
                      setValue("perfilId", numericValue);
                    }}
                    onBlur={() => setFieldTouched("perfilId", true)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      touched.perfilId && errors.perfilId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value={0}>Selecione um perfil</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.nome}{" "}
                        {profile.descricao && `- ${profile.descricao}`}
                      </option>
                    ))}
                  </select>
                )}

                {touched.perfilId && errors.perfilId && (
                  <p className="text-red-500 text-sm mt-1">{errors.perfilId}</p>
                )}
              </div>

              {/* Descrição dos perfis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  Descrição dos Perfis:
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="inline-block w-20 font-medium text-red-700">
                      ADMIN:
                    </span>
                    <span className="text-gray-600">
                      Acesso total ao sistema, incluindo gerenciamento de
                      usuários e configurações.
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-20 font-medium text-blue-700">
                      OBRAS:
                    </span>
                    <span className="text-gray-600">
                      Acesso aos módulos de obras e funcionalidades
                      relacionadas.
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-20 font-medium text-green-700">
                      AGRICULTURA:
                    </span>
                    <span className="text-gray-600">
                      Acesso aos módulos de agricultura e funcionalidades
                      relacionadas.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Status</h4>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="ativo"
                checked={values.ativo || false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Usuário ativo (pode fazer login no sistema)
              </label>
            </div>

            {!values.ativo && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Atenção:</strong> Usuários inativos não conseguem
                  fazer login no sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </FormBase>
  );
};

export default UsuarioForm;
