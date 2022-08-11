import Config from './Config'
import type { Address, Deadline } from '../types'
import { MAGIC_GAS_PRICE, NATIVE_TOKEN } from './const'
import { buildPair, buildPairAsync, TokensPair } from '@/utils/pair'
import { computeTransactionFee, deadlineFiveMinutesFromNow, isNativeToken } from './utils'
import { DexPair } from '@/core/kaikas/typechain/swap'
import { PAIR } from './smartcontracts/abi'
import Tokens from './Tokens'
import Wei from './Wei'

export interface PrepareAddLiquidityProps {
  tokens: TokensPair<TokenAddressAndDesiredValue>
  deadline: Deadline
}

export interface TokenAddressAndDesiredValue {
  addr: Address
  desired: Wei
}

export interface ComputeRemoveLiquidityAmountsProps {
  tokens: TokensPair<Address>
  pair: Address
  lpTokenValue: Wei
}

export interface ComputeRemoveLiquidityAmountsResult {
  amounts: TokensPair<Wei>
}

export interface PrepareRemoveLiquidityProps extends ComputeRemoveLiquidityAmountsProps {
  /**
   * Should be the same amounts that were computed by {@link Liquidity['computeRmLiquidityAmounts']}
   */
  minAmounts: TokensPair<Wei>
}

export interface PrepareTransactionResult {
  fee: Wei
  send: () => Promise<void>
}

function minByDesired(desired: Wei): Wei {
  const nDesired = desired.asBN

  return new Wei(nDesired.sub(nDesired.divn(100)))
}

function detectEth<T extends { addr: Address }>(
  pair: TokensPair<T>,
): null | {
  token: T
  eth: T
} {
  if (isNativeToken(pair.tokenA.addr)) return { token: pair.tokenB, eth: pair.tokenA }
  if (isNativeToken(pair.tokenB.addr)) return { token: pair.tokenA, eth: pair.tokenB }
  return null
}

export default class Liquidity {
  private readonly cfg: Config
  private readonly tokens: Tokens

  public constructor(deps: { cfg: Config; tokens: Tokens }) {
    this.cfg = deps.cfg
    this.tokens = deps.tokens
  }

  private get router() {
    return this.cfg.contracts.router
  }

  private get addr() {
    return this.cfg.addrs.self
  }

  /**
   * - Approves that user has enough of each token
   * - Detects whether to add liquidity for ETH or not
   * - Computes minimal amount as 99% of desired value
   */
  public async prepareAddLiquidity(props: PrepareAddLiquidityProps): Promise<PrepareTransactionResult> {
    for (const type of ['tokenA', 'tokenB'] as const) {
      const { addr, desired } = props.tokens[type]
      await this.cfg.approveAmount(addr, desired)
    }
    const gasPrice = MAGIC_GAS_PRICE

    const detectedEth = detectEth(props.tokens)
    if (detectedEth) {
      const {
        token,
        eth: { desired: desiredEth },
      } = detectedEth

      const method = this.router.methods.addLiquidityETH(
        token.addr,
        token.desired.asStr,
        minByDesired(token.desired).asStr,
        minByDesired(desiredEth).asStr,
        this.addr,
        props.deadline,
      )

      const gas = await method.estimateGas({
        from: this.cfg.addrs.self,
        gasPrice: gasPrice.asStr,
        value: desiredEth.asBN,
      })
      const send = async () => {
        await method.send({
          from: this.addr,
          gas,
          gasPrice: gasPrice.asStr,
          value: desiredEth.asBN,
        })
      }

      return { fee: computeTransactionFee(gasPrice, gas), send }
    } else {
      const { tokenA, tokenB } = props.tokens

      const method = this.router.methods.addLiquidity(
        tokenA.addr,
        tokenB.addr,
        tokenA.desired.asStr,
        tokenB.desired.asStr,
        minByDesired(tokenA.desired).asStr,
        minByDesired(tokenB.desired).asStr,
        this.addr,
        props.deadline,
      )

      const gas = await method.estimateGas()
      const send = async () => {
        await method.send({
          from: this.addr,
          gas,
          gasPrice: gasPrice.asStr,
        })
      }

      return { fee: computeTransactionFee(gasPrice, gas), send }
    }
  }

