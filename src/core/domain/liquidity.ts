import type { Address, Deadline } from '../types'
import { NATIVE_TOKEN, isNativeToken } from '../const'
import { TokenType, TokensPair, buildPair, buildPairAsync } from '@/utils/pair'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import { Percent, Wei } from '../entities'
import { Agent, AgentPure } from './agent'
import { TokensPure } from './tokens'
import CommonContracts from './CommonContracts'
import { IsomorphicContract } from '../isomorphic-contract'
import BigNumber from 'bignumber.js'
import { match } from 'ts-pattern'
import invariant from 'tiny-invariant'

const MINIMUM_LIQUIDITY = new Wei(1000)

export interface PrepareAddLiquidityProps {
  tokens: TokensPair<AddLiquidityTokenDefinition>
  deadline: Deadline
}

export interface AddLiquidityTokenDefinition {
  addr: Address
  /**
   * Desired value the user wants to supply
   */
  desired: Wei
  /**
   * Slipped desired value; minimal value the user ready to supply
   */
  min: Wei
}

export interface ComputeRemoveLiquidityAmountsProps {
  tokens: TokensPair<Address>
  pair: Address
  liquidity: Wei
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

function detectNative<T extends { addr: Address }>(
  pair: TokensPair<T>,
): null | {
  token: T
  /**
   * i.e. Klay token
   */
  native: T
} {
  if (isNativeToken(pair.tokenA.addr)) return { token: pair.tokenB, native: pair.tokenA }
  if (isNativeToken(pair.tokenB.addr)) return { token: pair.tokenA, native: pair.tokenB }
  return null
}

interface AnonCtorProps {
  agent: AgentPure
  tokens: TokensPure
}

export class LiquidityPure {
  #agent: AgentPure
  #tokens: TokensPure

  public constructor(props: AnonCtorProps) {
    this.#agent = props.agent
    this.#tokens = props.tokens
  }

  public async computeRmLiquidityAmounts(
    props: ComputeRemoveLiquidityAmountsProps,
  ): Promise<ComputeRemoveLiquidityAmountsResult> {
    const pairContract = await this.#agent.createContract(props.pair, 'pair')

    const totalSupply = await this.pairTotalSupply(pairContract)

    const amounts = await buildPairAsync((type) =>
      this.tokenRmAmount({
        liquidity: props.liquidity,
        totalSupply,
        pair: props.pair,
        token: props.tokens[type],
      }),
    )

    return { amounts }
  }

  public async computeAddLiquidityAmountsForExistingPair(props: {
    pair: Address
    tokens: TokensPair<Address>
    input: Wei
    quoteFor: TokenType
  }): Promise<{
    quoted: Wei
    liquidity: Wei
  }> {
    const quoted = await this.#tokens.getTokenQuote({ ...props.tokens, value: props.input, quoteFor: props.quoteFor })

    const pairContract = await this.#agent.createContract(props.pair, 'pair')
    const pairTotalSupply = await this.pairTotalSupply(pairContract)

    const reserves = await this.#tokens.getPairReserves(props.tokens)
    const balances = await buildPairAsync((type) => this.#tokens.getTokenBalanceOfAddr(props.tokens[type], props.pair))
    const amounts = await buildPairAsync(async (type) => {
      const balance = balances[type]
      const reserve = reserves[type]
      const inputOrQuoted = props.quoteFor === type ? quoted : props.input
      return balance.asBigNum.plus(inputOrQuoted.asBigNum).minus(reserve.asBigNum)
    })

    const liquidity = this.computeLiquidityWithPreparedAmounts({
      type: 'pair-exists',
      amounts,
      pairTotalSupply,
      reserves,
    })

    return { quoted, liquidity }
  }

  public computeAddLiquidityAmountsForEmptyPair(props: { input: TokensPair<Wei> }): {
    liquidity: Wei
  } {
    const liquidity = this.computeLiquidityWithPreparedAmounts({
      type: 'pair-empty',
      amounts: buildPair((t) => props.input[t].asBigNum),
    })
    return { liquidity }
  }

  /**
   * amount = (lpTokenValue * tokenBalanceOfPair / totalSupply) - 1
   */
  protected async tokenRmAmount(props: {
    token: Address
    pair: Address
    liquidity: Wei
    totalSupply: Wei
  }): Promise<Wei> {
    const balance = await this.#tokens.getTokenBalanceOfAddr(props.token, props.pair)
    const amount = props.liquidity.asBigNum
      .multipliedBy(balance.asBigNum)
      .dividedBy(props.totalSupply.asBigNum)
      .minus(1)
      .decimalPlaces(0)
    return new Wei(amount)
  }

  /**
   * ```
   * balance0 = IKIP7(token0).balanceOf(address(this)); // текущий баланс
   * balance1 = IKIP7(token1).balanceOf(address(this)); // текущий баланс
   * amount0 = (balance0 + input/quoted amount) - _reserve1; // текущий + который ещё только собираемся добавить
   * amount1 = (balance1 + input/quoted amount) - _reserve1; // текущий + который ещё только собираемся добавить
   * if (_totalSupply == 0) {
   *      liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
   * } else {
   *       liquidity = Math.min((amount0 * _totalSupply) / _reserve0, (amount1 * _totalSupply) / _reserve1);
   * }
   * ```
   */
  protected computeLiquidityWithPreparedAmounts(
    props:
      | {
          type: 'pair-exists'
          amounts: TokensPair<BigNumber>
          reserves: TokensPair<Wei>
          pairTotalSupply: Wei
        }
      | {
          type: 'pair-empty'
          amounts: TokensPair<BigNumber>
        },
  ): Wei {
    return match(props)
      .with({ type: 'pair-empty' }, ({ amounts }): Wei => {
        const liquidity = amounts.tokenA.multipliedBy(amounts.tokenB).sqrt().minus(MINIMUM_LIQUIDITY.asBigNum)
        return new Wei(liquidity.decimalPlaces(0))
      })
      .with({ type: 'pair-exists' }, ({ amounts, reserves, pairTotalSupply }): Wei => {
        invariant(
          pairTotalSupply.asBigInt > 0,
          () => `Pair is supposed to be not empty, but got balance ${pairTotalSupply.asBigInt}`,
        )
        const amountsMapped = buildPair((t) =>
          amounts[t].multipliedBy(pairTotalSupply.asBigNum).dividedBy(reserves[t].asBigNum),
        )
        const liquidity = BigNumber.min(amountsMapped.tokenA, amountsMapped.tokenB)
        return new Wei(liquidity.decimalPlaces(0))
      })
      .exhaustive()
  }

  protected async pairTotalSupply(contract: IsomorphicContract<'pair'>): Promise<Wei> {
    return new Wei(await contract.totalSupply([]).call())
  }
}

export class Liquidity extends LiquidityPure {
  #agent: Agent
  #contracts: CommonContracts

