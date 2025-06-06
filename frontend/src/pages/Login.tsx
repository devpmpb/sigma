import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      const success = await login(email, password);

      if (success) {
        navigate({ to: "/" });
      } else {
        setError("Email ou senha inválidos");
      }
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      console.error(err);
    }
  };

  // Função para preencher automaticamente as credenciais de teste
  const fillTestCredentials = (userType: 'admin' | 'obras' | 'agricultura') => {
    const credentials = {
      admin: { email: 'admin@sigma.com', password: '123456' },
      obras: { email: 'obras@sigma.com', password: '123456' },
      agricultura: { email: 'agricultura@sigma.com', password: '123456' }
    };
    
    setEmail(credentials[userType].email);
    setPassword(credentials[userType].password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">SIGMA</h1>
          <p className="text-gray-600">Sistema Integrado de Gestão Municipal</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="exemplo@sigma.com"
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Digite sua senha"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Credenciais de teste */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3 font-medium">
            Credenciais de teste:
          </p>
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="w-full text-left p-2 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors"
            >
              <span className="font-medium">👑 Administrador:</span> admin@sigma.com / 123456
            </button>
            
            <button
              type="button"
              onClick={() => fillTestCredentials('obras')}
              className="w-full text-left p-2 text-xs bg-green-100 hover:bg-green-200 rounded transition-colors"
            >
              <span className="font-medium">🏗️ Obras:</span> obras@sigma.com / 123456
            </button>
            
            <button
              type="button"
              onClick={() => fillTestCredentials('agricultura')}
              className="w-full text-left p-2 text-xs bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
            >
              <span className="font-medium">🌾 Agricultura:</span> agricultura@sigma.com / 123456
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Clique em uma das opções acima para preencher automaticamente as credenciais.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;