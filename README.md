# Klaytn-DEX Frontend Documentation

Here you can find Klaytn-DEX frontend documentation:

- [User Guide](docs/guide.md) provides instructions on how to interact with Klaytn-DEX 
- [Frontend Specification](docs/modules.md) describes the Klaytn-DEX module structure
- [Deployment Guide](docs/deploy.md) provides instructions on how to deploy Klaytn-DEX

## Local Development

```bash
pnpm i

# run dev server
pnpm dev

# run unit tests in watch mode
pnpm vitest

# open cypress
pnpm cy

# fix formatting
pnpm format:fix

# static analysis
pnpm typecheck
pnpm lint
```

## CI/CD

First of all, create `.env.local` file. Use `.env.example` as a reference.

Commands:

```bash
pnpm i

# check code formatting
pnpm format:check

# run static analysis
pnpm typecheck
pnpm lint

# run both unit & component tests
pnpm test

# build
pnpm build
```
