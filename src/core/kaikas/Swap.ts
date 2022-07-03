import { type Address } from './types'
import Config from './Config'
import { MAGIC_GAS_PRICE } from './const'

export interface SwapProps {
  addressA: Address
  addressB: Address
  valueA: string
  valueB: string
}

export default class Swap {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
  }

  private get addr() {
    return this.cfg.addrs.self
  }

  /**
   * FIXME amount is what? `value` is what?
   * FIXME returns `string[]` - is it a fixed two-elem tuple?
   */
  public async getAmountOut(addressA: Address, addressB: Address, value: string): Promise<string[]> {
    return await this.cfg.contracts.router.methods.getAmountsOut(value, [addressA, addressB]).call()
  }

  public async getAmountIn(addressA: Address, addressB: Address, value: string): Promise<string[]> {
    return await this.cfg.contracts.router.methods.getAmountsIn(value, [addressA, addressB]).call()
  }

  public async swapExactTokensForTokens({ addressA, addressB, valueA, valueB }: SwapProps) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await this.cfg.contracts.router.methods
      .swapExactTokensForTokens(valueA, valueB, [addressA, addressB], this.addr, deadLine)
      .estimateGas()

    const send = async () =>
      await this.cfg.contracts.router.methods
        .swapExactTokensForTokens(valueA, valueB, [addressA, addressB], this.addr, deadLine)
        .send({
          from: this.addr,
          gas: swapGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

    return {
      swapGas,
      send,
    }
  }

  public async swapTokensForExactTokens({ addressA, addressB, valueA, valueB }: SwapProps) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await this.cfg.contracts.router.methods
      .swapTokensForExactTokens(valueB, valueA, [addressA, addressB], this.addr, deadLine)
      .estimateGas()

    const send = async () =>
      await this.cfg.contracts.router.methods
        .swapTokensForExactTokens(valueB, valueA, [addressA, addressB], this.addr, deadLine)
        .send({
          from: this.addr,
          gas: swapGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

    return { swapGas, send }
  }

  public async swapExactTokensForETH({ addressA, addressB, valueA, valueB }: SwapProps) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)

    const swapGas = await this.cfg.contracts.router.methods
      .swapExactTokensForETH(valueB, valueA, [addressB, addressA], this.addr, deadLine)
      .estimateGas({
        from: this.addr,
        gasPrice: MAGIC_GAS_PRICE,
      })

    const send = async () =>
      await this.cfg.contracts.router.methods
        .swapExactTokensForETH(valueB, valueA, [addressB, addressA], this.addr, deadLine)
        .send({
          from: this.addr,
          gas: swapGas,
          gasPrice: MAGIC_GAS_PRICE,
        })
    return { gas: swapGas, send }
  }

  public async swapExactETHForTokens({ addressA, addressB, valueA, valueB }: SwapProps) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)

    const swapGas = await this.cfg.contracts.router.methods
      .swapExactETHForTokens(valueA, [addressB, addressA], this.addr, deadLine)
      .estimateGas({
        value: valueB,
        from: this.addr,
        gasPrice: MAGIC_GAS_PRICE,
      })

    const send = async () =>
      await this.cfg.contracts.router.methods
        .swapExactETHForTokens(valueA, [addressB, addressA], this.addr, deadLine)
        .send({
          value: valueB,
          from: this.addr,
          gas: swapGas,
          gasPrice: MAGIC_GAS_PRICE,
        })
    return { gas: swapGas, send }
  }

  public async swapEthForExactTokens({
    amountOut,
    from,
    to,
    amountIn,
  }: {
    amountOut: string
    from: string
    to: string
    amountIn: string
  }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await this.cfg.contracts.router.methods
      .swapETHForExactTokens(amountOut, [to, from], this.addr, deadLine)
      .estimateGas({
        value: amountIn,
        from: this.addr,
        gasPrice: MAGIC_GAS_PRICE,
      })

    const send = async () =>
      await this.cfg.contracts.router.methods.swapETHForExactTokens(amountOut, [to, from], this.addr, deadLine).send({
        value: amountIn,
        gas: swapGas,
        from: this.addr,
        gasPrice: MAGIC_GAS_PRICE,
      })

    return { send, swapGas }
  }

  public async swapTokensForExactETH({
    amountOut,
    amountInMax,
    from,
    to,
  }: {
    amountOut: string
    amountInMax: string
    from: string
    to: string
  }) {
    const deadLine = Math.floor(Date.now() / 1000 + 300)
    const swapGas = await this.cfg.contracts.router.methods
      .swapTokensForExactETH(amountOut, amountInMax, [from, to], this.addr, deadLine)
      .estimateGas({
        from: this.addr,
        gasPrice: MAGIC_GAS_PRICE,
      })
    const send = async () =>
      await this.cfg.contracts.router.methods
        .swapTokensForExactETH(amountOut, amountInMax, [from, to], this.addr, deadLine)
        .send({
          from: this.addr,
          gas: swapGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

    return { send, swapGas }
  }
}
