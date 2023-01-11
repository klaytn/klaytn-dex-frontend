<script setup lang="ts" name="ModuleStakingPool">
import { ModalOperation, Pool } from './types'
import { RoiType, RouteName } from '@/types'
import BigNumber from 'bignumber.js'
import { useEnableState } from '../ModuleEarnShared/composable.check-enabled'
import { Wei, WeiAsToken, makeExplorerLinkToAccount } from '@/core'
import ModalCard from './ModalCard.vue'
import { SModal } from '@soramitsu-ui/ui'
import PoolHead from './PoolHead.vue'
import WalletConnectButton from '@/components/WalletConnectButton.vue'
import AddToWallet from './PoolAddToWallet.vue'
import { useBalance } from '../ModuleEarnShared/composable.balance'
import { KlayIconClock } from '~klay-icons'

const dexStore = useDexStore()
const tokensStore = useTokensStore()
const { notify } = useNotify()

const router = useRouter()
const { t } = useI18n()

const props = defineProps<{
  pool: Pool
  blockNumber: null | number
}>()

const emit = defineEmits<{
  (e: 'staked' | 'unstaked', value: WeiAsToken<BigNumber>): void
  (e: 'withdrawn'): void
}>()

const expanded = ref(false)
const modalOperation = ref<ModalOperation | null>(null)
const showRoiCalculator = ref(false)

const modalOpen = computed({
  get() {
    return !!modalOperation.value
  },
  set(value) {
    if (!value) modalOperation.value = null
  },
})

const balance = useBalance(logicOr(modalOpen, showRoiCalculator), {
  address: props.pool.stakeToken.id,
  decimals: props.pool.stakeToken.decimals,
})

const startsIn = computedEager<number>(() => {
  const {
    pool: { startBlock },
    blockNumber,
  } = props
  return blockNumber ? startBlock - blockNumber : 0
})

const endsIn = computedEager<number>(() => {
  const {
    pool: { endBlock },
    blockNumber,
  } = props
  return blockNumber ? endBlock - blockNumber : 0
})

const userLimitEndsIn = computedEager<number>(() => {
  const {
    pool: { userLimitEndBlock },
    blockNumber,
  } = props
  return blockNumber ? userLimitEndBlock - blockNumber : 0
})

const nonNegativeUserLimitEndsIn = computed(() => Math.max(0, userLimitEndsIn.value))

const {
  pending: loading,
  enable,
  enabled,
} = useEnableState({
  contract: computedEager(() => props.pool.stakeToken.id),
  spender: computedEager(() => props.pool.id),
  active: expanded,
})

function stake() {
  modalOperation.value = ModalOperation.Stake
}

function unstake() {
  modalOperation.value = ModalOperation.Unstake
}

const { state: addToWalletState, set: setAddToWalletPromise } = usePromise()

function addRewardTokenToWallet(pool: Pool) {
  async function action() {
    await dexStore.getNamedDexAnyway().agent.watchAsset({
      address: pool.rewardToken.id,
      symbol: pool.rewardToken.symbol,
      decimals: pool.rewardToken.decimals,
    })
  }

  setAddToWalletPromise(action())
}

usePromiseLog(addToWalletState, 'add-reward-token-to-wallet')

const swapStore = useSwapStore()

function goToSwapPage() {
  const { rewardToken, stakeToken } = props.pool
  swapStore.setBothTokens({
    tokenA: rewardToken.id,
    tokenB: stakeToken.id,
  })
  router.push({ name: RouteName.Swap })
}

const { state: withdrawState, run: withdraw } = useTask(async () => {
  const {
    pool: { id: poolId },
  } = props
  await dexStore.getNamedDexAnyway().earn.staking.withdraw({ amount: new Wei(0), poolId })
})

usePromiseLog(withdrawState, 'staking-pool-withdraw')

wheneverDone(withdrawState, (result) => {
  if (result.fulfilled) {
    notify({ type: 'ok', description: `Tokens were withdrawn` })
    emit('withdrawn')

    tokensStore.touchUserBalance()
  } else {
    notify({
      type: 'err',
      description: `Withdraw ${props.pool.rewardToken.symbol} tokens error`,
      error: result.rejected.reason,
    })
  }
})

function handleStaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('staked', amount)
}

function handleUnstaked(amount: WeiAsToken<BigNumber>) {
  modalOperation.value = null
  emit('unstaked', amount)
}

function openRoiCalculator() {
  showRoiCalculator.value = true
}
</script>

