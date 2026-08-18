# Penpot Local Setup

## Source

- Local environment setup performed in `C:\work\t2w-base\local-services\penpot\docker-compose.yaml`.
- The stack is based on the official Penpot compose template and was adjusted for local use.

## Result

- Penpot UI is reachable at `http://127.0.0.1:9001`.
- Mailcatch is reachable at `http://127.0.0.1:1080`.
- The stack includes backend, frontend, exporter, MCP, Postgres, Valkey, and Mailcatch services.

## Notes

- `PENPOT_PUBLIC_URI` was aligned to `http://127.0.0.1:9001` to avoid browser origin mismatch.
- A local login screen is available and email verification is disabled for local use.
