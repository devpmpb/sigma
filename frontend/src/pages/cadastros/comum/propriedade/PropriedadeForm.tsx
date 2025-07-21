// frontend/src/pages/cadastros/comum/propriedade/PropriedadeForm.tsx - ETAPA 2
import React, { useState, useEffect } from "react";
import propriedadeService, {
  TipoPropriedade,
  SituacaoPropriedade,
} from "../../../../services/comum/propriedadeService";
import pessoaService, {
  Pessoa,
} from "../../../../services/comum/pessoaService";

interface PropriedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * ETAPA 2: Adicionando services e dados reais
 */
const PropriedadeForm: React.FC<PropriedadeFormProps> = ({ id, onSave }) => {
  console.log("🔍 PropriedadeForm ETAPA 2 renderizando...", { id });

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [tipoPropriedade, setTipoPropriedade] = useState<TipoPropriedade>(
    TipoPropriedade.RURAL
  );
  const [situacao, setSituacao] = useState<SituacaoPropriedade>(
    SituacaoPropriedade.PROPRIA
  );
  const [areaTotal, setAreaTotal] = useState("");
  const [proprietarioId, setProprietarioId] = useState(0);
  const [proprietarioResidente, setProprietarioResidente] = useState(false);
  const [itr, setItr] = useState("");
  const [incra, setIncra] = useState("");
  const [matricula, setMatricula] = useState("");
  const [localizacao, setLocalizacao] = useState("");

  // Estados para dados externos
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar pessoas
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingPessoas(true);
      try {
        console.log("🔍 Carregando pessoas...");
        const data = await pessoaService.getAll();
        console.log("✅ Pessoas carregadas:", data.length);
        setPessoas(data);
      } catch (error) {
        console.error("❌ Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

  // Carregar dados para edição
  useEffect(() => {
    if (id && id !== "novo") {
      const fetchPropriedade = async () => {
        try {
          console.log("🔍 Carregando propriedade para edição...", id);
          const propriedade = await propriedadeService.getById(Number(id));
          console.log("✅ Propriedade carregada:", propriedade);

          setNome(propriedade.nome);
          setTipoPropriedade(propriedade.tipoPropriedade);
          setSituacao(propriedade.situacao);
          setAreaTotal(propriedade.areaTotal.toString());
          setProprietarioId(propriedade.proprietarioId);
          setProprietarioResidente(propriedade.proprietarioResidente);
          setItr(propriedade.itr || "");
          setIncra(propriedade.incra || "");
          setMatricula(propriedade.matricula || "");
          setLocalizacao(propriedade.localizacao || "");
        } catch (error) {
          console.error("❌ Erro ao carregar propriedade:", error);
        }
      };

      fetchPropriedade();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dados = {
        nome,
        tipoPropriedade,
        situacao,
        areaTotal: Number(areaTotal),
        proprietarioId,
        proprietarioResidente,
        itr: tipoPropriedade === TipoPropriedade.RURAL ? itr : undefined,
        incra: tipoPropriedade === TipoPropriedade.RURAL ? incra : undefined,
        matricula,
        localizacao,
      };

      console.log("🚀 Salvando propriedade:", dados);

      if (id && id !== "novo") {
        await propriedadeService.update(Number(id), dados);
        console.log("✅ Propriedade atualizada");
      } else {
        await propriedadeService.create(dados);
        console.log("✅ Propriedade criada");
      }

      alert("✅ Propriedade salva com sucesso!");
      onSave();
    } catch (error) {
      console.error("❌ Erro ao salvar:", error);
      alert("❌ Erro ao salvar propriedade: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          color: "#333",
          marginBottom: "20px",
          borderBottom: "2px solid #e0e0e0",
          paddingBottom: "10px",
        }}
      >
        {id && id !== "novo" ? "✏️ Editar Propriedade" : "➕ Nova Propriedade"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Nome */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Nome da Propriedade *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fazenda São João"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              required
            />
          </div>

          {/* Grid: Tipo e Situação */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Tipo de Propriedade *
              </label>
              <select
                value={tipoPropriedade}
                onChange={(e) =>
                  setTipoPropriedade(e.target.value as TipoPropriedade)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                {propriedadeService.getTiposPropriedade().map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Situação *
              </label>
              <select
                value={situacao}
                onChange={(e) =>
                  setSituacao(e.target.value as SituacaoPropriedade)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                {propriedadeService.getSituacoesPropriedade().map((sit) => (
                  <option key={sit.value} value={sit.value}>
                    {sit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área Total */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Área Total * (
              {propriedadeService.getSufixoUnidade(tipoPropriedade)})
            </label>
            <input
              type="number"
              step="0.01"
              value={areaTotal}
              onChange={(e) => setAreaTotal(e.target.value)}
              placeholder="Ex: 10.50"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              required
            />
            <small style={{ color: "#666" }}>
              {tipoPropriedade === TipoPropriedade.RURAL
                ? "Área em alqueires para propriedades rurais"
                : "Área em metros quadrados"}
            </small>
          </div>

          {/* Campos específicos para RURAL */}
          {tipoPropriedade === TipoPropriedade.RURAL && (
            <div
              style={{
                backgroundColor: "#f0f8f0",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #d4e6d4",
              }}
            >
              <h4 style={{ color: "#2d5a2d", marginBottom: "15px" }}>
                🌾 Informações Rurais
              </h4>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    ITR
                  </label>
                  <input
                    type="text"
                    value={itr}
                    onChange={(e) => setItr(e.target.value)}
                    placeholder="Código ITR"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    INCRA
                  </label>
                  <input
                    type="text"
                    value={incra}
                    onChange={(e) => setIncra(e.target.value)}
                    placeholder="Código INCRA"
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Proprietário */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Proprietário *
            </label>
            <select
              value={proprietarioId}
              onChange={(e) => setProprietarioId(Number(e.target.value))}
              disabled={loadingPessoas}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              required
            >
              <option value={0}>
                {loadingPessoas ? "Carregando..." : "Selecione o proprietário"}
              </option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome} - {pessoa.cpfCnpj}
                </option>
              ))}
            </select>
          </div>

          {/* Proprietário Residente */}
          <div>
            <label
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={proprietarioResidente}
                onChange={(e) => setProprietarioResidente(e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
              <span style={{ fontWeight: "bold" }}>
                Proprietário residente na propriedade
              </span>
            </label>
          </div>

          {/* Grid: Matrícula */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Matrícula do Imóvel
            </label>
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Número da matrícula"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Observações */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Observações/Localização
            </label>
            <textarea
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Descrição, pontos de referência, observações..."
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Botões */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            ❌ Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? "#ccc" : "#28a745",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </form>

      {/* Debug Info */}
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#e8f4fd",
          border: "1px solid #bee5eb",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        <strong>🔍 Debug:</strong> Services carregados ✅ | Pessoas:{" "}
        {pessoas.length} | Tipo: {tipoPropriedade} | Loading:{" "}
        {loading ? "Sim" : "Não"}
      </div>
    </div>
  );
};

export default PropriedadeForm;
