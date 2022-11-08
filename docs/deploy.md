# Klaytn-DEX Deployment Guide

## Prerequisites 

To build Klaytn-DEX, you need Node.js v16 and PNPM v7 installed:

- Install Node.js v16.

  First, install Node Version Manager:
   
  ```bash
  # Install NVM itself
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

  # Run it to use NVM in the current shell session or restart your shell
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
  ```

  Then run:

  ```
  nvm install 16
  ```

- Install PNPM v7:
   
  ```bash
  npm i -g pnpm
  ```

## Configuration via Environment Variables

Some application parameters are defined as the environment variables. The expected types for these variables are defined in [`src/env.d.ts`](../src/env.d.ts). The values could be specified in `.env`, `.env.local`, other `.env*` files or directly in [user environment](https://nodejs.org/api/process.html#processenv).

You can use [`.env.example`](../.env.example) as an sample.

For more details about env variables and modes please consult [Vite documentation](https://vitejs.dev/guide/env-and-mode.html).

## Build without testing

1. Install dependencies:

   ```bash 
   pnpm i
   ```

2. Build Klaytn-DEX:

   ```bash
   pnpm build
   ```

## CI/CD

The following steps install dependencies, run checks, and then build the app:

1. Install dependencies:

   ```bash 
   pnpm i
   ```

2. Check code formatting:
   
   ```bash
   pnpm format:check
   ```

3. Run static analysis:

   ```bash
   pnpm typecheck
   pnpm lint
   ```

4. Run both unit and component tests:

   ```bash
   pnpm test
   ```

5. Build Klaytn-DEX:

   ```bash
   pnpm build
   ```
