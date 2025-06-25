import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { FormBase } from "../../../../components/cadastro";
import userService, {
  UsuarioComPerfil,
  PermissaoDisponivel,
  UsuarioComPermissoesDTO,
} from "../../../../services/admin/userService";
import { UsuarioDTO, Profile } from "../../../../types";
import { usePermissions } from "../../../../hooks/usePermissions";
import {
  Shield,
  User,
  Lock,
  Settings,
  Check,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface UsuarioFormProps {
  id?: string | number;
  onSave?: () => void;
}

/**
 * Formulário para cadastro e edição de usuários
 * Com seleção granular de permissões
 */
const UsuarioForm: React.FC<UsuarioFormProps> = ({ id, onSave }) => {
  const params = useParams({ strict: false });
  const usuarioId = id || params.id;
  const isNewUser = !usuarioId || usuarioId === "novo";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissoesDisponiveis, setPermissoesDisponiveis] = useState<
    PermissaoDisponivel[]
  >([]);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<
    Set<number>
  >(new Set());
  const [modoCustomizado, setModoCustomizado] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingPermissoes, setLoadingPermissoes] = useState(false);

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("admin", "edit");
  const canCreate = hasPermission("admin", "create");

  // Valores iniciais do formulário
  const initialValues: UsuarioDTO = {
    nome: "",
    email: "",
    senha: "",
    perfilId: 0,
    ativo: true,
  };

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

  // Carregar permissões disponíveis
  useEffect(() => {
    const fetchPermissoes = async () => {
      setLoadingPermissoes(true);
      try {
        const data = await userService.getAllPermissions();
        setPermissoesDisponiveis(data);
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);
      } finally {
        setLoadingPermissoes(false);
      }
    };

    fetchPermissoes();
  }, []);

  // Carregar dados do usuário se for edição
  useEffect(() => {
    if (!isNewUser && usuarioId) {
      const fetchUserData = async () => {
        try {
          const userData = await userService.getUserWithFullPermissions(
            usuarioId
          );

          // Verificar se é perfil customizado
          if (userService.isCustomProfile(userData.perfil)) {
            setModoCustomizado(true);
            const permissoesIds = new Set(
              userData.permissions.map((p) => p.id)
            );
            setPermissoesSelecionadas(permissoesIds);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
        }
      };

      fetchUserData();
    }
  }, [usuarioId, isNewUser]);

  // Carregar permissões do perfil base quando selecionado
  const handlePerfilChange = async (perfilId: number) => {
    if (perfilId === 0 || modoCustomizado) return;

    try {
      const permissoesDoPerfil = await userService.getProfilePermissions(
        perfilId
      );
      const permissoesIds = new Set(permissoesDoPerfil.map((p) => p.id));
      setPermissoesSelecionadas(permissoesIds);
    } catch (error) {
      console.error("Erro ao carregar permissões do perfil:", error);
    }
  };

  // Toggle entre modo perfil base e customizado
  const handleModoChange = (customizado: boolean) => {
    setModoCustomizado(customizado);
    if (!customizado) {
      // Se voltou para perfil base, limpar seleções
      setPermissoesSelecionadas(new Set());
    }
  };

  // Toggle de permissão individual
  const handleTogglePermissao = (permissaoId: number) => {
    if (!modoCustomizado) return;

    const novasPermissoes = new Set(permissoesSelecionadas);

    if (novasPermissoes.has(permissaoId)) {
      novasPermissoes.delete(permissaoId);
    } else {
      novasPermissoes.add(permissaoId);
    }

    setPermissoesSelecionadas(novasPermissoes);
  };

  // Aplicar preset de perfil às permissões customizadas
  const handleAplicarPreset = async (perfilId: number) => {
    if (!modoCustomizado) return;

    try {
      const permissoesDoPerfil = await userService.getProfilePermissions(
        perfilId
      );
      const permissoesIds = new Set(permissoesDoPerfil.map((p) => p.id));
      setPermissoesSelecionadas(permissoesIds);
    } catch (error) {
      console.error("Erro ao aplicar preset:", error);
    }
  };

  // Preparar dados para envio
  const prepareSubmitData = (values: UsuarioDTO) => {
    const submitData: UsuarioComPermissoesDTO = {
      ...values,
      usarPerfilBase: !modoCustomizado,
    };

    if (modoCustomizado) {
      submitData.permissoesCustomizadas = Array.from(permissoesSelecionadas);
      // Se modo customizado, o perfilId será ignorado no backend
    }

    return submitData;
  };

  // Validação do formulário
  const validate = (values: UsuarioDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!values.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.email?.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Email inválido";
    }

    if (isNewUser && (!values.senha || values.senha.length < 6)) {
      errors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!modoCustomizado && (!values.perfilId || values.perfilId === 0)) {
      errors.perfilId = "Perfil é obrigatório";
    }

    if (modoCustomizado && permissoesSelecionadas.size === 0) {
      errors.permissoes = "Selecione pelo menos uma permissão";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Agrupar permissões por módulo
  const permissoesPorModulo = permissoesDisponiveis.reduce((acc, perm) => {
    if (!acc[perm.modulo]) acc[perm.modulo] = [];
    acc[perm.modulo].push(perm);
    return acc;
  }, {} as Record<string, PermissaoDisponivel[]>);

  // Verificar permissões de acesso
  if ((isNewUser && !canCreate) || (!isNewUser && !canEdit)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-red-600">
            Você não possui permissão para {isNewUser ? "criar" : "editar"}{" "}
            usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormBase<UsuarioComPerfil, UsuarioComPermissoesDTO>
      title={isNewUser ? "Novo Usuário" : "Editar Usuário"}
      service={{
        ...userService,
        create: (data: UsuarioComPermissoesDTO) =>
          userService.createWithCustomPermissions(data),
        update: (id: string | number, data: UsuarioComPermissoesDTO) =>
          userService.updateWithCustomPermissions(id, data),
      }}
      id={usuarioId}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
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
                    ? "Configure permissões detalhadas ou use um perfil predefinido"
                    : "Edite dados e ajuste permissões conforme necessário"}
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
            </div>
          </div>

          {/* Sistema de Permissões */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Sistema de Permissões
            </h4>

            {/* Toggle Modo */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">
                    Modo de Configuração
                  </h5>
                  <p className="text-sm text-gray-600">
                    {modoCustomizado
                      ? "Selecione permissões individuais para criar um perfil personalizado"
                      : "Use um perfil predefinido com permissões padrão"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleModoChange(!modoCustomizado)}
                  className="flex items-center space-x-2"
                >
                  {modoCustomizado ? (
                    <ToggleRight className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {modoCustomizado ? "Personalizado" : "Perfil Base"}
                  </span>
                </button>
              </div>
            </div>

            {/* Perfil Base */}
            {!modoCustomizado && (
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
                        const numericValue = parseInt(e.target.value, 10) || 0;
                        setValue("perfilId", numericValue);
                        handlePerfilChange(numericValue);
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.perfilId}
                    </p>
                  )}
                </div>

                {/* Preview das permissões do perfil */}
                {values.perfilId > 0 && permissoesSelecionadas.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h6 className="font-medium text-blue-900 mb-2">
                      Permissões incluídas neste perfil:
                    </h6>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(permissoesSelecionadas).map((permId) => {
                        const perm = permissoesDisponiveis.find(
                          (p) => p.id === permId
                        );
                        return perm ? (
                          <span
                            key={permId}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {perm.modulo} - {perm.acao}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Permissões Customizadas */}
            {modoCustomizado && (
              <div className="space-y-6">
                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    Presets rápidos:
                  </span>
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleAplicarPreset(profile.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full border"
                    >
                      {profile.nome}
                    </button>
                  ))}
                </div>

                {/* Seleção de Permissões por Módulo */}
                {loadingPermissoes ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 bg-gray-200 rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(permissoesPorModulo).map(
                      ([modulo, perms]) => (
                        <div
                          key={modulo}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                            <span
                              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                modulo === "ADMIN"
                                  ? "bg-red-500"
                                  : modulo === "OBRAS"
                                  ? "bg-blue-500"
                                  : modulo === "AGRICULTURA"
                                  ? "bg-green-500"
                                  : "bg-purple-500"
                              }`}
                            ></span>
                            Módulo {modulo}
                            <span className="ml-2 text-sm text-gray-500">
                              (
                              {
                                perms.filter((p) =>
                                  permissoesSelecionadas.has(p.id)
                                ).length
                              }
                              /{perms.length})
                            </span>
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {perms.map((permissao) => {
                              const isSelected = permissoesSelecionadas.has(
                                permissao.id
                              );

                              return (
                                <div
                                  key={permissao.id}
                                  className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-green-300 bg-green-50 shadow-sm"
                                      : "border-gray-300 bg-white hover:border-gray-400"
                                  }`}
                                  onClick={() =>
                                    handleTogglePermissao(permissao.id)
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div
                                        className={`w-4 h-4 rounded border-2 mr-2 flex items-center justify-center ${
                                          isSelected
                                            ? "border-green-500 bg-green-500"
                                            : "border-gray-400"
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      <span className="text-sm font-medium">
                                        {permissao.acao}
                                      </span>
                                    </div>
                                  </div>

                                  {permissao.descricao && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {permissao.descricao}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Resumo das permissões selecionadas */}
                {permissoesSelecionadas.size > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h6 className="font-medium text-green-900 mb-2">
                      Resumo: {permissoesSelecionadas.size} permissões
                      selecionadas
                    </h6>
                    <p className="text-sm text-green-800">
                      Um perfil personalizado será criado automaticamente para
                      este usuário.
                    </p>
                  </div>
                )}

                {errors.permissoes && (
                  <p className="text-red-500 text-sm">{errors.permissoes}</p>
                )}
              </div>
            )}
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
          </div>
        </div>
      )}
    </FormBase>
  );
};

export default UsuarioForm;
