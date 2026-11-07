# Web API routes

The web frontend owns the `/api/web/*` HTTP namespace.

Its router is mounted independently in `server.ts`; it does not call the
mobile or admin endpoint namespace. Shared controllers and services may be
reused internally, but web requests use only `/api/web/*` URLs.

Add web-only route registrations in this folder when a dedicated handler is
needed.