# 📚 Guia de Uso do React Query no SIGMA

Este documento explica como o React Query está configurado no projeto e como usá-lo corretamente.

---

## 🎯 **O QUE FOI IMPLEMENTADO**

### 1. **useApiService (Refatorado com React Query)**

O hook `useApiService` agora usa React Query internamente, mas mantém a mesma interface externa.

**Você NÃO precisa mudar nada nos componentes existentes!**

```typescript
// Continua funcionando exatamente igual
const { data, loading, error, fetchAll, searchByTerm, toggleStatus } =
  useApiService<Pessoa, PessoaDTO>(pessoaService);
```

**Benefícios automáticos:**
- ✅ Cache de 5 minutos
- ✅ Sincronização entre componentes
- ✅ Optimistic updates (UI atualiza antes do servidor)
- ✅ Retry automático inteligente
- ✅ Invalidação automática após mutations

---

### 2. **Hooks para Formulários**

Criamos novos hooks otimizados para formulários:

#### **a) useFormData - Para dados auxiliares (dropdowns)**

```typescript
import { useFormData } from "../../hooks/useFormData";

// Carregar logradouros para dropdown
const { data: logradouros, isLoading } = useFormData('logradouros', logradouroService);

// Carregar bairros para dropdown
const { data: bairros } = useFormData('bairros', bairroService);
```

**Vantagens:**
- Cache de 10 minutos (dados auxiliares mudam pouco)
- Múltiplos formulários compartilham o mesmo cache
- Não precisa de useEffect manual

#### **b) useFormItem - Para carregar item específico (edição)**

```typescript
import { useFormItem } from "../../hooks/useFormData";

// Carregar pessoa para editar
const { data: pessoa, isLoading } = useFormItem('pessoa', pessoaId, pessoaService);
```

**Vantagens:**
- Só busca se ID for válido (não busca em modo "novo")
- Cache de 2 minutos
- Loading state automático

#### **c) useFormWithAuxiliary - Hook combinado**

```typescript
import { useFormWithAuxiliary } from "../../hooks/useFormData";

const {
  item: pessoa,
  auxiliaryData: { logradouros, bairros, areasRurais },
  isLoading,
  error
} = useFormWithAuxiliary('pessoa', pessoaId, pessoaService, {
  logradouros: logradouroService,
  bairros: bairroService,
  areasRurais: areaRuralService,
});
```

**Vantagens:**
- Carrega tudo de uma vez
- Loading state unificado
- Menos código boilerplate

---

### 3. **Configuração do QueryClient (main.tsx)**

