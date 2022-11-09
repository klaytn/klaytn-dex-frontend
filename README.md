# klaytn-dex-frontend

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
