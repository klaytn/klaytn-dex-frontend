import Config from './Config'
import { type ValueWei, type Address, type Deadline, WeiNumStrBn } from './types'
import BN from 'bn.js'
import { MAGIC_GAS_PRICE, NATIVE_TOKEN } from './const'
import { buildPair, buildPairAsync, TokensPair } from '@/utils/pair'
import { asWei, deadlineFiveMinutesFromNow, isNativeToken } from './utils'
import { DexPair } from '@/types/typechain/swap'
import { PAIR } from './smartcontracts/abi'
import Tokens from './Tokens'

export interface PrepareAddLiquidityProps {
  tokens: TokensPair<TokenAddressAndDesiredValue>
  deadline: Deadline
}

export interface TokenAddressAndDesiredValue {
  addr: Address
  desired: WeiNumStrBn
}

export interface ComputeRemoveLiquidityAmountsProps {
  tokens: TokensPair<Address>
  pair: Address
  lpTokenValue: WeiNumStrBn
}

export interface ComputeRemoveLiquidityAmountsResult {
  amounts: TokensPair<ValueWei<BN>>
}

export interface PrepareRemoveLiquidityProps extends ComputeRemoveLiquidityAmountsProps {
  /**
   * Should be the same amounts that were computed by {@link Liquidity['computeRmLiquidityAmounts']}
   */
  amounts: TokensPair<ValueWei<BN>>
}

export interface PrepareTransactionResult {
  /**
   * i.e. transaction fee
   */
  gas: ValueWei<number>
  send: () => Promise<void>
}

function minByDesired(desired: WeiNumStrBn): ValueWei<string> {
  const nDesired = new BN(desired)

  return asWei(nDesired.sub(nDesired.divn(100)).toString())
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

    const detectedEth = detectEth(props.tokens)
    if (detectedEth) {
      const {
        token,
        eth: { desired: desiredEth },
      } = detectedEth

      const method = this.router.methods.addLiquidityETH(
        token.addr,
        token.desired,
        minByDesired(token.desired),
        minByDesired(desiredEth),
        this.addr,
        props.deadline,
      )

      const lpTokenGas = asWei(
        await method.estimateGas({
          from: this.cfg.addrs.self,
          gasPrice: MAGIC_GAS_PRICE,
          value: desiredEth,
        }),
      )
      const send = async () => {
        await method.send({
          from: this.addr,
          gas: lpTokenGas,
          gasPrice: MAGIC_GAS_PRICE,
          value: desiredEth,
        })
      }

      return { gas: lpTokenGas, send }
    } else {
      const { tokenA, tokenB } = props.tokens

      const method = this.router.methods.addLiquidity(
        tokenA.addr,
        tokenB.addr,
        tokenA.desired,
        tokenB.desired,
        minByDesired(tokenA.desired),
        minByDesired(tokenB.desired),
        this.addr,
        props.deadline,
      )

      const lpTokenGas = asWei(await method.estimateGas())
      const send = async () => {
        await method.send({
          from: this.addr,
          gas: lpTokenGas,
          gasPrice: MAGIC_GAS_PRICE,
        })
      }

      return { gas: lpTokenGas, send }
    }
  }

  /**
   * - Approves that pair has enought amount for `lpTokenValue`
   */
  public async prepareRmLiquidity(props: PrepareRemoveLiquidityProps): Promise<PrepareTransactionResult> {
    const nLpToken = asWei(new BN(props.lpTokenValue))
    await this.cfg.approveAmount(props.pair, nLpToken)

    const { amounts } = props

    const detectedEth = detectEth(
      buildPair((type) => ({
        addr: props.tokens[type],
        computedAmount: amounts[type],
      })),
    )
    const method = detectedEth
      ? this.router.methods.removeLiquidityETH(
          detectedEth.token.addr,
          nLpToken,
          detectedEth.token.computedAmount,
          detectedEth.eth.computedAmount,
          this.addr,
          deadlineFiveMinutesFromNow(),
        )
      : this.router.methods.removeLiquidity(
          props.tokens.tokenA,
          props.tokens.tokenB,
          nLpToken,
          amounts.tokenA,
          amounts.tokenB,
          this.addr,
          deadlineFiveMinutesFromNow(),
        )

    const gas = asWei(await method.estimateGas({ from: this.addr, gasPrice: MAGIC_GAS_PRICE }))
    const send = async () => {
      await method.send({ from: this.addr, gas, gasPrice: MAGIC_GAS_PRICE })
    }

    return { gas, send }
  }

  public async computeRmLiquidityAmounts(
    props: ComputeRemoveLiquidityAmountsProps,
  ): Promise<ComputeRemoveLiquidityAmountsResult> {
    const pairContract = this.cfg.createContract<DexPair>(props.pair, PAIR)

    const nTotalSupply = asWei(new BN(await pairContract.methods.totalSupply().call()))
    const nLpToken = asWei(new BN(props.lpTokenValue))

    const amounts = await buildPairAsync((type) =>
      this.tokenRmAmount({
        lpToken: nLpToken,
        totalSupply: nTotalSupply,
        pair: props.pair,
        token: props.tokens[type],
      }),
    )

    return { amounts }
  }

  /**
   * amount = (lpTokenValue * tokenBalanceOfPair / totalSupply) - 1
   */
  private async tokenRmAmount(props: {
    token: Address
    pair: Address
    lpToken: ValueWei<BN>
    totalSupply: ValueWei<BN>
  }): Promise<ValueWei<BN>> {
    const balance = await this.tokens.getTokenBalanceOfAddr(props.token, props.pair)
    const nBalance = new BN(balance)
    const amount = props.lpToken.mul(nBalance).div(props.totalSupply).subn(1)
    return asWei(amount)
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('min by desired', () => {
    test('for 1_000_000', () => {
      expect(minByDesired('1000000' as WeiNumStrBn)).toEqual('990000')
    })

    test('for 7', () => {
      expect(minByDesired(7 as WeiNumStrBn)).toEqual('7')
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
          tokenA: { addr: tokens.test1, desired: asWei('123') },
          tokenB: { addr: tokens.test2, desired: asWei('321') },
        }),
      ).toBe(null)
    })

    test('native is the first', () => {
      expect(
        detectEth({
          tokenA: { addr: NATIVE_TOKEN, amount: asWei('123') },
          tokenB: { addr: tokens.test2, amount: asWei('321') },
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
          tokenA: { addr: tokens.test2, computedAmount: asWei('123') },
          tokenB: { addr: NATIVE_TOKEN, amount: asWei('321') },
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