O QueryClient está configurado com:

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutos de cache
    gcTime: 10 * 60 * 1000,          // 10 minutos no garbage collector
    refetchOnWindowFocus: false,      // Não refetch ao voltar pra aba
    refetchOnReconnect: true,         // Refetch ao reconectar internet

    // Retry inteligente
    retry: (failureCount, error) => {
      // Não retry em erros 4xx (cliente - ex: 404, 422)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry até 3x em erros 5xx (servidor) ou network
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  mutations: {
    retry: (failureCount, error) => {
      // Não retry em conflitos (409) ou validações (422)
      if (error?.response?.status === 409 || error?.response?.status === 422) {
        return false;
      }
      // Retry 1x em erros de rede
      return failureCount < 1;
    },
  },
}
```

---

## 🚀 **COMO USAR EM NOVOS COMPONENTES**

### **Para Páginas de Listagem:**

Use o `useApiService` normalmente (já está com React Query):

```typescript
const MinhaListagem: React.FC = () => {
  const { data, loading, error, fetchAll } = useApiService<Item, ItemDTO>(itemService);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return <DataTable data={data} columns={columns} />;
};
```

### **Para Formulários Simples (só carregar item):**

```typescript
const MeuForm: React.FC = () => {
  const itemId = useParams().id;

  const { data: item, isLoading } = useFormItem('item', itemId, itemService);

  if (isLoading) return <Loading />;

  return (
    <form>
      <input defaultValue={item?.nome} />
    </form>
  );
};
```

### **Para Formulários Complexos (item + dados auxiliares):**

```typescript
const MeuFormCompleto: React.FC = () => {
  const itemId = useParams().id;

  const {
    item,
    auxiliaryData: { categorias, tipos },
    isLoading
  } = useFormWithAuxiliary('item', itemId, itemService, {
    categorias: categoriaService,
    tipos: tipoService,
  });

  if (isLoading) return <Loading />;

  return (
    <form>
      <input defaultValue={item?.nome} />

      <select>
        {categorias.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.nome}</option>
        ))}
      </select>
    </form>
  );
};
```

---

## 🛠️ **OPTIMISTIC UPDATES**

O `useApiService` já tem optimistic updates configurados para:

### **Toggle Status:**
```typescript
// Quando você clica no toggle, a UI atualiza INSTANTANEAMENTE
// Se der erro, faz rollback automático
await toggleStatus(itemId, true);
```

### **Delete:**
```typescript
// Item some da lista IMEDIATAMENTE
// Se der erro (ex: constraint FK), volta pra lista
await remove(itemId);
```

---

## 🐛 **REACT QUERY DEVTOOLS**

Em modo desenvolvimento, você verá um ícone no canto inferior direito da tela.

**Como usar:**
1. Clique no ícone para abrir o DevTools
2. Veja todas as queries ativas
3. Veja o cache em tempo real
4. Veja quando queries estão "fetching", "stale", "fresh"
5. Force refetch manualmente
6. Limpe cache manualmente

**Cores:**
- 🟢 Verde: Query fresh (dentro do staleTime)
- 🟡 Amarelo: Query stale (precisa refetch)
- 🔵 Azul: Query fetching (buscando dados)
- ⚪ Cinza: Query inactive (não sendo usada)

---

## 📊 **CACHE STRATEGY**

### **Tempos de Cache:**

| Tipo de Dado | StaleTime | GCTime | Motivo |
|--------------|-----------|---------|--------|
| Listas gerais | 5 min | 10 min | Mudam com frequência moderada |
| Dados auxiliares | 10 min | 20 min | Mudam raramente (ex: logradouros) |
| Item individual | 2 min | 5 min | Pode estar sendo editado |
| Relatórios | 5 min | 10 min | Dados agregados |

### **Invalidação de Cache:**

Cache é invalidado automaticamente quando:
- ✅ Criar novo item
- ✅ Atualizar item existente
- ✅ Deletar item
- ✅ Alternar status

---

## ⚠️ **BOAS PRÁTICAS**

### **DO ✅**

1. **Use os hooks existentes:**
   ```typescript
   // BOM
   const { data } = useFormData('logradouros', logradouroService);

   // RUIM - não use useEffect + useState
   useEffect(() => {
     logradouroService.getAll().then(setLogradouros);
   }, []);
   ```

2. **Confie no cache:**
   ```typescript
   // BOM - deixa o React Query gerenciar
   const { data } = useQuery({ queryKey: ['items'] });

   // RUIM - não force refetch sem motivo
   const { data, refetch } = useQuery({ queryKey: ['items'] });
   useEffect(() => { refetch(); }, []); // ❌ Desnecessário!
   ```

3. **Use query keys consistentes:**
   ```typescript
   // BOM - sempre use o mesmo nome
   useFormData('logradouros', logradouroService);

   // RUIM - nomes diferentes pra mesma coisa
   useFormData('ruas', logradouroService);
   ```

### **DON'T ❌**

1. **Não use loading states manuais:**
   ```typescript
   // RUIM ❌
   const [loading, setLoading] = useState(false);

   // BOM ✅
   const { isLoading } = useQuery(...);
   ```

2. **Não faça fetch manual dentro de useEffect:**
   ```typescript
   // RUIM ❌
   useEffect(() => {
     service.getAll().then(setData);
   }, []);

   // BOM ✅
   const { data } = useFormData('key', service);
   ```

3. **Não invalide cache desnecessariamente:**
   ```typescript
   // RUIM ❌
   queryClient.invalidateQueries(); // Invalida TUDO

   // BOM ✅
   queryClient.invalidateQueries({ queryKey: ['specific-key'] });
   ```

---

## 🔍 **DEBUGGING**

### **Query não está fazendo cache:**

Verifique:
1. Query key está consistente?
2. StaleTime está configurado?
3. Está usando `refetch()` sem motivo?

### **Dados não atualizam após mutation:**

Verifique:
1. Mutation está invalidando o cache correto?
2. Query key da mutation e query são iguais?

### **Loading infinito:**

Verifique:
1. `enabled` está correto?
2. Query function retorna Promise?
3. Não tem erro silencioso?

---

## 📖 **REFERÊNCIAS**

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

## 🎓 **PRÓXIMOS PASSOS**

1. ✅ Migrar formulários existentes para `useFormWithAuxiliary`
2. ✅ Adicionar prefetch em rotas (carregar dados antes de navegar)
3. ✅ Implementar infinite scroll em listas longas
4. ✅ Adicionar server-side pagination

---

**Dúvidas?** Consulte este guia ou a documentação oficial do TanStack Query.
