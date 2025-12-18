# SIGMA - Roteiro de Testes MVP

Este documento descreve os testes que devem ser realizados antes de liberar o sistema para uso.

---

## 1. TESTE: Login e Autenticação

### Passos:
1. Acessar https://sigma.patobragado.pr.gov.br
2. Tentar login com credenciais erradas → Deve mostrar erro
3. Login com admin@sigma.com / 123456 → Deve entrar
4. Verificar se o nome do usuário aparece no canto superior
5. Clicar em "Sair" → Deve voltar para login
6. Tentar acessar /dashboards sem login → Deve redirecionar para login

### Resultado esperado:
- [ok] Login funciona
- [ok] Logout funciona
- [ok] Rotas protegidas redirecionam

---

## 2. TESTE: Cadastro de Pessoa

### Passos:
1. Menu → Cadastros → Pessoas
2. Clicar "Nova Pessoa"
3. Preencher:
   - Nome: "João da Silva Teste"
   - Tipo: Física
   - CPF: 123.456.789-00 (ou válido)
   - Telefone: (45) 99999-9999
4. Salvar
5. Verificar se aparece na lista
6. Editar a pessoa criada
7. Alterar telefone
8. Salvar e verificar alteração

### Resultado esperado:
- [ok] Cadastro funciona
- [ok] Edição funciona
- [ok] Lista atualiza

---

## 3. TESTE: Cadastro de Propriedade

### Passos:
1. Menu → Cadastros → Propriedades
2. Clicar "Nova Propriedade"
3. Preencher:
   - Nome: "Sítio Teste"
   - Tipo: Rural
   - Área Total: 10 (alqueires)
   - Situação: Própria
   - Proprietário: João da Silva Teste (buscar)
   - Percentual: 100%
4. Salvar
5. Verificar na lista

### Resultado esperado:
- [ok] Cadastro funciona
- [ok] Busca de proprietário funciona
- [ok] Lista atualiza

---

## 4. TESTE: Transferência de Propriedade

### Pré-requisito: Ter 2 pessoas e 1 propriedade cadastradas

### Passos:
1. Cadastrar pessoa "Maria Compradora"
2. Menu → Cadastros → Propriedades
3. Localizar "Sítio Teste"
4. Clicar em "Transferir" (ou acessar transferências)
5. Preencher:
   - Propriedade: Sítio Teste
   - Vendedor: João da Silva Teste
   - Comprador: Maria Compradora
   - Data: hoje
   - Tipo: Venda
6. Confirmar transferência
7. Verificar se a propriedade agora mostra Maria como proprietária

### Resultado esperado:
- [ok] Transferência registrada
- [ok] Propriedade atualiza proprietário
- [ok] Histórico de transferências visível

---

## 5. TESTE: Cadastro de Arrendamento

### Pré-requisito: Ter propriedade e pessoa cadastradas

### Passos:
1. Cadastrar pessoa "Pedro Arrendatário"
2. Menu → Agricultura → Arrendamentos
3. Clicar "Novo Arrendamento"
4. Preencher:
   - Arrendatário: Pedro Arrendatário
   - Propriedade: Sítio Teste
   - Área arrendada: 5 alqueires (50% da propriedade)
   - Data início: 01/01/2025
   - Data fim: 31/12/2025
5. Salvar
6. Verificar na lista

### Resultado esperado:
- [ ] Arrendamento cadastrado
- [ ] Área arrendada correta
- [ ] Datas corretas

---

## 6. TESTE: Rateio Proporcional (Arrendatário)

### Pré-requisito: Arrendamento cadastrado (teste 5)

### Passos:
1. Menu → Solicitações → Nova Solicitação
2. Selecionar programa que tenha limite (ex: Calcário)
3. Selecionar beneficiário: Pedro Arrendatário
4. Verificar se aparece indicador "Proporcional"
5. Verificar se o limite mostrado é proporcional à área arrendada
   - Se limite do programa é 100 sacos
   - Pedro arrendou 50% da propriedade
   - Limite dele deve ser 50 sacos

