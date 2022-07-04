import Config from './Config'
import { type Address } from './types'
import BigNumber from 'bignumber.js'
import { MAGIC_GAS_PRICE } from './const'
import { TransactionReceipt } from 'web3-core'
import { Opaque } from 'type-fest'

/**
 * FIXME type bignumbers & deadline
 */
export interface AddLiquidityAmountParamsBase {
  tokenAValue: BigNumber
  tokenBValue: BigNumber
  tokenAddressA: Address
  tokenAddressB: Address
  deadline: Deadline
}

/**
 * FIXME in liquidity store it is usually computed as:
 *
 * ```ts
 * Math.floor(Date.now() / 1000 + 300)
 * ```
 *
 * So... it seems to be a unix epoch time in seconds
 */
export type Deadline = Opaque<number, 'LiquidityDeadline'>

export function deadlineFromMs(ms: number): Deadline {
  return ~~(ms / 1000) as Deadline
}

export interface AddLiquidityAmountOutParams extends AddLiquidityAmountParamsBase {
  mode: 'out'
  // FIXME type stricter
  // is it a wei value?
  amountAMin: BigNumber
}

export interface AddLiquidityAmountInParams extends AddLiquidityAmountParamsBase {
  mode: 'in'
  // FIXME type stricter
  amountBMin: BigNumber
}

export default class Liquidity {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  public async addLiquidityAmountForExistingPair(
    paramsRaw: AddLiquidityAmountInParams | AddLiquidityAmountOutParams,
  ): Promise<{
    // FIXME type gas
    gas: number
    send: () => Promise<TransactionReceipt>
  }> {
    const params = {
      tokenAAddress: paramsRaw.tokenAddressA,
      tokenBAddress: paramsRaw.tokenAddressB,
      tokenAValue: paramsRaw.tokenAValue.toFixed(0),
      tokenBValue: paramsRaw.tokenBValue.toFixed(0),

      // FIXME why division by 100
      amountAMin:
        paramsRaw.mode === 'in'
          ? paramsRaw.tokenAValue.minus(paramsRaw.tokenAValue.dividedToIntegerBy(100)).toFixed(0)
          : paramsRaw.amountAMin.toFixed(0),
      amountBMin:
        paramsRaw.mode === 'out'
          ? paramsRaw.tokenBValue.minus(paramsRaw.tokenBValue.dividedToIntegerBy(100)).toFixed(0)
          : paramsRaw.amountBMin.toFixed(0),
      userAddress: this.cfg.addrs.self,
      deadline: paramsRaw.deadline,
    }

    const addLiquidityWithMode =
      paramsRaw.mode === 'in'
        ? this.cfg.contracts.router.methods.addLiquidity(
            params.tokenBAddress,
            params.tokenAAddress,
            params.tokenBValue,
            params.tokenAValue,
            params.amountBMin,
            params.amountAMin,
            params.userAddress,
            params.deadline,
          )
        : this.cfg.contracts.router.methods.addLiquidity(
            params.tokenAAddress,
            params.tokenBAddress,
            params.tokenAValue,
            params.tokenBValue,
            params.amountAMin,
            params.amountBMin,
            params.userAddress,
            params.deadline,
          )

    const lqGas = await addLiquidityWithMode.estimateGas()
    const send = () =>
      addLiquidityWithMode.send({
        from: this.cfg.addrs.self,
        gas: lqGas,
        gasPrice: MAGIC_GAS_PRICE,
      })

    return { gas: lqGas, send }
  }

  public async addLiquidityKlayForExistsPair({
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

    const addLiquidity = this.cfg.contracts.router.methods.addLiquidityETH(
      params.addressA,
      params.tokenAValue,
      params.amountAMin,
      params.amountBMin,
      params.address,
      params.deadline,
    )

    const lqETHGas = await addLiquidity.estimateGas({
      from: this.cfg.addrs.self,
      gasPrice: MAGIC_GAS_PRICE,
      value: tokenBValue.toFixed(0),
    })

    const send = async () =>
      await addLiquidity.send({
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

    const addLiquidity = this.cfg.contracts.router.methods.addLiquidityETH(
      params.addressA,
      params.tokenAValue,
      params.amountAMin,
      params.amountBMin,
      params.address,
      params.deadline,
    )

    const lqETHGas = await addLiquidity.estimateGas({
      from: this.cfg.addrs.self,
      gasPrice: MAGIC_GAS_PRICE,
      value: tokenBValue.toFixed(0),
    })

    const send = async () =>
      await addLiquidity.send({
        from: this.cfg.addrs.self,
        gasPrice: MAGIC_GAS_PRICE,
        value: tokenBValue.toFixed(0),
        gas: lqETHGas,
      })

    return { gas: lqETHGas, send }
  }
}
