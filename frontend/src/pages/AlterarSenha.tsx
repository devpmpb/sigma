import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { Key, Eye, EyeOff, ArrowLeft } from "lucide-react";
import userService from "../services/admin/userService";

interface ChangePasswordDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

const AlterarSenha: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ChangePasswordDTO>({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });
  
  const [errors, setErrors] = useState<Partial<ChangePasswordDTO>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Função para alternar visibilidade da senha
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<ChangePasswordDTO> = {};

    if (!formData.senhaAtual) {
      newErrors.senhaAtual = "Senha atual é obrigatória";
    }

    if (!formData.novaSenha) {
      newErrors.novaSenha = "Nova senha é obrigatória";
    } else if (formData.novaSenha.length < 6) {
      newErrors.novaSenha = "Nova senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "Nova senha e confirmação devem ser iguais";
    }

    // Verificar se a nova senha é diferente da atual
    if (formData.senhaAtual && formData.novaSenha && formData.senhaAtual === formData.novaSenha) {
      newErrors.novaSenha = "A nova senha deve ser diferente da senha atual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name as keyof ChangePasswordDTO]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Limpar mensagem de sucesso quando o usuário modificar algo
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  // Função para submeter o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setErrors({ senhaAtual: "Usuário não identificado" });
      return;
    }

    setIsLoading(true);

    try {
      await userService.changePassword(user.id, formData);
      
      setSuccessMessage("Senha alterada com sucesso!");
      setFormData({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
      
      // Opcional: redirecionar após alguns segundos
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
      
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      
      if (error.response?.status === 400) {
        setErrors({ senhaAtual: "Senha atual incorreta" });
      } else if (error.response?.data?.message) {
        setErrors({ senhaAtual: error.response.data.message });
      } else {
        setErrors({ senhaAtual: "Erro ao alterar senha. Tente novamente." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para voltar
  const handleBack = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Key size={20} className="text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Alterar Senha</h1>
            </div>
          </div>

          {/* User info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Senha Atual */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="senhaAtual"
              >
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showPasswords.senhaAtual ? "text" : "password"}
                  id="senhaAtual"
                  name="senhaAtual"
                  value={formData.senhaAtual}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.senhaAtual ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Digite sua senha atual"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("senhaAtual")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.senhaAtual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.senhaAtual && (
                <p className="mt-1 text-sm text-red-600">{errors.senhaAtual}</p>
              )}
            </div>

            {/* Nova Senha */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="novaSenha"
              >
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.novaSenha ? "text" : "password"}
                  id="novaSenha"
                  name="novaSenha"
                  value={formData.novaSenha}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.novaSenha ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Digite sua nova senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("novaSenha")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.novaSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.novaSenha && (
                <p className="mt-1 text-sm text-red-600">{errors.novaSenha}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="confirmarSenha"
              >
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmarSenha ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmarSenha ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Confirme sua nova senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmarSenha")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Alterando..." : "Alterar Senha"}
              </button>
            </div>
          </form>

          {/* Security tips */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Dicas de Segurança:
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Use uma senha forte com pelo menos 6 caracteres</li>
              <li>• Combine letras maiúsculas, minúsculas e números</li>
              <li>• Não compartilhe sua senha com outras pessoas</li>
              <li>• Altere sua senha regularmente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlterarSenha;