import type { Address, Deadline } from '../types'
import { NATIVE_TOKEN, isNativeToken } from '../const'
import { buildPair, buildPairAsync, TokensPair } from '@/utils/pair'
import { computeTransactionFee, deadlineFiveMinutesFromNow } from '../utils'
import { Wei } from '../entities'
import { Agent, AgentPure } from './agent'
import { TokensPure } from './tokens'
import CommonContracts from './CommonContracts'

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

    const totalSupply = new Wei(await pairContract.totalSupply([]).call())

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
  protected async tokenRmAmount(props: {
    token: Address
    pair: Address
    lpToken: Wei
    totalSupply: Wei
  }): Promise<Wei> {
    const balance = await this.#tokens.getTokenBalanceOfAddr(props.token, props.pair)
    const amount = props.lpToken.asBigNum
      .multipliedBy(balance.asBigNum)
      .dividedBy(props.totalSupply.asBigNum)
      .minus(1)
      .decimalPlaces(0)
    return new Wei(amount)
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

    const detectedEth = detectEth(props.tokens)
    if (detectedEth) {
      const {
        token,
        eth: { desired: desiredEth },
      } = detectedEth

      const tx = router.addLiquidityKLAY(
        [
          token.addr,
          token.desired.asStr,
          minByDesired(token.desired).asStr,
          minByDesired(desiredEth).asStr,
          address,
          props.deadline,
        ],
        { gasPrice, value: desiredEth },
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
          minByDesired(tokenA.desired).asStr,
          minByDesired(tokenB.desired).asStr,
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
    await this.#agent.approveAmount(props.pair, props.lpTokenValue)

    const { minAmounts } = props
    const { address } = this

    const router = this.#contracts.get('router') || (await this.#contracts.init('router'))

    const gasPrice = await this.#agent.getGasPrice()

    const detectedEth = detectEth(
      buildPair((type) => ({
        addr: props.tokens[type],
        minAmount: minAmounts[type],
      })),
    )
    const tx = detectedEth
      ? router.removeLiquidityKLAY(
          [
            detectedEth.token.addr,
            props.lpTokenValue.asStr,
            detectedEth.token.minAmount.asStr,
            detectedEth.eth.minAmount.asStr,
            address,
            deadlineFiveMinutesFromNow(),
          ],
          { gasPrice },
        )
      : router.removeLiquidity(
          [
            props.tokens.tokenA,
            props.tokens.tokenB,
            props.lpTokenValue.asStr,
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
        detectEth({
          tokenA: { addr: tokens.test2, computedAmount: new Wei('123') },
          tokenB: { addr: NATIVE_TOKEN, amount: new Wei('321') },
        }),
      ).toMatchInlineSnapshot(`
        {
          "eth": {
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
