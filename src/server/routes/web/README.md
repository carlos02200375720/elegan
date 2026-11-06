# Web API routes

No web-exclusive backend endpoints were identified in the current frontend API layer.

The web application currently consumes the shared API under `/api` and `/api/v1`.
Keep web-specific endpoints here only when a route is verified to be used exclusively
by `src/app/web`. Do not duplicate shared endpoints or change their public URLs.
