import { AbiLoader } from '../abi'
import { Address } from '../types'
import { Agent, AgentPure, CommonAddrs, AgentProvider } from './agent'
import CommonContracts from './CommonContracts'
import { EarnPure, Earn } from './earn'
import { Liquidity, LiquidityPure } from './liquidity'
import { Swap, SwapPure } from './swap'
import { Tokens, TokensPure } from './tokens'

export class DexPure<
  A extends AgentPure = AgentPure,
  T extends TokensPure = TokensPure,
  S extends SwapPure = SwapPure,
  L extends LiquidityPure = LiquidityPure,
  E extends EarnPure = EarnPure,
> {
  public static initAnonymous(props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs }): DexPure {
    const agent = new AgentPure(props)
    const contracts = new CommonContracts(agent)

    const tokens = new TokensPure({ agent, contracts })
    const swap = new SwapPure({ contracts })
    const liquidity = new LiquidityPure({ agent, tokens })
    const earn = new EarnPure({ agent })

    return new DexPure({ agent, tokens, swap, liquidity, earn })
  }

  public readonly agent!: A
  public readonly tokens!: T
  public readonly swap!: S
  public readonly liquidity!: L
  public readonly earn!: E

  protected constructor(props: Pick<DexPure, 'agent' | 'tokens' | 'swap' | 'liquidity' | 'earn'>) {
    Object.assign(this, props)
  }
}

export class Dex extends DexPure<Agent, Tokens, Swap, Liquidity, Earn> {
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
