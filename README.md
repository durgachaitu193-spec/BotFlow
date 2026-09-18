<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/sim/public/logo/botflow-text-light.png">
    <img src="apps/sim/public/logo/botflow-text-dark.png" alt="BotFlow" width="420"/>
  </picture>
</p>

<p align="center">Build and deploy AI agent workflows in minutes.</p>

<p align="center">
  <a href="https://botflow.ai/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/botflow.ai-FF6A00?style=for-the-badge&labelColor=0B0B0B&logoColor=white" alt="botflow.ai">
  </a>
  <a href="https://docs.botflow.ai" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Docs-FF6A00.svg?color=%23FF6A00" alt="Documentation">
  </a>
</p>

---

**BotFlow Studio** is the visual builder in the BotFlow ecosystem. Compose AI
agents on a canvas, deploy them to a live endpoint, and give each one an onchain
identity and wallet.

It pairs with **BotFlow Pay**, an [x402](https://x402.org) payment facilitator,
so agents can charge for what they do and settle onchain.

- **Build** — drag-and-drop canvas, models, tools and APIs without glue code
- **Deploy** — publish a workflow as an API, a chat interface, or a scheduled job
- **Connect** — agents get a DID (`did:botflow:agent:…`), an ERC-8004 registry
  entry and a contract wallet on BNB Smart Chain

## Quickstart

### Self-hosted: NPM package

```bash
npx botflowstudio
```

→ http://localhost:3000

Docker must be installed and running.

| Flag | Description |
|------|-------------|
| `-p, --port <port>` | Port to run BotFlow on (default `3000`) |
| `--no-pull` | Skip pulling latest Docker images |

### Self-hosted: Docker Compose

```bash
git clone https://github.com/kaifoundry/wazabi-workflow.git
cd wazabi-workflow
docker compose -f docker-compose.prod.yml up -d
```

Access the application at [http://localhost:3000/](http://localhost:3000/)

#### Local models with Ollama

Run BotFlow against local models — no external APIs required:

```bash
# GPU (automatically downloads gemma3:4b)
docker compose -f docker-compose.ollama.yml --profile setup up -d

# CPU only
docker compose -f docker-compose.ollama.yml --profile cpu --profile setup up -d
```

Wait for the model to download, then visit http://localhost:3000. Add more with:

```bash
docker compose -f docker-compose.ollama.yml exec ollama ollama pull llama3.1:8b
```

### Self-hosted: Dev containers

1. Open VS Code with the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project and choose "Reopen in Container"
3. Run `bun run dev:full` — this starts both the app and the realtime socket server

### Self-hosted: Manual setup

**Requirements**

- [Bun](https://bun.sh/)
- PostgreSQL 12+ with [pgvector](https://github.com/pgvector/pgvector) — required
  for knowledge bases and semantic search

**1. Clone and install**

```bash
git clone https://github.com/kaifoundry/wazabi-workflow.git
cd wazabi-workflow
bun install
```

**2. PostgreSQL with pgvector**

```bash
docker run --name botflow-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=botflow \
  -p 5432:5432 -d \
  pgvector/pgvector:pg17
```

Or install PostgreSQL 12+ and the extension yourself — see the
[pgvector installation guide](https://github.com/pgvector/pgvector#installation).

**3. Environment**

```bash
cd apps/sim
cp .env.example .env
```

At minimum set:

```bash
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/botflow"
BETTER_AUTH_SECRET="..."          # 32+ chars
ENCRYPTION_KEY="..."              # exactly 64 hex characters
INTERNAL_API_SECRET="..."         # 32+ chars, shared with the socket server
NEXT_PUBLIC_PRIVY_APP_ID="..."
PRIVY_APP_SECRET="..."            # see note below
```

> **`PRIVY_APP_SECRET` is required to sign in.** `/api/auth/privy/sync` verifies
> the caller's Privy access token with it before issuing the session cookie.
> Without it that route fails closed with a 503 and nobody can authenticate.
> Find it in the Privy dashboard under App settings.

> **`ENCRYPTION_KEY` must be exactly 64 hex characters** (32 bytes), e.g.
> `openssl rand -hex 32`. Anything else throws at runtime.

**4. Database**

```bash
cd packages/db
cp .env.example .env    # same DATABASE_URL
bunx drizzle-kit migrate --config=./drizzle.config.ts
```

**5. Run**

From the project root, both servers together:

```bash
bun run dev:full
```

Or separately — the app needs the socket server for collaborative editing and
for workflow changes to persist:

```bash
bun run dev                      # Next.js app, from the root
cd apps/sim && bun run dev:sockets   # realtime server, separate terminal
```

Both processes read `apps/sim/.env` **at start**, so restart both after
changing `INTERNAL_API_SECRET`, `BETTER_AUTH_SECRET` or `DATABASE_URL` —
otherwise the socket handshake fails and edits will not save.

## Onchain

Agents are registered on BNB Smart Chain (chain ID 56).

| | |
|---|---|
| DID format | `did:botflow:user:…` / `did:botflow:agent:…` |
| Registry | ERC-8004 identity and reputation |
| Payments | x402 v2 — EIP-3009 and ERC-20 via the Stargate settlement contract |

## Copilot

The Copilot tab is hidden pending release. `COPILOT_API_KEY` is still read if
set, but the panel is not rendered.

## Tech stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: [Privy](https://privy.io) + [Better Auth](https://better-auth.com)
- **UI**: [Shadcn](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Flow editor**: [ReactFlow](https://reactflow.dev/)
- **Docs**: [Fumadocs](https://fumadocs.vercel.app/)
- **Monorepo**: [Turborepo](https://turborepo.org/)
- **Realtime**: [Socket.io](https://socket.io/)
- **Background jobs**: [Trigger.dev](https://trigger.dev/)
- **Code execution**: [E2B](https://www.e2b.dev/)

## Contributing

See the [Contributing Guide](.github/CONTRIBUTING.md).

## License

Apache License 2.0 — see [LICENSE](LICENSE).

<p align="center">Build a more productive tomorrow.</p>
