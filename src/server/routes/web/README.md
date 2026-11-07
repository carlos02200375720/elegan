# Web API routes

The web frontend owns the `/api/web/*` namespace and is registered through
`createWebRouter()` in `webRoutes.ts`.

The web router has its own route registrations. It may reuse backend controllers
and services, but it does not mount or call the mobile or admin routers.
