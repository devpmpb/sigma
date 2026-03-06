# Alterações - 06/03/2026

## Tela de Visualização de Solicitações Encerradas

Solicitações com status encerrado (aprovado, cancelado, concluido, rejeitado) agora abrem
uma tela de visualização somente leitura, em vez do formulário de edição.

### Arquivos criados

- `frontend/src/pages/movimentos/comum/solicitacoesBeneficio/SolicitacaoBeneficioView.tsx`
  - Tela de visualização somente leitura
  - Banner colorido de status com ícone (verde = aprovado/concluido, vermelho = rejeitado, cinza = cancelado)
  - Valor do benefício em destaque no banner
  - Cards separados: Beneficiário, Programa, Dados da Solicitação, Detalhes do Cálculo
  - Botão voltar para a lista
  - Datas de criação/atualização no rodapé

### Arquivos modificados

- `frontend/src/config/menus/comum/routes.tsx`
  - Adicionada rota `/movimentos/comum/solicitacoesBeneficios/view/:id`
  - Rota de view registrada antes de `/:id` para garantir precedência no roteador

- `frontend/src/components/cadastro/CadastroBase.tsx`
  - Adicionada prop opcional `getEditUrl?: (item: T) => string`
  - Quando fornecida, sobrescreve a URL de navegação padrão ao clicar em uma linha

- `frontend/src/pages/movimentos/comum/solicitacoesBeneficio/SolicitacoesBeneficio.tsx`
  - Adicionada função `getEditUrl` que redireciona para `/view/:id` quando o status
    é aprovado, aprovada, cancelado, cancelada, concluido, concluida, rejeitado ou rejeitada
  - Status pendente e em_analise continuam abrindo o formulário de edição normalmente
