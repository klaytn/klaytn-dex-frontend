import { AbiLoader } from '../abi'
import { Address } from '../types'
import { Agent, AgentAnon, CommonAddrs, AgentProvider } from './agent'
import CommonContracts from './CommonContracts'
import { EarnAnon, Earn } from './earn'
import { Liquidity, LiquidityAnon } from './liquidity'
import { Swap, SwapAnon } from './swap'
import { Tokens, TokensAnon } from './tokens'

export class DexAnon<
  A extends AgentAnon = AgentAnon,
  T extends TokensAnon = TokensAnon,
  S extends SwapAnon = SwapAnon,
  L extends LiquidityAnon = LiquidityAnon,
  E extends EarnAnon = EarnAnon,
> {
  public static initAnonymous(props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs }): DexAnon {
    const agent = new AgentAnon(props)
    const contracts = new CommonContracts(agent)

    const tokens = new TokensAnon({ agent, contracts })
    const swap = new SwapAnon({ contracts })
    const liquidity = new LiquidityAnon({ agent, tokens })
    const earn = new EarnAnon({ agent })

    return new DexAnon({ agent, tokens, swap, liquidity, earn })
  }

  public readonly agent!: A
  public readonly tokens!: T
  public readonly swap!: S
  public readonly liquidity!: L
  public readonly earn!: E

  protected constructor(props: Pick<DexAnon, 'agent' | 'tokens' | 'swap' | 'liquidity' | 'earn'>) {
    Object.assign(this, props)
  }
}

export class Dex extends DexAnon<Agent, Tokens, Swap, Liquidity, Earn> {
  public static init(props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs }, address: Address): Dex {
    const agent = new Agent({ base: props, address })
    const contracts = new CommonContracts(agent)

    const tokens = new Tokens({ agent, contracts })
    const swap = new Swap({ agent, contracts })
    const liquidity = new Liquidity({ agent, tokens, contracts })
    const earn = new Earn({ agent })

    return new Dex({ agent, tokens, swap, liquidity, earn })
  }

  protected constructor(props: Pick<Dex, 'agent' | 'tokens' | 'swap' | 'liquidity' | 'earn'>) {
    super(props)
  }
}
