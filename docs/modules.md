# Klaytn-DEX Frontend Specification

This specification provides the detailed description of Klaytn-DEX frontend. First, we describe the tools that were used for Klaytn-DEX frontend. Then, we provide an overview of its structure and modules. For the instructions on how to deploy Klaytn-DEX, refer to [Klaytn-DEX Deployment Guide](./deploy.md).

For the detailed specification of the Dex smart contracts, refer to [Klaytn-DEX Specification](https://github.com/soramitsu/klaytn-dex-contracts/blob/develop/docs/dex-specification.md).

Check [Klaytn-DEX User Guide](guide.md) for instructions on working with the Klaytn-DEX from the user side.

## Frontend Tech Stack

Frontend tools that were used for Klaytn-DEX frontend:

|                      |                         Tool                         |
| :------------------: | :--------------------------------------------------: |
|      Framework       |      [Vue](https://vuejs.org/) with TypeScript       |
|       Bundler        |             [Vite](https://vitejs.dev/)              |
| Store (Global State) |          [Pinia](https://pinia.vuejs.org/)           |
|       Routing        | [Vue Router (vue-router)](https://router.vuejs.org/) |

## Structure

| Directory     | Description                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`        | The core contains domain logic, ABI for smart contracts, and other core functionality. More about core [here](#core).                                                  |
| `components`  | Application components that are not connected to any specific module in the app. For example, the button for collecting a wallet or the header menu.                   |
| `store`       | The store contains the global state, which is shared between various modules.                                                                                          |
| `modules`     | Each modules here has a specific domain, such as staking, working with liquidity, or governance. More about each of these modules [here](#modules).                    |
| `composables` | Global utils containing Vue logic that is reused throughout the app.                                                                                                   |
| `directives`  | Global Vue directives.                                                                                                                                                 |
| `layouts`     | Application layout.                                                                                                                                                    |
| `assets`      | Various assets, such as images and icons.                                                                                                                              |
| `pages`       | The application structure for `vue-router`. The router is created in the `src/router.ts` file, where it defines the application pages and hierarchy of the components. |
| `plugins`     | Custom user plugin system.                                                                                                                                             |
| `types`       | Common types.                                                                                                                                                          |
| `styles`      | Global styles. The `styles/vars.sass` file contains global variables used throughout the app.                                                                          |
| `query`       | Queries for Klaytn-DEX subgraph.                                                                                                                                       |
| `utils`       | Various utility functions.                                                                                                                                             |

### Core

The `core` contains:

- domain logic
- classes for working with Kaikas and Metamask wallets via `caver` and `ethers` providers.
- ABI (application binary interface) for Klaytn-DEX smart contracts and their methods

### Modules

Each module has a specific domain and contains components, utils, store, etc. associated with this module's domain.

| Module              | Contents                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ModuleAssets`      | Functionality related to assets: listing assets, showing transaction details, and so on.                            |
| `ModuleEarnShared`  | Calculating earnings (ROI calculator).                                                                              |
| `ModuleFarming`     | Functionality related to farming pools.                                                                             |
| `ModuleGovernance`  | Governance-related functionality: proposals, voting, and so on.                                                     |
| `ModuleLiquidity`   | Liquidity-related functionality: adding and removing liquidity, viewing liquidity pairs.                            |
| `ModuleStaking`     | Functionality related to staking pools.                                                                             |
| `ModuleSwap`        | Swap-related functionality: showing details of the swap operation, confirming tokens, configuring swap preferences. |
| `ModuleTradeShared` | Functionality related to trading.                                                                                   |

### Pages

The `pages` module contains the application structure. The vue-router is created in the [`src/router.ts`](../src/router.ts) file, where it defines the application pages and hierarchy of the components. The router creation is manual.

For example, for the page with trading, the structure in `pages` is the following:

```
pages/trade
│   index.vue
│   swap.vue    
│
└───liquidity
    │   add.vue
    │   index.vue
    │   remove.vue

```
While the router defines the following route:

```ts
{
    path: '/swap',
    component: () => import('./pages/trade/index.vue'),
    children: [
    {
        name: RouteName.Swap,
        path: '',
        component: () => import('./pages/trade/swap.vue'),
    },
    {
        name: RouteName.Liquidity,
        path: '/liquidity',
        component: () => import('./pages/trade/liquidity/index.vue'),
    },
    {
        name: RouteName.LiquidityAdd,
        path: '/liquidity/add',
        component: () => import('./pages/trade/liquidity/add.vue'),
    },
    {
        name: RouteName.LiquidityRemove,
        path: '/liquidity/remove',
        component: () => import('./pages/trade/liquidity/remove.vue'),
    },
    ],
},
```

## Environment Variables

Some application parameters are defined as the environment variables via [`.env`](../.env). The expected types for these variables are defined in [`src/env.d.ts`](../src/env.d.ts).
