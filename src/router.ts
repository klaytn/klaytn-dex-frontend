import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { RouteName } from './types'

export default createRouter({
  history: import.meta.env.VITE_ROUTER_HASH_MODE === 'TRUE' ? createWebHashHistory() : createWebHistory(),
  routes: [
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
          path: '/liquidity/add/:tokenA?/:tokenB?',
          component: () => import('./pages/trade/liquidity/add.vue'),
        },
        {
          name: RouteName.LiquidityRemove,
          path: '/liquidity/remove',
          component: () => import('./pages/trade/liquidity/remove.vue'),
        },
      ],
    },
    {
      path: '/farms',
      component: () => import('./pages/earn/index.vue'),
      children: [
        {
          name: RouteName.Farms,
          path: '',
          component: () => import('./pages/earn/farms.vue'),
        },
        {
          name: RouteName.Pools,
          path: '/pools',
          component: () => import('./pages/earn/pools.vue'),
        },
      ],
    },
    {
      path: '/assets',
      component: () => import('./pages/assets/index.vue'),
      children: [
        {
          name: RouteName.Assets,
          path: '',
          component: () => import('./pages/assets/assets.vue'),
        },
        {
          name: RouteName.Transactions,
          path: '/transactions',
          component: () => import('./pages/assets/transactions.vue'),
        },
      ],
    },
    {
      name: RouteName.Voting,
      path: '/voting',
      component: () => import('./pages/voting/index.vue'),
    },
    {
      name: RouteName.VotingProposal,
      path: '/voting/:id',
      component: () => import('./pages/voting/[id].vue'),
    },
    {
      path: '/:catchAll(.*)*',
      redirect: { name: RouteName.Swap },
    },
  ],
})
