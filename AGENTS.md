# StorageHub Agent & AI Pair Programming Guidelines

> **CRITICAL**: Before executing any code changes, creating features, or calling backend APIs, read the **Single Sources of Truth**:
> 1. [API_INDEX.md](file:///D:/Workspace/StorageHub/docs/api/API_INDEX.md) - All 18 Spring Boot controller groups, routes, params, request/response DTOs, and role permissions.
> 2. [SCHEMA_MAP.md](file:///D:/Workspace/StorageHub/docs/database/SCHEMA_MAP.md) - Exact database tables, columns, foreign keys, and enum strings up to migration V45.
> 3. [FRONTEND_CONVENTIONS.md](file:///D:/Workspace/StorageHub/docs/architecture/FRONTEND_CONVENTIONS.md) - Client architecture (`apiClient`, `safeParseJson`, auth token `storagehub_token`, Neo-Brutalist design tokens).

## Core Rules
1. **Never Hallucinate Endpoints/DB Schemas**: Only use existing, indexed endpoints and database fields.
2. **Frontend Service Pattern**: Always call backend APIs via `frontend/src/services/apiClient.js` with `safeParseJson`.
3. **Verification Checklist**:
   - Frontend: `cd frontend && npm run build`
   - Backend: `cd backend && mvn test-compile`
4. **Synchronize Docs**: If you add new endpoints or database migrations, update `docs/api/API_INDEX.md` and `docs/database/SCHEMA_MAP.md`.