  /**
   * - Approves that pair has enought amount for `lpTokenValue`
   */
  public async prepareRmLiquidity(props: PrepareRemoveLiquidityProps): Promise<PrepareTransactionResult> {
    await this.cfg.approveAmount(props.pair, props.lpTokenValue)

    const { minAmounts } = props

    const detectedEth = detectEth(
      buildPair((type) => ({
        addr: props.tokens[type],
        minAmount: minAmounts[type],
      })),
    )
    const method = detectedEth
      ? this.router.methods.removeLiquidityETH(
          detectedEth.token.addr,
          props.lpTokenValue.asStr,
          detectedEth.token.minAmount.asStr,
          detectedEth.eth.minAmount.asStr,
          this.addr,
          deadlineFiveMinutesFromNow(),
        )
      : this.router.methods.removeLiquidity(
          props.tokens.tokenA,
          props.tokens.tokenB,
          props.lpTokenValue.asStr,
          minAmounts.tokenA.asStr,
          minAmounts.tokenB.asStr,
          this.addr,
          deadlineFiveMinutesFromNow(),
        )

    const gasPrice = MAGIC_GAS_PRICE
    const gas = await method.estimateGas({ from: this.addr, gasPrice: gasPrice.asStr })
    const send = async () => {
      await method.send({ from: this.addr, gas, gasPrice: gasPrice.asStr })
    }

    return { fee: computeTransactionFee(gasPrice, gas), send }
  }

  public async computeRmLiquidityAmounts(
    props: ComputeRemoveLiquidityAmountsProps,
  ): Promise<ComputeRemoveLiquidityAmountsResult> {
    const pairContract = this.cfg.createContract<DexPair>(props.pair, PAIR)

    const totalSupply = new Wei(await pairContract.methods.totalSupply().call())

    const amounts = await buildPairAsync((type) =>
      this.tokenRmAmount({
        lpToken: props.lpTokenValue,
        totalSupply,
        pair: props.pair,
        token: props.tokens[type],
      }),
    )

    return { amounts }
  }

  /**
   * amount = (lpTokenValue * tokenBalanceOfPair / totalSupply) - 1
   */
  private async tokenRmAmount(props: { token: Address; pair: Address; lpToken: Wei; totalSupply: Wei }): Promise<Wei> {
    const balance = await this.tokens.getTokenBalanceOfAddr(props.token, props.pair)
    const amount = props.lpToken.asBN.mul(balance.asBN).div(props.totalSupply.asBN).subn(1)
    return new Wei(amount)
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('min by desired', () => {
    test('for 1_000_000', () => {
      expect(minByDesired(new Wei('1000000')).asStr).toEqual('990000')
    })

    test('for 7', () => {
      expect(minByDesired(new Wei(7)).asStr).toEqual('7')
    })
  })

  describe('detecting eth', () => {
    const tokens = {
      native: NATIVE_TOKEN,
      test1: '0xb9920BD871e39C6EF46169c32e7AC4C698688881' as Address,
      test2: '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a' as Address,
    }

    test('no native tokens', () => {
      expect(
        detectEth({
          tokenA: { addr: tokens.test1, desired: new Wei('123') },
          tokenB: { addr: tokens.test2, desired: new Wei('321') },
        }),
      ).toBe(null)
    })

    test('native is the first', () => {
      expect(
        detectEth({
          tokenA: { addr: NATIVE_TOKEN, amount: new Wei('123') },
          tokenB: { addr: tokens.test2, amount: new Wei('321') },
        }),
      ).toMatchInlineSnapshot(`
        {
          "eth": {
            "addr": "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
            "amount": "123",
          },
          "token": {
            "addr": "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
            "amount": "321",
          },
        }
      `)
    })

    test('native is the second', () => {
      expect(
        detectEth({
          tokenA: { addr: tokens.test2, computedAmount: new Wei('123') },
          tokenB: { addr: NATIVE_TOKEN, amount: new Wei('321') },
        }),
      ).toMatchInlineSnapshot(`
        {
          "eth": {
            "addr": "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
            "amount": "321",
          },
          "token": {
            "addr": "0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a",
            "computedAmount": "123",
          },
        }
      `)
    })
  })
}
