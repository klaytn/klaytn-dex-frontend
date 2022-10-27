import { Token } from '@/core'
import { MaybeRef } from '@vueuse/core'
import { Ref } from 'vue'

export function useBalance(
  condition: Ref<boolean>,
  {
    address,
    decimals,
  }: {
    address: MaybeRef<Token['address']>
    decimals: MaybeRef<number>
  },
) {
  const dexStore = useDexStore()

  const balanceScope = useParamScope(
    () => {
      const activeDex = dexStore.active

      return (
        activeDex.kind === 'named' &&
        unref(condition) && {
          key: `dex-${activeDex.wallet}-${address}`,
          payload: { dex: activeDex.dex(), token: { address: unref(address), decimals: unref(decimals) } },
        }
      )
    },
    ({ payload: { dex, token } }) => {
      const { state } = useTask(
        async () => {
          const balance = await dex.tokens.getTokenBalanceOfUser(token.address)
          return balance.decimals(token)
        },
        { immediate: true },
      )

      usePromiseLog(state, 'get-staked-token-balance')

      return state
    },
  )

  const balance = computed(() => {
    return balanceScope.value?.expose?.fulfilled?.value ?? null
  })

  return balance
}