### Resultado esperado:
- [ ] Sistema identifica arrendatário
- [ ] Limite proporcional calculado corretamente
- [ ] Informação clara na tela

---

## 7. TESTE: Solicitação de Benefício

### Passos:
1. Menu → Solicitações → Nova Solicitação
2. Selecionar programa
3. Selecionar beneficiário
4. Preencher quantidade solicitada
5. Salvar
6. Verificar na lista de solicitações
7. Alterar status para "Aprovada"
8. Alterar status para "Paga"

### Resultado esperado:
- [ ] Solicitação criada
- [ ] Status altera corretamente
- [ ] Histórico registrado

---

## 8. TESTE: Anti-Burla (Limite por Período)

### Passos:
1. Verificar limite do programa (ex: 100 sacos/ano)
2. Criar solicitação de 60 sacos → Deve aprovar
3. Criar outra solicitação de 60 sacos para MESMA pessoa
4. Sistema deve:
   - Mostrar saldo disponível (40 sacos)
   - Bloquear se tentar mais que o limite
   - Permitir até o limite restante

### Resultado esperado:
- [ ] Sistema calcula saldo corretamente
- [ ] Bloqueia excesso
- [ ] Mostra mensagem clara

---

## 9. TESTE: Dashboard Público (Prefeito)

### Passos:
1. Acessar https://sigma.patobragado.pr.gov.br/painel (sem login!)
2. Verificar se carrega os gráficos
3. Testar filtro por ano
4. Testar filtro por programa
5. Testar filtro por produtor (buscar nome)
6. Verificar se dados atualizam

### Resultado esperado:
- [ ] Acesso sem login funciona
- [ ] Gráficos carregam
- [ ] Filtros funcionam
- [ ] Dados corretos

---

## 10. TESTE: Dashboard Interno (Operador)

### Passos:
1. Fazer login
2. Menu → Dashboards
3. Verificar se carrega os gráficos
4. Verificar estatísticas

### Resultado esperado:
- [ ] Acesso com login
- [ ] Gráficos carregam
- [ ] Dados corretos

---

## 11. TESTE: Relatórios

### Passos:
1. Menu → Relatórios
2. Gerar relatório de benefícios
3. Filtrar por período
4. Exportar PDF (se disponível)

### Resultado esperado:
- [ ] Relatório gera
- [ ] Filtros funcionam
- [ ] Dados corretos

---

## 12. TESTE: PWA no Celular

### Passos:
1. Acessar sigma.patobragado.pr.gov.br/painel no celular
2. No Safari (iPhone) ou Chrome (Android):
   - iPhone: Compartilhar → Adicionar à Tela de Início
   - Android: Menu → Adicionar à tela inicial
3. Abrir o app instalado
4. Verificar se funciona como app

### Resultado esperado:
- [ ] Site abre no celular
- [ ] Consegue instalar como app
- [ ] App funciona standalone

---

# Checklist Final MVP

## Funcionalidades Core
- [ ] Login/Logout
- [ ] CRUD Pessoas
- [ ] CRUD Propriedades
- [ ] CRUD Arrendamentos
- [ ] Transferência de Propriedade
- [ ] Solicitações de Benefício
- [ ] Controle de Limite (anti-burla)
- [ ] Rateio Proporcional
- [ ] Dashboard Público
- [ ] Dashboard Interno

## Não-funcionais
- [ ] HTTPS funcionando
- [ ] Performance aceitável (< 3s para carregar)
- [ ] Responsivo no celular
- [ ] Mensagens de erro claras

## Segurança
- [ ] Senha admin alterada
- [ ] Rotas protegidas funcionando
- [ ] Dados sensíveis não expostos

---

# Problemas Encontrados

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| 1 |           |            |        |
| 2 |           |            |        |
| 3 |           |            |        |

---

**Data do teste:** ___/___/______
**Testado por:** _________________
**Versão:** MVP 1.0
