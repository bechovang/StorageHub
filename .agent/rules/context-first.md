# STORAGEHUB AI AGENT CONTEXT-FIRST & CODE INTEGRITY RULES

> **MANDATORY POLICY FOR ALL AI AGENTS & PAIR PROGRAMMERS**
> This repository contains a complex fullstack codebase (Spring Boot 3 + React 18 + PostgreSQL/Flyway).
> To prevent context decay, API hallucinations, schema regressions, and broken builds across sessions, every AI agent MUST adhere strictly to the following 5 laws.

---

## Law 1: Mandatory Context-First Lookup (No Hallucinations)

Before creating or editing any code that interacts with the backend or database:
1. **API Endpoints & Contracts**: Check [API_INDEX.md](file:///D:/Workspace/StorageHub/docs/api/API_INDEX.md).
   - NEVER invent endpoint paths, query parameters, HTTP methods, or request/response payloads.
   - If an endpoint does not exist in `API_INDEX.md`, you must either implement it in the Spring Boot backend first and update `API_INDEX.md`, or ask the user for confirmation.
2. **Database Schema & Enums**: Check [SCHEMA_MAP.md](file:///D:/Workspace/StorageHub/docs/database/SCHEMA_MAP.md).
   - NEVER guess table names, column names, foreign keys, or enum string values.
   - All migrations up to `V45__renewal_deposit_flow.sql` are indexed. Follow existing SQL patterns and JPA naming conventions.
3. **Frontend Service & Styling**: Check [FRONTEND_CONVENTIONS.md](file:///D:/Workspace/StorageHub/docs/architecture/FRONTEND_CONVENTIONS.md).
   - Always use `apiClient` and `safeParseJson` from `frontend/src/services/apiClient.js`.
   - Token key is STRICTLY `storagehub_token` (do not use `token`, `auth_token`, `jwt`).
   - Obey the Neo-Brutalist design tokens (hard borders `#18181b`, brutalist shadows, vibrant tag colors).

---

## Law 2: Verification Protocol Before Task Completion

No task is considered complete until automated compilation checks pass without errors:
1. **Frontend Verification**:
   ```bash
   cd frontend && npm run build
   ```
   Must succeed with exit code 0.
2. **Backend Verification**:
   ```bash
   cd backend && mvn test-compile
   ```
   Must build with `BUILD SUCCESS` (validates all controllers, entities, repositories, and DTOs).

---

## Law 3: Single Source of Truth Maintenance

Whenever you create or modify an API endpoint or database migration:
- When adding/modifying an endpoint in `backend/src/main/java/com/storagehub/controller/`:
  Update `docs/api/API_INDEX.md` immediately with the new route, method, request/response, and auth role.
- When creating a new Flyway migration (`V{N}__*.sql`):
  Update `docs/database/SCHEMA_MAP.md` with the new table, column, or enum mapping.

---

## Law 4: Lazy & Minimal Change Discipline (YAGNI & Non-Destructive)

- Never rewrite entire files when a surgical edit suffices.
- Preserve all existing business logic, error handling, comments, and routes.
- Do not add heavy 3rd-party dependencies unless explicitly requested.

---

## Law 5: Branch Safety & Git Hygiene

- Always check `git status` before making changes.
- Never force-push to `master`. Work on feature branches and verify that the working tree remains clean and tested.
