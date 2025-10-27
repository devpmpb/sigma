// EXEMPLO DE USO: Como o PessoaForm.tsx ficaria usando React Query

import React from "react";
import { useParams } from "@tanstack/react-router";
import { useFormWithAuxiliary } from "../../../../hooks/useFormData";
import pessoaService from "../../../../services/comum/pessoaService";
import { logradouroService, bairroService } from "../../../../services";
import areaRuralService from "../../../../services/comum/areaRuralService";

interface PessoaFormProps {
  id?: string | number;
  onSave: () => void;
}

const PessoaFormExemplo: React.FC<PessoaFormProps> = ({ id, onSave }) => {
  const pessoaId = id || useParams({ strict: false }).id;

  // 🎯 ANTES: Vários useEffect + useState
  // const [logradouros, setLogradouros] = useState([]);
  // const [bairros, setBairros] = useState([]);
  // const [areasRurais, setAreasRurais] = useState([]);
  // const [loadingDados, setLoadingDados] = useState(false);
  //
  // useEffect(() => {
  //   carregarDadosAuxiliares();
  // }, []);

  // 🚀 DEPOIS: Um único hook com cache automático
  const {
    item: pessoa,
    auxiliaryData: { logradouros, bairros, areasRurais },
    isLoading,
    error,
  } = useFormWithAuxiliary("pessoa", pessoaId, pessoaService, {
    logradouros: logradouroService,
    bairros: bairroService,
    areasRurais: areaRuralService,
  });

  // ✅ Benefícios:
  // 1. Não precisa mais de múltiplos useState
  // 2. Não precisa mais de useEffect para carregar
  // 3. Cache automático - se abrir outro formulário, não recarrega
  // 4. Loading state unificado
  // 5. Se 2 formulários abrirem ao mesmo tempo, compartilham dados

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados</div>;
  }

  return (
    <form>
      {/* Agora você tem acesso a: */}
      {/* - pessoa: dados da pessoa se estiver editando */}
      {/* - logradouros: lista completa com cache */}
      {/* - bairros: lista completa com cache */}
      {/* - areasRurais: lista completa com cache */}

      <select>
        {logradouros.map((log: any) => (
          <option key={log.id} value={log.id}>
            {log.nome}
          </option>
        ))}
      </select>

      {/* ... resto do formulário ... */}
    </form>
  );
};

export default PessoaFormExemplo;
