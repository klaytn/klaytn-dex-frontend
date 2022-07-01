import Config from './Config'
import { type Address } from './types'
import BigNumber from 'bignumber.js'
import { MAGIC_GAS_PRICE } from './const'

export default class Liquidity {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  public async addLiquidityAmountOutForExistPair({
    tokenBValue,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountAMin,
    deadLine,
  }: {
    tokenBValue: BigNumber
    tokenAValue: BigNumber
    tokenAddressA: Address
    tokenAddressB: Address
    amountAMin: BigNumber
    deadLine: number
  }) {
    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: tokenBValue.minus(tokenBValue.dividedToIntegerBy(100)).toFixed(0),
      userAddress: this.cfg.addrs.self,
      deadLine,
    }

    const lqGas = await this.cfg.contracts.router.methods
      .addLiquidity(
        params.tokenAAddress,
        params.tokenBAddress,
        params.tokenAValue,
        params.tokenBValue,
        params.amountAMin,
        params.amountBMin,
        params.userAddress,
        params.deadLine,
      )
      .estimateGas()

    const send = async () =>
      await this.cfg.contracts.router.methods
        .addLiquidity(
          params.tokenAAddress,
          params.tokenBAddress,
          params.tokenAValue,
          params.tokenBValue,
          params.amountAMin,
          params.amountBMin,
          params.userAddress,
          params.deadLine,
        )
        .send({
          from: this.cfg.addrs.self,
          gas: lqGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

    return {
      gas: lqGas,
      send,
    }
  }

  public async addLiquidityAmountInForExistPair({
    tokenBValue,
    tokenAValue,
    tokenAddressA,
    tokenAddressB,
    amountBMin,
    deadLine,
  }: {
    tokenBValue: BigNumber
    tokenAValue: BigNumber
    tokenAddressA: Address
    tokenAddressB: Address
    amountBMin: BigNumber
    deadLine: number
  }) {
    const params = {
      tokenAAddress: tokenAddressA,
      tokenBAddress: tokenAddressB,
      tokenAValue: tokenAValue.toFixed(0),
      tokenBValue: tokenBValue.toFixed(0),
      amountAMin: tokenAValue.minus(tokenAValue.dividedToIntegerBy(100)).toFixed(0),
      amountBMin: amountBMin.toFixed(0),
      userAddress: this.cfg.addrs.self,
      deadLine,
    }

    const lqGas = await this.cfg.contracts.router.methods
      .addLiquidity(
        params.tokenBAddress,
        params.tokenAAddress,
        params.tokenBValue,
        params.tokenAValue,
        params.amountBMin,
        params.amountAMin,
        params.userAddress,
        params.deadLine,
      )
      .estimateGas()

    const send = async () =>
      await this.cfg.contracts.router.methods
        .addLiquidity(
          params.tokenBAddress,
          params.tokenAAddress,
          params.tokenBValue,
          params.tokenAValue,
          params.amountBMin,
          params.amountAMin,
          params.userAddress,
          params.deadLine,
        )
        .send({
          from: this.cfg.addrs.self,
          gas: lqGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

    return {
      gas: lqGas,
      send,
    }
  }

  public async addLiquidityKlayForExistsPair({
    tokenAValue,
    tokenBValue,
    addressA,
    amountAMin,
    deadLine,
  }: {
    tokenBValue: BigNumber
    tokenAValue: BigNumber
    addressA: Address
    amountAMin: BigNumber
    deadLine: number
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: tokenBValue.minus(tokenBValue.dividedToIntegerBy(100).toFixed(0)).toFixed(0),
      address: this.cfg.addrs.self,
      deadLine,
    }

    const lqETHGas = await this.cfg.contracts.router.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine,
      )
      .estimateGas({
        from: this.cfg.addrs.self,
        gasPrice: MAGIC_GAS_PRICE,
        value: tokenBValue.toFixed(0),
      })

    const send = async () =>
      await this.cfg.contracts.router.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine,
        )
        .send({
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
    deadLine,
  }: {
    addressA: Address
    tokenAValue: BigNumber
    tokenBValue: BigNumber
    amountAMin: BigNumber
    amountBMin: BigNumber
    deadLine: number
  }) {
    const params = {
      addressA,
      tokenAValue: tokenAValue.toFixed(0),
      amountAMin: amountAMin.toFixed(0),
      amountBMin: amountBMin.toFixed(0), // KLAY
      deadLine,
      address: this.cfg.addrs.self,
    }

    const lqETHGas = await this.cfg.contracts.router.methods
      .addLiquidityETH(
        params.addressA,
        params.tokenAValue,
        params.amountAMin,
        params.amountBMin,
        params.address,
        params.deadLine,
      )
      .estimateGas({
        from: this.cfg.addrs.self,
        gasPrice: MAGIC_GAS_PRICE,
        value: tokenBValue.toFixed(0),
      })

    const send = async () =>
      await this.cfg.contracts.router.methods
        .addLiquidityETH(
          params.addressA,
          params.tokenAValue,
          params.amountAMin,
          params.amountBMin,
          params.address,
          params.deadLine,
        )
        .send({
          from: this.cfg.addrs.self,
          gasPrice: MAGIC_GAS_PRICE,
          value: tokenBValue.toFixed(0),
          gas: lqETHGas,
        })

    return { gas: lqETHGas, send }
  }
}
