// frontend/src/hooks/usePessoaEnderecos.ts
import { useState, useEffect, useCallback } from "react";
import { Pessoa } from "../services/comum/pessoaService";
import { Endereco, EnderecoDTO } from "../services/comum/enderecoService";
import { pessoaService, enderecoService } from "../services";

interface UsePessoaEnderecos {
  // Estados
  pessoa: Pessoa | null;
  enderecos: Endereco[];
  enderecoPrincipal: Endereco | null;
  loading: boolean;
  error: string | null;

  // Estatísticas
  totalEnderecos: number;
  temEnderecoPrincipal: boolean;

  // Métodos principais
  carregarPessoa: (id: number) => Promise<void>;
  recarregarEnderecos: () => Promise<void>;

  // Métodos de endereços
  adicionarEndereco: (dados: Omit<EnderecoDTO, "pessoaId">) => Promise<boolean>;
  editarEndereco: (id: number, dados: EnderecoDTO) => Promise<boolean>;
  removerEndereco: (id: number) => Promise<boolean>;
  definirPrincipal: (enderecoId: number) => Promise<boolean>;

  // Métodos utilitários
  formatarEndereco: (endereco: Endereco) => string;
  formatarEnderecoResumido: (endereco: Endereco) => string;
  podeAdicionarEndereco: () => Promise<{ pode: boolean; motivo?: string }>;

  // Métodos de controle
  limparErros: () => void;
  limparDados: () => void;
}

export const usePessoaEnderecos = (pessoaId?: number): UsePessoaEnderecos => {
  // Estados principais
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoPrincipal, setEnderecoPrincipal] = useState<Endereco | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Método para carregar pessoa com endereços
  const carregarPessoa = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const pessoaData = await pessoaService.getPessoaWithEnderecos(id);
      setPessoa(pessoaData);

      if (pessoaData.enderecos) {
        setEnderecos(pessoaData.enderecos);
        setEnderecoPrincipal(
          pessoaData.enderecos.find((e) => e.principal) || null
        );
      } else {
        setEnderecos([]);
        setEnderecoPrincipal(null);
      }
    } catch (err: any) {
      console.error("Erro ao carregar pessoa:", err);
      setError(
        err.response?.data?.message || err.message || "Erro ao carregar pessoa"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Método para recarregar apenas os endereços
  const recarregarEnderecos = useCallback(async () => {
    if (!pessoa) return;

    setLoading(true);
    try {
      const enderecosData = await enderecoService.getEnderecosByPessoa(
        pessoa.id
      );
      setEnderecos(enderecosData);
      setEnderecoPrincipal(enderecosData.find((e) => e.principal) || null);
    } catch (err: any) {
      console.error("Erro ao recarregar endereços:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erro ao recarregar endereços"
      );
    } finally {
      setLoading(false);
    }
  }, [pessoa]);

  // Adicionar novo endereço
  const adicionarEndereco = useCallback(
    async (dados: Omit<EnderecoDTO, "pessoaId">): Promise<boolean> => {
      if (!pessoa) {
        setError("Nenhuma pessoa selecionada");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await pessoaService.adicionarEndereco(pessoa.id, dados);
        await recarregarEnderecos();
        return true;
      } catch (err: any) {
        console.error("Erro ao adicionar endereço:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erro ao adicionar endereço"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [pessoa, recarregarEnderecos]
  );

  // Editar endereço existente
  const editarEndereco = useCallback(
    async (id: number, dados: EnderecoDTO): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await enderecoService.updateWithValidation(id, dados);
        await recarregarEnderecos();
        return true;
      } catch (err: any) {
        console.error("Erro ao editar endereço:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erro ao editar endereço"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [recarregarEnderecos]
  );

  // Remover endereço
  const removerEndereco = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await enderecoService.removeWithValidation(id);
        await recarregarEnderecos();
        return true;
      } catch (err: any) {
        console.error("Erro ao remover endereço:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erro ao remover endereço"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [recarregarEnderecos]
  );

  // Definir endereço como principal
  const definirPrincipal = useCallback(
    async (enderecoId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await pessoaService.definirEnderecoPrincipal(enderecoId);
        await recarregarEnderecos();
        return true;
      } catch (err: any) {
        console.error("Erro ao definir endereço principal:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erro ao definir endereço principal"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [recarregarEnderecos]
  );

  // Métodos utilitários
  const formatarEndereco = useCallback((endereco: Endereco): string => {
    return enderecoService.formatarEnderecoCompleto(endereco);
  }, []);

  const formatarEnderecoResumido = useCallback((endereco: Endereco): string => {
    return enderecoService.formatarEnderecoResumido(endereco);
  }, []);

  const podeAdicionarEndereco = useCallback(async (): Promise<{
    pode: boolean;
    motivo?: string;
  }> => {
    if (!pessoa) {
      return { pode: false, motivo: "Nenhuma pessoa selecionada" };
    }

    return await pessoaService.podeAdicionarEndereco(pessoa.id);
  }, [pessoa]);

  // Métodos de controle
  const limparErros = useCallback(() => {
    setError(null);
  }, []);

  const limparDados = useCallback(() => {
    setPessoa(null);
    setEnderecos([]);
    setEnderecoPrincipal(null);
    setError(null);
  }, []);

  // Carregar pessoa automaticamente se pessoaId for fornecido
  useEffect(() => {
    if (pessoaId) {
      carregarPessoa(pessoaId);
    } else {
      limparDados();
    }
  }, [pessoaId, carregarPessoa, limparDados]);

  // Estatísticas calculadas
  const totalEnderecos = enderecos.length;
  const temEnderecoPrincipal = !!enderecoPrincipal;

  return {
    // Estados
    pessoa,
    enderecos,
    enderecoPrincipal,
    loading,
    error,

    // Estatísticas
    totalEnderecos,
    temEnderecoPrincipal,

    // Métodos principais
    carregarPessoa,
    recarregarEnderecos,

    // Métodos de endereços
    adicionarEndereco,
    editarEndereco,
    removerEndereco,
    definirPrincipal,

    // Métodos utilitários
    formatarEndereco,
    formatarEnderecoResumido,
    podeAdicionarEndereco,

    // Métodos de controle
    limparErros,
    limparDados,
  };
};
