import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createGenericController } from "../GenericController";

const prisma = new PrismaClient();

// Função para validar dados de criação
const validateProdutorCreate = (data: any) => {
  const errors = [];
  
  // ID é obrigatório (referência à PessoaFisica)
  if (!data.id) {
    errors.push("ID da pessoa física é obrigatório");
  }
  
  // Validar DAP se informada
  if (data.dap) {
    const dapNumeros = data.dap.replace(/\D/g, "");
    if (dapNumeros.length !== 11) {
      errors.push("DAP deve conter 11 dígitos");
    }
  }
  
  // Validar área efetiva se informada
  if (data.areaEfetiva) {
    if (!data.areaEfetiva.anoReferencia || data.areaEfetiva.anoReferencia < 2000) {
      errors.push("Ano de referência da área efetiva deve ser válido");
    }
    
    if (Number(data.areaEfetiva.areaPropria) < 0) {
      errors.push("Área própria não pode ser negativa");
    }
    
    if (Number(data.areaEfetiva.areaArrendadaRecebida) < 0) {
      errors.push("Área arrendada recebida não pode ser negativa");
    }
    
    if (Number(data.areaEfetiva.areaArrendadaCedida) < 0) {
      errors.push("Área arrendada cedida não pode ser negativa");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

// Função para calcular área efetiva
const calcularAreaEfetiva = (areaEfetiva: any) => {
  const areaPropria = Number(areaEfetiva.areaPropria) || 0;
  const areaRecebida = Number(areaEfetiva.areaArrendadaRecebida) || 0;
  const areaCedida = Number(areaEfetiva.areaArrendadaCedida) || 0;
  
  return areaPropria + areaRecebida - areaCedida;
};

// Controlador com os métodos genéricos
const genericController = createGenericController({
  modelName: "produtor",
  displayName: "Produtor",
  orderBy: { id: "asc" },
  validateCreate: validateProdutorCreate,
  validateUpdate: validateProdutorCreate
});

// Controlador com métodos específicos para Produtor
export const produtorController = {
  ...genericController,
  
  // Sobrescrever findAll para incluir dados da pessoa e área efetiva
  findAll: async (req: Request, res: Response) => {
    try {
      const produtores = await prisma.produtor.findMany({
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true
                }
              },
              rg: true,
              dataNascimento: true
            }
          },
          areaEfetiva: true
        },
        orderBy: {
          pessoa: {
            pessoa: {
              nome: "asc"
            }
          }
        }
      });
      
      // Transformar dados para o formato esperado pelo frontend
      const produtoresFormatados = produtores.map(produtor => ({
        id: produtor.id,
        inscricaoEstadual: produtor.inscricaoEstadual,
        dap: produtor.dap,
        tipoProdutor: produtor.tipoProdutor,
        atividadePrincipal: produtor.atividadePrincipal,
        contratoAssistencia: produtor.contratoAssistencia,
        observacoes: produtor.observacoes,
        pessoa: produtor.pessoa?.pessoa,
        areaEfetiva: produtor.areaEfetiva
      }));
      
      return res.status(200).json(produtoresFormatados);
    } catch (error) {
      console.error("Erro ao listar produtores:", error);
      return res.status(500).json({
        erro: "Erro ao listar produtores"
      });
    }
  },

  // Sobrescrever findById para incluir todos os dados relacionados
  findById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const produtor = await prisma.produtor.findUnique({
        where: { id: Number(id) },
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true
                }
              },
              rg: true,
              dataNascimento: true
            }
          },
          areaEfetiva: true
        }
      });
      
      if (!produtor) {
        return res.status(404).json({ erro: "Produtor não encontrado" });
      }
      
      // Transformar dados para o formato esperado
      const produtorFormatado = {
        id: produtor.id,
        inscricaoEstadual: produtor.inscricaoEstadual,
        dap: produtor.dap,
        tipoProdutor: produtor.tipoProdutor,
        atividadePrincipal: produtor.atividadePrincipal,
        contratoAssistencia: produtor.contratoAssistencia,
        observacoes: produtor.observacoes,
        pessoa: produtor.pessoa?.pessoa,
        areaEfetiva: produtor.areaEfetiva
      };
      
      return res.status(200).json(produtorFormatado);
    } catch (error) {
      console.error("Erro ao buscar produtor:", error);
      return res.status(500).json({ erro: "Erro ao buscar produtor" });
    }
  },
  
  // Sobrescrever create para lidar com área efetiva
  create: async (req: Request, res: Response) => {
    try {
      const { areaEfetiva, ...dadosProdutor } = req.body;
      
      // Validação
      const validationResult = validateProdutorCreate(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          erro: "Dados inválidos para criar produtor",
          detalhes: validationResult.errors,
        });
      }
      
      // Verificar se a pessoa física existe
      const pessoaFisica = await prisma.pessoaFisica.findUnique({
        where: { id: dadosProdutor.id }
      });
      
      if (!pessoaFisica) {
        return res.status(400).json({
          erro: "Pessoa física não encontrada"
        });
      }
      
      // Verificar se já existe produtor para esta pessoa
      const produtorExistente = await prisma.produtor.findUnique({
        where: { id: dadosProdutor.id }
      });
      
      if (produtorExistente) {
        return res.status(400).json({
          erro: "Já existe um produtor cadastrado para esta pessoa"
        });
      }
      
      // Usar transação para criar produtor e área efetiva
      const result = await prisma.$transaction(async (tx) => {
        // Criar produtor
        const novoProdutor = await tx.produtor.create({
          data: {
            ...dadosProdutor,
            contratoAssistencia: dadosProdutor.contratoAssistencia || false
          }
        });
        
        // Criar área efetiva se fornecida
        if (areaEfetiva) {
          const areaEfetivaCalculada = calcularAreaEfetiva(areaEfetiva);
          
          await tx.areaEfetiva.create({
            data: {
              id: novoProdutor.id,
              anoReferencia: areaEfetiva.anoReferencia,
              areaPropria: areaEfetiva.areaPropria,
              areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida,
              areaArrendadaCedida: areaEfetiva.areaArrendadaCedida,
              areaEfetiva: areaEfetivaCalculada
            }
          });
        }
        
        return novoProdutor;
      });
      
      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar produtor:", error);
      return res.status(500).json({ erro: "Erro ao criar produtor" });
    }
  },
  
  // Sobrescrever update para lidar com área efetiva
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { areaEfetiva, ...dadosProdutor } = req.body;
      
      // Verificar se produtor existe
      const produtorExistente = await prisma.produtor.findUnique({
        where: { id: Number(id) },
        include: { areaEfetiva: true }
      });
      
      if (!produtorExistente) {
        return res.status(404).json({ erro: "Produtor não encontrado" });
      }
      
      // Usar transação para atualizar produtor e área efetiva
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar dados do produtor
        const produtorAtualizado = await tx.produtor.update({
          where: { id: Number(id) },
          data: dadosProdutor
        });
        
        // Atualizar ou criar área efetiva
        if (areaEfetiva) {
          const areaEfetivaCalculada = calcularAreaEfetiva(areaEfetiva);
          
          if (produtorExistente.areaEfetiva) {
            // Atualizar área efetiva existente
            await tx.areaEfetiva.update({
              where: { id: Number(id) },
              data: {
                anoReferencia: areaEfetiva.anoReferencia,
                areaPropria: areaEfetiva.areaPropria,
                areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida,
                areaArrendadaCedida: areaEfetiva.areaArrendadaCedida,
                areaEfetiva: areaEfetivaCalculada
              }
            });
          } else {
            // Criar nova área efetiva
            await tx.areaEfetiva.create({
              data: {
                id: Number(id),
                anoReferencia: areaEfetiva.anoReferencia,
                areaPropria: areaEfetiva.areaPropria,
                areaArrendadaRecebida: areaEfetiva.areaArrendadaRecebida,
                areaArrendadaCedida: areaEfetiva.areaArrendadaCedida,
                areaEfetiva: areaEfetivaCalculada
              }
            });
          }
        }
        
        return produtorAtualizado;
      });
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao atualizar produtor:", error);
      return res.status(500).json({ erro: "Erro ao atualizar produtor" });
    }
  },
  
  // Buscar produtores por tipo
  findByTipo: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;
      
      const produtores = await prisma.produtor.findMany({
        where: { tipoProdutor: tipo },
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true
                }
              }
            }
          },
          areaEfetiva: true
        },
        orderBy: {
          pessoa: {
            pessoa: {
              nome: "asc"
            }
          }
        }
      });
      
      return res.status(200).json(produtores);
    } catch (error) {
      console.error("Erro ao buscar produtores por tipo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar produtores por tipo"
      });
    }
  },
  
  // Buscar produtores com DAP
  findComDAP: async (req: Request, res: Response) => {
    try {
      const produtores = await prisma.produtor.findMany({
        where: {
          dap: {
            not: null
          }
        },
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true
                }
              }
            }
          },
          areaEfetiva: true
        },
        orderBy: {
          pessoa: {
            pessoa: {
              nome: "asc"
            }
          }
        }
      });
      
      return res.status(200).json(produtores);
    } catch (error) {
      console.error("Erro ao buscar produtores com DAP:", error);
      return res.status(500).json({
        erro: "Erro ao buscar produtores com DAP"
      });
    }
  },
  
  // Buscar produtores com contrato de assistência
  findComAssistencia: async (req: Request, res: Response) => {
    try {
      const produtores = await prisma.produtor.findMany({
        where: { contratoAssistencia: true },
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true
                }
              }
            }
          },
          areaEfetiva: true
        },
        orderBy: {
          pessoa: {
            pessoa: {
              nome: "asc"
            }
          }
        }
      });
      
      return res.status(200).json(produtores);
    } catch (error) {
      console.error("Erro ao buscar produtores com assistência:", error);
      return res.status(500).json({
        erro: "Erro ao buscar produtores com assistência"
      });
    }
  },
  
  // Buscar produtor com todos os detalhes
  findWithDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const produtor = await prisma.produtor.findUnique({
        where: { id: Number(id) },
        include: {
          pessoa: {
            include: {
              pessoa: {
                include: {
                  enderecos: {
                    include: {
                      logradouro: true,
                      bairro: true,
                      areaRural: true
                    }
                  },
                  propriedades: true
                }
              },
              rg: true,
              dataNascimento: true
            }
          },
          areaEfetiva: true,
          solicitacoes: {
            include: {
              programa: true
            },
            orderBy: {
              datasolicitacao: "desc"
            }
          }
        }
      });
      
      if (!produtor) {
        return res.status(404).json({ erro: "Produtor não encontrado" });
      }
      
      return res.status(200).json(produtor);
    } catch (error) {
      console.error("Erro ao buscar detalhes do produtor:", error);
      return res.status(500).json({ erro: "Erro ao buscar detalhes do produtor" });
    }
  },
  
  // Atualizar apenas área efetiva
  updateAreaEfetiva: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const areaEfetiva = req.body;
      
      // Verificar se produtor existe
      const produtorExistente = await prisma.produtor.findUnique({
        where: { id: Number(id) },
        include: { areaEfetiva: true }
      });
      
      if (!produtorExistente) {
        return res.status(404).json({ erro: "Produtor não encontrado" });
      }
      
      const areaEfetivaCalculada = calcularAreaEfetiva(areaEfetiva);
      
      let result;
      
      if (produtorExistente.areaEfetiva) {
        // Atualizar área efetiva existente
        result = await prisma.areaEfetiva.update({
          where: { id: Number(id) },
          data: {
            ...areaEfetiva,
            areaEfetiva: areaEfetivaCalculada
          }
        });
      } else {
        // Criar nova área efetiva
        result = await prisma.areaEfetiva.create({
          data: {
            id: Number(id),
            ...areaEfetiva,
            areaEfetiva: areaEfetivaCalculada
          }
        });
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao atualizar área efetiva:", error);
      return res.status(500).json({ erro: "Erro ao atualizar área efetiva" });
    }
  },

  // Buscar produtores com busca por termo
  buscarPorTermo: async (req: Request, res: Response) => {
    try {
      const { termo } = req.query;
      
      if (!termo) {
        return res.status(400).json({ erro: "Termo de busca é obrigatório" });
      }
      
      const produtores = await prisma.produtor.findMany({
        where: {
          OR: [
            {
              dap: {
                contains: termo as string,
                mode: 'insensitive'
              }
            },
            {
              tipoProdutor: {
                contains: termo as string,
                mode: 'insensitive'
              }
            },
            {
              atividadePrincipal: {
                contains: termo as string,
                mode: 'insensitive'
              }
            },
            {
              pessoa: {
                pessoa: {
                  nome: {
                    contains: termo as string,
                    mode: 'insensitive'
                  }
                }
              }
            },
            {
              pessoa: {
                pessoa: {
                  cpfCnpj: {
                    contains: termo as string,
                    mode: 'insensitive'
                  }
                }
              }
            }
          ]
        },
        include: {
          pessoa: {
            include: {
              pessoa: {
                select: {
                  id: true,
                  nome: true,
                  cpfCnpj: true,
                  telefone: true,
                  email: true
                }
              }
            }
          },
          areaEfetiva: true
        },
        orderBy: {
          pessoa: {
            pessoa: {
              nome: "asc"
            }
          }
        }
      });
      
      return res.status(200).json(produtores);
    } catch (error) {
      console.error("Erro ao buscar produtores por termo:", error);
      return res.status(500).json({
        erro: "Erro ao buscar produtores"
      });
    }
  }
};