# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SIGMA (Sistema Integrado de Gestão Municipal de Atividades) is a municipal management platform with separate frontend and backend applications. The system manages public services across multiple modules including Agriculture, Public Works (Obras), and Common services (Comum), with role-based access control.

## Technology Stack

**Backend:**
- Node.js with Express 4.18
- TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication with session management
- bcryptjs for password hashing

**Frontend:**
- React 19 with Vite
- TypeScript
- TanStack Router for routing
- TanStack Query for data fetching
- Axios for API calls
- TailwindCSS for styling
- Lucide React for icons

## Development Commands

### Backend (from `backend/` directory)

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Database management
npm run generate              # Generate Prisma client
npm run migrate              # Run migrations in dev
npm run migrate:deploy       # Deploy migrations to production
npm run migrate:reset        # Reset database
npm run migrate:status       # Check migration status
npm run db:studio            # Open Prisma Studio GUI
npm run db:seed              # Seed database
npm run db:reset             # Reset and reseed database

# Code quality
npm run lint                 # Run ESLint
npm run lint:fix            # Fix ESLint errors
npm run format              # Format with Prettier
npm run typecheck           # Type check without emit

# Testing
npm test                     # Run tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
```

### Frontend (from `frontend/` directory)

```bash
# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

### Backend Architecture

**Modular Structure:**
The backend is organized by domain modules (admin, agricultura, comum, obras, auth), each containing:
- Controllers: Handle HTTP requests and responses
- Routes: Define API endpoints and middleware
- The system uses a shared `GenericController` pattern for CRUD operations

**GenericController Pattern:**
Located in `backend/src/controllers/GenericController.ts`, this factory function creates standardized CRUD controllers with:
- Automatic validation and duplicate checking
- Soft delete support (deactivate instead of delete)
- Configurable unique fields and ordering
- Custom validation functions
- Proper error handling for referential integrity

**Key Features:**
- JWT-based authentication with session tracking in database
- Role-based access control (RBAC) with three levels: ADMIN, OBRAS, AGRICULTURA
- Middleware for authentication (`authenticateToken`) and permission checking (`requirePermission`, `requireModuleAccess`)
- All permissions stored in database via Perfil → PerfilPermissao → Permissao relationship

**Database Schema:**
- Uses Prisma ORM with PostgreSQL
- Extensive use of ENUMs for type safety (TipoPessoa, TipoPropriedade, ModuloSistema, etc.)
- Soft delete pattern via `ativo` boolean field on most models
- Multi-tenancy through module-based permissions
- Complex domain: Pessoa (physical/juridical persons), Propriedade (properties) with support for ownership types (própria, condomínio, usufruto), Arrendamento (leasing), TransferenciaPropriedade (ownership transfers)

### Frontend Architecture

**Routing System:**
Uses TanStack Router with:
- Auth guards at route level via `authGuard` function
- Permission guards via `permissionGuard` function checking ModuleType and ActionType
- Dynamic route creation from module configurations
- Route context includes auth and permissions state

**Module-Based Organization:**
Routes are configured per module in `frontend/src/config/menus/{module}/routes.ts`:
- Each route specifies required module and action
- Components are lazy-loaded per route
- All modules share the authenticated Layout component

**API Service Pattern:**
Base class in `frontend/src/services/baseApiService.ts`:
- Generic CRUD operations (getAll, getById, create, update, patch, delete)
- Module-aware (each service declares its ModuleType)
- Centralized axios configuration in `apiConfig.ts`
- Automatic token injection via interceptors

**Context & State:**
- `AuthContext`: Manages authentication state, login/logout, token storage
- `UiContext`: Manages UI state (sidebar, theme, etc.)
- `usePermissions` hook: Checks user permissions for modules and actions

**Key Patterns:**
- All authenticated pages use the Layout wrapper with sidebar navigation
- Forms handle both create and edit modes via URL parameters
- Services extend BaseApiService for consistency
- Route parameters use TanStack Router syntax (`$param` instead of `:param`)

## Database Workflow

When making schema changes:
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run migrate` (creates migration and applies it)
3. Run `npm run generate` (updates Prisma Client)
4. If needed, update seed file `backend/prisma/seed.ts`

Always check for:
- ENUMs that need updating in both Prisma and TypeScript types
- Relations that may cause cascading issues
- Unique constraints that could break existing data

## Authentication Flow

1. User logs in via `/api/auth/login` with email/password
2. Backend validates credentials, creates JWT token and UsuarioSessao record
3. Token returned to frontend, stored in localStorage
4. Frontend includes token in Authorization header (Bearer token)
5. Backend middleware `authenticateToken` validates token and session
6. User permissions loaded from Perfil → PerfilPermissao → Permissao
7. Frontend checks permissions via `usePermissions` hook before rendering routes/actions

## Module System

The system has 4 main modules:
- **ADMIN**: User and profile management, system configuration
- **COMUM**: Shared entities (Pessoa, Propriedade, Endereco, Programa, Veiculo, etc.)
- **AGRICULTURA**: Agriculture-specific features (Arrendamento, GrupoProduto, etc.)
- **OBRAS**: Public works features (OrdemServico)

Each module has:
- Backend: routes, controllers under `backend/src/{module}/`
- Frontend: pages under `frontend/src/pages/{module}/`, services under `frontend/src/services/{module}/`
- Permissions: defined via ModuloSistema enum + AcaoPermissao enum (VIEW, CREATE, EDIT, DELETE)

## Important Patterns

**GenericController Usage Example:**
```typescript
export const bairroController = createGenericController({
  modelName: 'bairro',
  displayName: 'Bairro',
  uniqueField: 'nome',
  softDelete: true,
  orderBy: { nome: 'asc' }
});
```

**Route Configuration Example:**
```typescript
{
  path: '/cadastros/pessoa',
  component: PessoaList,
  module: 'comum',
  action: 'view'
}
```

**API Service Example:**
```typescript
class PessoaService extends BaseApiService<Pessoa> {
  constructor() {
    super('/api/comum/pessoas', 'comum');
  }
}
```

## Common Issues

**Permission Errors:**
If routes return 403, verify:
1. User's Perfil has correct PerfilPermissao entries
2. Module name matches ModuloSistema enum exactly
3. Frontend route config specifies correct module/action

**Migration Conflicts:**
If Prisma migration fails:
1. Check if schema change conflicts with existing data
2. Use `npm run migrate:reset` in dev (destroys data)
3. For production, write manual migration to transform data

**Type Mismatches:**
After schema changes, restart TypeScript server and rebuild:
- Backend: `npm run build`
- Frontend: Stop and restart `npm run dev`