<template>
  <KlayAccordionItem
    v-model="expanded"
    class="module-staking-pool"
  >
    <template #title>
      <PoolHead
        :reward-token-symbol="pool.rewardToken.symbol"
        :stake-token-symbol="pool.stakeToken.symbol"
        :earned="pool.earned"
        :total-staked-usd="pool.totalStaked"
        :annual-percentage-rate="pool.annualPercentageRate"
        :starts-in="startsIn"
        :ends-in="endsIn"
        :user-limit="pool.userLimit"
        :user-limit-ends-in="userLimitEndsIn"
        @click:roi-calculator="openRoiCalculator"
      />
    </template>

    <div
      v-if="loading"
      class="w-full flex justify-center"
    >
      <KlayLoader />
    </div>

    <template v-else>
      <div
        v-if="pool.userLimit"
        class="flex flex-col items-start lt-md:hidden mb-2"
      >
        <div :class="$style.statsItem">
          <div :class="$style.statsItemTitle">
            User limit
          </div>
          <div :class="[$style.statsItemValue, { [$style.statsItemValueEmpty]: !pool.userLimit }]">
            <CurrencyFormatTruncate :amount="pool.userLimit" />
          </div>
        </div>

        <div :class="$style.statsItem">
          <div :class="$style.statsItemTitle">
            User limit ends in
          </div>
          <div :class="[$style.statsItemValue, { [$style.statsItemValueEmpty]: !nonNegativeUserLimitEndsIn }]">
            <template v-if="nonNegativeUserLimitEndsIn">
              <span class="mr-2">
                <CurrencyFormat :amount="nonNegativeUserLimitEndsIn" />
              </span>

              <KlayIconClock />
            </template>
            <template v-else>
              &mdash;
            </template>
          </div>
        </div>
      </div>
      <div class="flex md:items-center lt-md:flex-col gap-4 md:gap-6">
        <WalletConnectButton
          v-if="!dexStore.isWalletConnected"
          size="md"
        />

        <template v-else-if="!enabled">
          <KlayButton
            type="primary"
            @click="enable()"
          >
            Enable {{ pool.stakeToken.symbol }}
          </KlayButton>

          <KlayButton @click="goToSwapPage()">
            Get {{ pool.stakeToken.symbol }}
          </KlayButton>
        </template>

        <template v-else>
          <div :class="$style.input">
            <div :class="$style.inputLabel">
              {{ t('ModuleStakingPool.staked', { symbol: pool.stakeToken.symbol }) }}
            </div>

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormatTruncate
                  :class="$style.inputValue"
                  :amount="pool.staked"
                  max-width="auto"
                />
              </template>

              <template #right>
                <KlayButton
                  v-if="pool.staked.isZero()"
                  :disabled="!pool.active"
                  type="primary"
                  @click="stake()"
                >
                  Stake {{ pool.stakeToken.symbol }}
                </KlayButton>

                <div
                  v-else
                  class="space-x-2"
                >
                  <KlayButton @click="unstake()">
                    -
                  </KlayButton>
                  <KlayButton
                    :disabled="!pool.active"
                    @click="stake()"
                  >
                    +
                  </KlayButton>
                </div>
              </template>
            </InputCurrencyTemplate>
          </div>

          <div :class="$style.input">
            <div :class="$style.inputLabel">
              {{ t('ModuleStakingPool.earned', { symbol: pool.rewardToken.symbol }) }}
            </div>

            <InputCurrencyTemplate right>
              <template #input>
                <CurrencyFormatTruncate
                  :class="$style.inputValue"
                  :amount="pool.earned"
                  max-width="auto"
                />
              </template>

              <template #right>
                <KlayButton
                  :disabled="!pool.earned || pool.earned.isZero()"
                  @click="withdraw()"
                >
                  Withdraw
                </KlayButton>
              </template>
            </InputCurrencyTemplate>
          </div>
        </template>
      </div>

      <div class="flex items-center flex-wrap gap-4 mt-6">
        <KlayExternalLink :href="makeExplorerLinkToAccount(pool.stakeToken.id)">
          See Token Info
        </KlayExternalLink>
        <!-- FIXME href? -->
        <!-- <KlayExternalLink>View Project Site</KlayExternalLink> -->
        <KlayExternalLink :href="makeExplorerLinkToAccount(pool.id)">
          View Contract
        </KlayExternalLink>
        <AddToWallet
          v-if="dexStore.active.kind === 'named'"
          class="text-xs"
          :connected="dexStore.active.wallet"
          @click="addRewardTokenToWallet(pool)"
        />
      </div>
    </template>
  </KlayAccordionItem>

  <SModal
    :show="!!modalOperation"
    @update:show="!$event && (modalOperation = null)"
  >
    <ModalCard
      :pool-id="pool.id"
      :operation="modalOperation!"
      :staked="pool.staked"
      :balance="balance"
      :stake-token="pool.stakeToken"
      :user-limit="pool.userLimit"
      @staked="handleStaked"
      @unstaked="handleUnstaked"
    />
  </SModal>

  <ModuleEarnSharedRoiCalculator
    v-model:show="showRoiCalculator"
    :type="RoiType.Staking"
    :staked="pool.staked"
    :apr="pool.annualPercentageRate"
    :balance="balance"
    :show-balance-button="dexStore.isWalletConnected"
    :stake-token-price="pool.stakeTokenPrice"
    :stake-token-decimals="pool.stakeToken.decimals"
    :reward-token-decimals="pool.rewardToken.decimals"
    :stake-token-symbol="pool.stakeToken.symbol"
    :reward-token-symbol="pool.rewardToken.symbol"
  />
</template>

<style lang="scss" module>
@use '@/styles/vars';

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 2rem;
  &-title {
    font-weight: 500;
    font-size: 12px;
    color: vars.$gray2;
    line-height: 100%;
  }
  &-value {
    margin-left: 1rem;
    font-weight: 600;
    font-size: 16px;
    color: vars.$dark;
  }
}

.input {
  display: flex;
  flex-direction: column;
  width: 388px;
  max-width: 100%;

  &-label {
    font-weight: 500;
    font-size: 12px;
    color: vars.$gray2;
    margin-bottom: 8px;
  }

  &-value {
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 36px;
  }
}
</style>

<style lang="scss">
@use '@/styles/vars';

.module-staking-pool .klay-accordion-item__chevron-wrapper {
  height: 56px;
  @media only screen and (min-width: vars.$md) {
    height: 100%;
  }
}
</style>
