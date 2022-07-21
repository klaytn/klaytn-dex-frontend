import { Address, isEmptyAddress, ValueWei } from '@/core/kaikas'
import { TokensPair } from '@/utils/pair'
import { useScope, useTask } from '@vue-kakuyaku/core'
import BigNumber from 'bignumber.js'
import { Ref } from 'vue'

export type PairAddressResult = 'unknown' | 'empty' | 'not-empty'

export function usePairAddress(pair: TokensPair<Address | null | undefined>): {
  pending: boolean
  result: PairAddressResult
  pair: null | {
    addr: Address
    totalSupply: ValueWei<string>
    userBalance: ValueWei<string>
  }
  touch: () => void
  poolShare: null | number
} {
  const kaikasStore = useKaikasStore()

  const key = computed<null | string>(() => {
    const a = pair.tokenA ?? null
    const b = pair.tokenB ?? null
    return a && b && (kaikasStore.isConnected || null) && `${a}-${b}`
  })

  const scope = useScope(key, () => {
    const kaikas = kaikasStore.getKaikasAnyway()
    const pairForSure = pair as TokensPair<Address>

    const task = useTask(async () => {
      const addr = await kaikas.tokens.getPairAddress(pairForSure)
      if (isEmptyAddress(addr)) return null
      const { userBalance, totalSupply } = await kaikas.tokens.getPairBalanceOfUser(pairForSure)
      return { addr, userBalance, totalSupply }
    })

    task.run()

    useTaskLog(task, 'trade-pair-by-tokens')

    return task
  })

  const taskState = computed(() => scope.value?.setup.state ?? null)

  const pending = computed(() => taskState.value?.kind === 'pending')

  const result = computed<PairAddressResult>(() => {
    const state = taskState.value
    if (state?.kind === 'ok') {
      return state.data === null ? 'empty' : 'not-empty'
    }
    return 'unknown'
  })

  const loaded = computed(() => (taskState.value?.kind === 'ok' ? taskState.value.data : null))

  function touch() {
    scope.value?.setup.run()
  }

  const poolShare = computed(() => {
    const { userBalance, totalSupply } = loaded.value || {}
    if (!userBalance || !totalSupply) return null
    return new BigNumber(userBalance).dividedBy(totalSupply).toNumber()
  })

  return reactive({ pair: loaded, pending, result, touch, poolShare })
}

export function usePairReserves(tokens: TokensPair<Address | null> | Ref<null | TokensPair<null | Address>>) {
  const kaikasStore = useKaikasStore()

  const normalized = computed(() => {
    const { tokenA, tokenB } = unref(tokens) ?? {}
    if (!tokenA || !tokenB) return null
    return { tokenA, tokenB }
  })

  const scope = useScope(
    computed(() => !!normalized.value && kaikasStore.isConnected),
    () => {
      const { tokenA, tokenB } = normalized.value!

      const task = useTask(async () => {
        return kaikasStore.getKaikasAnyway().tokens.getPairReserves({ tokenA, tokenB })
      })

      useTaskLog(task, 'pair-reserves')
      task.run()

      return task
    },
  )

  const reserves = computed(() => {
    const state = scope.value?.setup.state
    if (!state) return null
    return state.kind === 'ok' ? state.data : null
  })

  return reserves
}
