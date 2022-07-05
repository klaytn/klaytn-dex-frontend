import Config from './Config'
import { type ValueWei, type Address, type Deadline } from './types'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { MAGIC_GAS_PRICE } from './const'

type WeiNumStrBn = ValueWei<number | string | BN>

export interface TokenAddrAndValue {
  addr: Address
  value: WeiNumStrBn
}

/**
 * FIXME type bignumbers & deadline
 */
export interface AddLiquidityAmountPropsBase {
  tokenA: TokenAddrAndValue
  tokenB: TokenAddrAndValue
  deadline: Deadline
}

export interface AddLiquidityAmountOutProps extends AddLiquidityAmountPropsBase {
  mode: 'out'
  amountAMin: WeiNumStrBn
}

export interface AddLiquidityAmountInProps extends AddLiquidityAmountPropsBase {
  mode: 'in'
  amountBMin: WeiNumStrBn
}

type AddLiquidityAmountProps = AddLiquidityAmountOutProps | AddLiquidityAmountInProps

export interface AddLiquidityResult {
  gas: ValueWei<number>
  send: () => Promise<unknown>
}

/**
 * FIXME why is this needed?
 */
function computeAmountByTokenValue(tokenValue: WeiNumStrBn): ValueWei<string> {
  return new BN(tokenValue).divn(100).toString() as ValueWei<string>
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('computing amount by token value', () => {
    test('when token value is 1423, amount is 14', () => {
      expect(computeAmountByTokenValue(1423 as WeiNumStrBn)).toEqual('14')
    })
  })
}

export default class Liquidity {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  public async addLiquidityAmountForExistingPair(props: AddLiquidityAmountProps): Promise<AddLiquidityResult> {
    interface NormalizedProps {
      tokenAAddr: Address
      tokenBAddr: Address
      tokenAValue: WeiNumStrBn
      tokenBValue: WeiNumStrBn
      amountAMin: WeiNumStrBn
      amountBMin: WeiNumStrBn
    }

    const normalized: NormalizedProps =
      props.mode === 'out'
        ? {
            tokenAAddr: props.tokenA.addr,
            tokenBAddr: props.tokenB.addr,
            tokenAValue: props.tokenA.value,
            tokenBValue: props.tokenB.value,
            amountAMin: props.amountAMin,
            amountBMin: computeAmountByTokenValue(props.tokenB.value),
          }
        : {
            tokenAAddr: props.tokenB.addr,
            tokenBAddr: props.tokenA.addr,
            tokenAValue: props.tokenB.value,
            tokenBValue: props.tokenA.value,
            amountAMin: computeAmountByTokenValue(props.tokenA.value),
            amountBMin: props.amountBMin,
          }

    const addLiquidityMethod = this.cfg.contracts.router.methods.addLiquidity(
      normalized.tokenBAddr,
      normalized.tokenAAddr,
      normalized.tokenBValue,
      normalized.tokenAValue,
      normalized.amountBMin,
      normalized.amountAMin,
      this.cfg.addrs.self,
      props.deadline,
    )

    const lqGas = await addLiquidityMethod.estimateGas()
    const send = () =>
      addLiquidityMethod.send({
        from: this.cfg.addrs.self,
        gas: lqGas,
        gasPrice: MAGIC_GAS_PRICE,
      })

    return { gas: lqGas as ValueWei<number>, send }
  }

  public async addLiquidityKlayForExistingPair({
    tokenAValue,
    tokenBValue,
    addressA,
    amountAMin,
    deadline,
  }: {
    tokenBValue: BigNumber
    tokenAValue: BigNumber
    addressA: Address
    amountAMin: BigNumber
    deadline: Deadline
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: tokenBValue.minus(tokenBValue.dividedToIntegerBy(100).toFixed(0)).toFixed(0),
      address: this.cfg.addrs.self,
      deadline,
    }

    const addLiquidityMethod = this.cfg.contracts.router.methods.addLiquidityETH(
      params.addressA,
      params.tokenAValue,
      params.amountAMin,
      params.amountBMin,
      params.address,
      params.deadline,
    )

    const lqETHGas = await addLiquidityMethod.estimateGas({
      from: this.cfg.addrs.self,
      gasPrice: MAGIC_GAS_PRICE,
      value: tokenBValue.toFixed(0),
    })

    const send = async () =>
      await addLiquidityMethod.send({
        from: this.cfg.addrs.self,
        gasPrice: MAGIC_GAS_PRICE,
        gas: lqETHGas,
        value: tokenBValue.toFixed(0),
      })

    return { gas: lqETHGas, send }
  }

  public async addLiquidityKlay({
    addressA,
    tokenAValue,
    tokenBValue,
    amountAMin,
    amountBMin,
    deadline,
  }: {
    addressA: Address
    tokenAValue: BigNumber
    tokenBValue: BigNumber
    amountAMin: BigNumber
    amountBMin: BigNumber
    deadline: Deadline
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: amountBMin.toFixed(0), // KLAY
      deadline,
      address: this.cfg.addrs.self,
    }

    const addLiquidityMethod = this.cfg.contracts.router.methods.addLiquidityETH(
      params.addressA,
      params.tokenAValue,
      params.amountAMin,
      params.amountBMin,
      params.address,
      params.deadline,
    )

    const lqETHGas = await addLiquidityMethod.estimateGas({
      from: this.cfg.addrs.self,
      gasPrice: MAGIC_GAS_PRICE,
      value: tokenBValue.toFixed(0),
    })

    const send = async () =>
      await addLiquidityMethod.send({
        from: this.cfg.addrs.self,
        gasPrice: MAGIC_GAS_PRICE,
        value: tokenBValue.toFixed(0),
        gas: lqETHGas,
      })

    return { gas: lqETHGas, send }
  }
}
