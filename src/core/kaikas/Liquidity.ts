import Config from './Config'
import { type ValueWei, type Address, type Deadline, WeiNumStrBn } from './types'
import BN from 'bn.js'
import { MAGIC_GAS_PRICE } from './const'
import { TokensPair } from '@/utils/pair'
import { asWei, isNativeToken } from './utils'

export interface AddLiquidityResult {
  lpTokenGas: ValueWei<number>
  send: () => Promise<unknown>
}

export interface AddLiquidityProps {
  tokens: TokensPair<TokenAddressAndDesiredValue>
  deadline: Deadline
}

export interface TokenAddressAndDesiredValue {
  addr: Address
  desired: WeiNumStrBn
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

export default class Liquidity {
  private readonly cfg: Config

  public constructor(cfg: Config) {
    this.cfg = cfg
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
      const send = () =>
        method.send({
          from: this.addr,
          gas: lpTokenGas,
          gasPrice: MAGIC_GAS_PRICE,
          value: desiredEth,
        })

      return { lpTokenGas, send }
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
      const send = () =>
        method.send({
          from: this.addr,
          gas: lpTokenGas,
          gasPrice: MAGIC_GAS_PRICE,
        })

      return { lpTokenGas, send }
    }
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
