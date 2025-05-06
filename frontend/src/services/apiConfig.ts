import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// Configuração padrão do axios
const apiConfig: AxiosRequestConfig = {
  baseURL: "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Criação da instância do axios
const apiClient: AxiosInstance = axios.create(apiConfig);

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sigma_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas e erros
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento de erros específicos
    if (error.response?.status === 401) {
      // Redireciona para login em caso de token inválido
      localStorage.removeItem("sigma_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
