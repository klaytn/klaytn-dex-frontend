<script setup lang="ts">
import { NATIVE_TOKEN, NATIVE_TOKEN_FULL } from '@/core'
import { match } from 'ts-pattern'
import { SModal } from '@soramitsu-ui/ui'

const tokensStore = useTokensStore()
const { notify } = useNotify()

const klayBalance = computed(() => tokensStore.lookupUserBalance(NATIVE_TOKEN))

type Status = 'indeterminate' | 'ok' | 'err'

const status = computed<Status>(() => {
  const bal = klayBalance.value
  return bal ? (bal.asBigInt >= 0 ? 'ok' : 'err') : 'indeterminate'
})

const [showDetailsModal, toggleModal] = useToggle(false)

const DESCRIPTION = `The wallet gave a balance of ${NATIVE_TOKEN_FULL.name} as negative number. It is probably a wallet's bug.`

watch(
  status,
  (value) => {
    match(value)
      .with('err', () => {
        notify({
          type: 'err',
          title: 'Problem with the wallet',
          description: DESCRIPTION,
          action: {
            title: 'Details',
            fn: () => toggleModal(true),
          },
        })
      })
      .with('ok', () => {
        if (showDetailsModal.value) {
          toggleModal(false)
          notify({
            type: 'ok',
            title: 'The problem is gone',
          })
        }
      })
      .with('indeterminate', () => {})
      .exhaustive()
  },
  { immediate: true },
)

const areBalancesRefreshing = toRef(tokensStore, 'isBalancePending')

function refreshBalances() {
  tokensStore.touchUserBalance()
}
</script>

<template>
  <SModal v-model:show="showDetailsModal">
    <KlayModalCard
      title="Problem with the wallet"
      class="w-340px"
    >
      <div class="space-y-4">
        <p class="text">
          {{ DESCRIPTION }}
          <br><br>
          Try opening the wallet again and then click the button to refresh balances.
        </p>

        <KlayButton
          :loading="areBalancesRefreshing"
          @click="refreshBalances"
        >
          Refresh balances
        </KlayButton>
      </div>
    </KlayModalCard>
  </SModal>
</template>

<style lang="scss" scoped>
@use '@/styles/vars';

.text {
  font-weight: 500;
  font-size: 12px;
  line-height: 130%;
  color: vars.$gray2;
}
</style>
