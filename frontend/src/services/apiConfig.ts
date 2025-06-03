import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

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

// Flag para evitar loop infinito de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Função para processar fila de requisições que falharam
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    // Importação dinâmica para evitar dependência circular
    const getAccessToken = () => localStorage.getItem("sigma_access_token");
    
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas e renovação automática de token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se já estamos tentando renovar o token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tentar renovar o token
        const refreshToken = localStorage.getItem("sigma_refresh_token");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${apiConfig.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Salvar novos tokens
        localStorage.setItem("sigma_access_token", accessToken);
        localStorage.setItem("sigma_refresh_token", newRefreshToken);

        // Atualizar dados do usuário se disponível
        if (response.data.user) {
          // Importação dinâmica para evitar dependência circular
          const { convertBackendUserToFrontend } = await import("../types");
          const frontendUser = convertBackendUserToFrontend(response.data.user);
          localStorage.setItem("sigma_user", JSON.stringify(frontendUser));
        }

        // Processar fila de requisições pendentes
        processQueue(null, accessToken);

        // Repetir a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Falha ao renovar token, fazer logout
        processQueue(refreshError, null);
        
        // Limpar dados de autenticação
        localStorage.removeItem("sigma_access_token");
        localStorage.removeItem("sigma_refresh_token");
        localStorage.removeItem("sigma_user");
        
        // Redirecionar para login se não estivermos já na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Tratar outros tipos de erro
    if (error.response?.status === 403) {
      // Usuário não tem permissão
      console.warn("Acesso negado:", error.response.data?.message);
    } else if (error.response?.status >= 500) {
      // Erro do servidor
      console.error("Erro do servidor:", error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

// Interceptor para logging de requisições (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
      return config;
    },
    (error) => {
      console.error("❌ Request Error:", error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.config.url}`, {
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`, {
        error: error.response?.data || error.message
      });
      return Promise.reject(error);
    }
  );
}

// Funções auxiliares para requisições específicas
export const apiHelpers = {
  /**
   * Requisição GET com tratamento de erro padrão
   */
  safeGet: async <T>(url: string, config?: AxiosRequestConfig): Promise<T | null> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar dados de ${url}:`, error);
      return null;
    }
  },

  /**
   * Requisição POST com tratamento de erro padrão
   */
  safePost: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T | null> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Erro ao enviar dados para ${url}:`, error);
      throw error; // Re-throw para que o componente possa tratar
    }
  },

  /**
   * Upload de arquivo
   */
  uploadFile: async (url: string, file: File, onProgress?: (progress: number) => void): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  /**
   * Download de arquivo
   */
  downloadFile: async (url: string, filename?: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
};

export default apiClient;