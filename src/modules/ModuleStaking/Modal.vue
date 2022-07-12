<script setup lang="ts" name="ModuleStakingModal">
import { STextField, SButton, Status } from '@soramitsu-ui/ui'
import { ModalOperation, Pool } from './types'
import { FORMATTED_BIG_INT_DECIMALS } from './const'
import { StakingInitializable } from '@/types/typechain/farming/StakingFactoryPool.sol'
import BigNumber from 'bignumber.js'
import { STAKING } from '@/core/kaikas/smartcontracts/abi'
import { useScope, useTask } from '@vue-kakuyaku/core'
import { tokenRawToWei, tokenWeiToRaw } from '@/core/kaikas'

const kaikasStore = useKaikasStore()
const kaikas = kaikasStore.getKaikasAnyway()

const vBem = useBemClass()
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  pool: Pool
  operation: ModalOperation
}>()
const { pool, operation } = toRefs(props)
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (e: 'staked' | 'unstaked', value: string): void
}>()

const model = useVModel(props, 'modelValue', emit, { passive: true })

const PoolContract = kaikas.cfg.createContract<StakingInitializable>(pool.value.id, STAKING)

const value = ref('0')
const loading = ref(false)

const balanceScope = useScope(model, () => {
  const task = useTask(async () => {
    const token = pool.value.stakeToken
    const balance = await kaikas.getTokenBalance(token.id)
    return new BigNumber(tokenWeiToRaw(token, balance))
  })
  useTaskLog(task, 'get-balance')
  task.run()
  return task
})
const balance = computed(() => {
  const state = balanceScope.value?.setup.state
  return state?.kind === 'ok' ? state.data : null
})

const formattedStaked = computed(() => {
  return new BigNumber(pool.value.staked.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const formattedBalance = computed(() => {
  if (balance.value === null) return ''

  return new BigNumber(balance.value.toFixed(FORMATTED_BIG_INT_DECIMALS))
})

const label = computed(() => {
  if (operation.value === ModalOperation.Stake) {
    return t('StakingModuleModal.stakeTitle')
  } else {
    return t('StakingModuleModal.unstakeTitle', { symbol: pool.value.stakeToken.symbol })
  }
})

const notEnough = computed(() => {
  if (balance.value === null) return false

  if (operation.value === ModalOperation.Stake) return new BigNumber(value.value).comparedTo(balance.value) === 1
  else return new BigNumber(value.value).comparedTo(pool.value.staked) === 1
})

const lessThanOrEqualToZero = computed(() => {
  return new BigNumber(value.value).comparedTo(0) !== 1
})

const disabled = computed(() => {
  return notEnough.value || lessThanOrEqualToZero.value
})

function setPercent(percent: number) {
  if (operation.value === ModalOperation.Stake) value.value = `${balance.value?.multipliedBy(percent * 0.01)}`
  else value.value = `${pool.value.staked.multipliedBy(percent * 0.01)}`
}

async function stake() {
  try {
    loading.value = true
    const amount = value.value
    const gasPrice = await kaikas.cfg.caver.klay.getGasPrice()
    const deposit = PoolContract.methods.deposit(
      tokenRawToWei(
        // FIXME stake token or reward token?
        pool.value.stakeToken,
        amount,
      ),
    )
    const estimateGas = await deposit.estimateGas({
      from: kaikas.selfAddress,
      gasPrice,
    })
    const receipt = await deposit.send({
      from: kaikas.selfAddress,
      gas: estimateGas,
      gasPrice,
    })
    if (receipt.status === false) throw new Error('Transaction error')

    $notify({ status: Status.Success, description: `${amount} ${pool.value.stakeToken.symbol} tokens were staked` })
    emit('staked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: `Stake ${pool.value.stakeToken.symbol} tokens error` })
    throw new Error('Error')
  } finally {
    loading.value = false
  }
}

async function unstake() {
  try {
    loading.value = true
    const amount = value.value
    const gasPrice = await kaikas.cfg.caver.klay.getGasPrice()
    const withdraw = PoolContract.methods.withdraw(tokenRawToWei(pool.value.stakeToken, amount))
    const estimateGas = await withdraw.estimateGas({
      from: kaikas.selfAddress,
      gasPrice,
    })
    await withdraw.send({
      from: kaikas.selfAddress,
      gas: estimateGas,
      gasPrice,
    })
    $notify({ status: Status.Success, description: `${amount} ${pool.value.stakeToken.symbol} tokens were unstaked` })
    emit('unstaked', amount)
  } catch (e) {
    console.error(e)
    $notify({ status: Status.Error, description: `Unstake ${pool.value.stakeToken.symbol} tokens error` })
    throw new Error('Error')
  } finally {
    loading.value = false
  }
}

async function confirm() {
  switch (operation.value) {
    case ModalOperation.Stake:
      stake()
      break
    case ModalOperation.Unstake:
      unstake()
      break
  }
}
</script>

<template>
  <KlayModal
    v-model="model"
    width="420"
    :label="label"
  >
    <div v-bem="'row'">
      <div v-bem="'input-wrapper'">
        <STextField
          v-model="value"
          v-bem="'input'"
        />
        <div v-bem="'info'">
          <KlayCharAvatar
            v-bem="'pair-icon'"
            :symbol="pool.stakeToken.symbol"
          />
          <div v-bem="'pair-name'">
            {{ pool.stakeToken.symbol }}
          </div>
        </div>
        <div
          v-if="operation === ModalOperation.Stake"
          v-bem="'balance'"
        >
          Balance: {{ formattedBalance }}
        </div>
        <div
          v-if="operation === ModalOperation.Unstake"
          v-bem="'staked'"
        >
          Staked: {{ formattedStaked }}
        </div>
      </div>
    </div>
    <div v-bem="'percents'">
      <SButton
        v-for="percent in [10, 25, 50, 75]"
        :key="percent"
        v-bem="'percent'"
        size="sm"
        @click="setPercent(percent)"
      >
        {{ percent }}%
      </SButton>
      <SButton
        v-bem="'percent'"
        type="primary"
        size="sm"
        @click="setPercent(100)"
      >
        MAX
      </SButton>
    </div>
    <div v-bem="'row'">
      <SButton
        v-bem="'confirm'"
        type="primary"
        size="lg"
        :disabled="disabled"
        :loading="loading"
        @click="confirm"
      >
        Confirm
      </SButton>
    </div>
  </KlayModal>
</template>

<style lang="sass">
@import '@/styles/vars.sass'

.staking-module-stake-modal
  &__row
    & + &
      margin-top: 16px
  &__input
    &-wrapper
      position: relative
    .s-text-field__input-wrapper
      height: 88px
      input
        padding: 16px 92px 33px 16px
        font-size: 30px
        font-weight: 600
        line-height: 39px
  &__info
    position: absolute
    display: flex
    align-items: center
    height: 39px
    top: 16px
    right: 16px
  &__percents
    display: flex
    margin: 8px 0 24px
  &__percent
    flex: 1
    font-size: 12px
    font-weight: 700
    & + &
      margin-left: 16px
  &__pair
    position: absolute
    display: flex
    align-items: center
    height: 39px
    top: 16px
    right: 16px
    &-name
      margin-left: 8px
      font-size: 14px
      font-weight: 600
  &__staked, &__balance
    position: absolute
    right: 16px
    bottom: 8px
    font-size: 12px
    line-height: 14px
    font-weight: 400
    color: $gray2
  &__confirm
    width: 100%
</style>
