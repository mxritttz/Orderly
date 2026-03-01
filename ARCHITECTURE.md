# Backend Pattern (Fastify + Prisma)

## Pattern
Wir nutzen eine **modulare Layered Architecture** (oft als "Service/Repository Pattern" bezeichnet):

1. **Routes**
- Definieren nur HTTP-Endpunkte und verdrahten Controller.
- Datei: `server/src/modules/*/*.routes.ts`

2. **Controller**
- Nimmt HTTP Request/Response entgegen.
- Fuehrt **DTO Validation** mit Zod durch.
- Uebersetzt Fehler in HTTP Statuscodes (`400`, `404`).
- Datei: `server/src/modules/*/*.controller.ts`

3. **Service**
- Enthält Business-Logik.
- Keine HTTP Details.
- Arbeitet mit Domain-Mapping (z. B. API-Status `new` -> DB-Enum `NEW`).
- Datei: `server/src/modules/*/*.service.ts`

4. **Repository**
- Kapselt Prisma-Queries.
- Keine Business-Regeln, nur Datenzugriff.
- Datei: `server/src/modules/*/*.repository.ts`

## Warum dieses Pattern
- Klar getrennte Verantwortungen
- Leicht testbar (pro Layer)
- Einfach erweiterbar fuer weitere Module (`integrations`, `settings`, `users`)
- Sauber fuer SaaS-Multi-Tenant, weil Tenant-Aufloesung zentral in Service-Layer bleibt

## DTO Validation
- DTO = Data Transfer Object (Request `params`, `query`, `body`).
- Jede Route hat Zod-Schemas in `*.dto.ts`.
- Ungueltige Payloads werden frueh mit `400` abgelehnt.

## API Response Contract
- Success:
`{ success: true, data: ..., meta: { requestId } }`
- Error:
`{ success: false, error: { code, message, details }, meta: { requestId } }`

## Error Handling
- Zentral ueber Fastify `setErrorHandler` in `server/src/app.ts`
- 4xx werden als `warn`, 5xx als `error` geloggt
- 404 fuer unbekannte Routen liefert `route_not_found`

## Tenant + Location Access
- Zugriff wird im Service-Layer ueber `TenantAccessRepository` bestimmt.
- Jede Orders-Abfrage ist auf erlaubte `locationIds` eingeschraenkt.
- `OWNER` sieht alle Standorte des Tenants, andere Rollen nur zugewiesene.
- User-Identitaet kommt aus einer HttpOnly Session-Cookie (`session_token`).
- Guard `requireAuth` setzt `request.authUser` fuer geschuetzte Routen.
