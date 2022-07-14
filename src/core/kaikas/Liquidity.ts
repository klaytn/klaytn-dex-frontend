import Config from './Config'
import { type ValueWei, type Address, type Deadline, WeiNumStrBn } from './types'
import BN from 'bn.js'
import { MAGIC_GAS_PRICE } from './const'
import { buildPairAsync, TokensPair } from '@/utils/pair'
import { asWei, deadlineFiveMinutesFromNow, isNativeToken, tokenRawToWei } from './utils'
import { DexPair } from '@/types/typechain/swap'
import { PAIR } from './smartcontracts/abi'
import Tokens from './Tokens'

export interface AddLiquidityResult {
  lpTokenGas: ValueWei<number>
}

export interface AddLiquidityProps {
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

  // FIXME desired to be used within `rmLiquidity`, but actually unused
  pairContract: DexPair
  totalSupply: ValueWei<BN>
}

export interface RemoveLiquidityProps {
  tokens: TokensPair<Address>
  pair: Address
  lpTokenValue: WeiNumStrBn
}

function minByDesired(desired: WeiNumStrBn): ValueWei<string> {
  const nDesired = new BN(desired)

  return asWei(nDesired.sub(nDesired.divn(100)).toString())
}

function detectEth(
  tokens: TokensPair<TokenAddressAndDesiredValue>,
): null | { token: TokenAddressAndDesiredValue; desiredEth: WeiNumStrBn } {
  if (isNativeToken(tokens.tokenA.addr)) return { token: tokens.tokenB, desiredEth: tokens.tokenA.desired }
  if (isNativeToken(tokens.tokenB.addr)) return { token: tokens.tokenA, desiredEth: tokens.tokenB.desired }
  return null
}

/**
 * FIXME
 */
function rmLiquidityLpToken(props: RemoveLiquidityProps): ValueWei<BN> {
  if (isNativeToken(props.tokens.tokenA) || isNativeToken(props.tokens.tokenB)) {
    return asWei(new BN(tokenRawToWei({ decimals: 18 }, '10')))
  }
  return asWei(new BN(props.lpTokenValue))
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
  public async addLiquidity(props: AddLiquidityProps): Promise<AddLiquidityResult> {
    for (const type of ['tokenA', 'tokenB'] as const) {
      const { addr, desired } = props.tokens[type]
      await this.cfg.approveAmount(addr, desired)
    }

    const detectedEth = detectEth(props.tokens)
    if (detectedEth) {
      const { token, desiredEth } = detectedEth

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
      await method.send({
        from: this.addr,
        gas: lpTokenGas,
        gasPrice: MAGIC_GAS_PRICE,
        value: desiredEth,
      })

      return { lpTokenGas }
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
      await method.send({
        from: this.addr,
        gas: lpTokenGas,
        gasPrice: MAGIC_GAS_PRICE,
      })

      return { lpTokenGas }
    }
  }

  /**
   * FIXME there should be a different between ETH/nonETH, right?
   */
  public async rmLiquidity(props: RemoveLiquidityProps): Promise<void> {
    const nLpToken = rmLiquidityLpToken(props)
    const { amounts } = await this.computeRmLiquidityAmounts(props)

    await this.cfg.approveAmount(props.pair, nLpToken)

    const method = this.router.methods.removeLiquidity(
      props.tokens.tokenA,
      props.tokens.tokenB,
      nLpToken,
      amounts.tokenA,
      amounts.tokenB,
      this.addr,
      deadlineFiveMinutesFromNow(),
    )

    const gas = await method.estimateGas({ from: this.addr, gasPrice: MAGIC_GAS_PRICE })
    await method.send({ from: this.addr, gas, gasPrice: MAGIC_GAS_PRICE })
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

    return { amounts, pairContract, totalSupply: nTotalSupply }
  }

  /**
   * amount = lpTokenValue * tokenBalanceOfPair / totalSupply
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
}