  public constructor(props: { agent: Agent; tokens: TokensPure; contracts: CommonContracts }) {
    super(props)
    this.#agent = props.agent
    this.#contracts = props.contracts
  }

  private get address() {
    return this.#agent.address
  }

  /**
   * - Approves that user has enough of each token
   * - Detects whether to add liquidity for ETH or not
   * - Computes minimal amount as 99% of desired value
   */
  public async prepareAddLiquidity(props: PrepareAddLiquidityProps): Promise<PrepareTransactionResult> {
    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))

    for (const type of ['tokenA', 'tokenB'] as const) {
      const { addr, desired } = props.tokens[type]
      await this.#agent.approveAmount(addr, desired)
    }
    const { address } = this
    const gasPrice = await this.#agent.getGasPrice()

    const detectedKlay = detectNative(props.tokens)
    if (detectedKlay) {
      const { token, native } = detectedKlay

      const tx = router.addLiquidityKLAY(
        [token.addr, token.desired.asStr, token.min.asStr, native.min.asStr, address, props.deadline],
        { gasPrice, value: native.desired },
      )
      const { gas, send } = await tx.estimateAndPrepareSend()

      return { fee: computeTransactionFee(gasPrice, gas), send }
    } else {
      const { tokenA, tokenB } = props.tokens

      const tx = router.addLiquidity(
        [
          tokenA.addr,
          tokenB.addr,
          tokenA.desired.asStr,
          tokenB.desired.asStr,
          tokenA.min.asStr,
          tokenB.min.asStr,
          address,
          props.deadline,
        ],
        { gasPrice },
      )
      const { gas, send } = await tx.estimateAndPrepareSend()

      return { fee: computeTransactionFee(gasPrice, gas), send }
    }
  }

  /**
   * - Approves that pair has enough amount for `lpTokenValue`
   */
  public async prepareRmLiquidity(props: PrepareRemoveLiquidityProps): Promise<PrepareTransactionResult> {
    await this.#agent.approveAmount(props.pair, props.liquidity)

    const { minAmounts } = props
    const { address } = this

    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))

    const gasPrice = await this.#agent.getGasPrice()

    const detectedKlay = detectNative(
      buildPair((type) => ({
        addr: props.tokens[type],
        minAmount: minAmounts[type],
      })),
    )
    const tx = detectedKlay
      ? router.removeLiquidityKLAY(
          [
            detectedKlay.token.addr,
            props.liquidity.asStr,
            detectedKlay.token.minAmount.asStr,
            detectedKlay.native.minAmount.asStr,
            address,
            deadlineFiveMinutesFromNow(),
          ],
          { gasPrice },
        )
      : router.removeLiquidity(
          [
            props.tokens.tokenA,
            props.tokens.tokenB,
            props.liquidity.asStr,
            minAmounts.tokenA.asStr,
            minAmounts.tokenB.asStr,
            address,
            deadlineFiveMinutesFromNow(),
          ],
          { gasPrice },
        )
    const { gas, send } = await tx.estimateAndPrepareSend()

    return { fee: computeTransactionFee(gasPrice, gas), send }
  }
}

if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest

  describe('detecting native token', () => {
    const tokens = {
      native: NATIVE_TOKEN,
      test1: '0xb9920BD871e39C6EF46169c32e7AC4C698688881' as Address,
      test2: '0x1CDcD477994e86A11E21C27ca907bEA266EA3A0a' as Address,
    }

    test('no native tokens', () => {
      expect(
        detectNative({
          tokenA: { addr: tokens.test1, desired: new Wei('123') },
          tokenB: { addr: tokens.test2, desired: new Wei('321') },
        }),
      ).toBe(null)
    })

    test('native is the first', () => {
      expect(
        detectNative({
          tokenA: { addr: NATIVE_TOKEN, amount: new Wei('123') },
          tokenB: { addr: tokens.test2, amount: new Wei('321') },
        }),
      ).toMatchInlineSnapshot(`
        {
          "native": {
            "addr": "0x73365f8f27de98d7634be67a167f229b32e7bf6c",
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
        detectNative({
          tokenA: { addr: tokens.test2, computedAmount: new Wei('123') },
          tokenB: { addr: NATIVE_TOKEN, amount: new Wei('321') },
        }),
      ).toMatchInlineSnapshot(`
        {
          "native": {
            "addr": "0x73365f8f27de98d7634be67a167f229b32e7bf6c",
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
