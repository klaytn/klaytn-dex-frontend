import { AbiLoader } from '../abi'
import { Address } from '../types'
import { Agent, AgentProvider, AgentPure, CommonAddrs } from './agent'
import CommonContracts from './CommonContracts'
import { Earn } from './earn'
import { Liquidity, LiquidityPure } from './liquidity'
import MulticallPure from './MulticallPure'
import { Swap, SwapPure } from './swap'
import { Tokens, TokensPure } from './tokens'

export class DexPure<
  A extends AgentPure = AgentPure,
  T extends TokensPure = TokensPure,
  S extends SwapPure = SwapPure,
  L extends LiquidityPure = LiquidityPure,
> {
  public static initAnonymous(props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs }): DexPure {
    const agent = new AgentPure(props)
    const multicall = new MulticallPure({ agent })
    const contracts = new CommonContracts(agent)
    const tokens = new TokensPure({ agent, contracts, multicall })
    const swap = new SwapPure({ contracts })
    const liquidity = new LiquidityPure({ agent, tokens })

    return new DexPure({ agent, tokens, swap, liquidity })
  }

  public readonly agent!: A
  public readonly tokens!: T
  public readonly swap!: S
  public readonly liquidity!: L

  protected constructor(props: Pick<DexPure, 'agent' | 'tokens' | 'swap' | 'liquidity'>) {
    Object.assign(this, props)
  }
}

export class Dex extends DexPure<Agent, Tokens, Swap, Liquidity> {
  public static init(props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs }, address: Address): Dex {
    const agent = new Agent({ base: props, address })
    const multicall = new MulticallPure({ agent })
    const contracts = new CommonContracts(agent)
    const tokens = new Tokens({ agent, contracts, multicall })
    const swap = new Swap({ agent, contracts })
    const liquidity = new Liquidity({ agent, tokens, contracts })
    const earn = new Earn({ agent, multicall })

    return new Dex({ agent, tokens, swap, liquidity, earn })
  }

  public readonly earn: Earn

  protected constructor(props: Pick<Dex, 'agent' | 'tokens' | 'swap' | 'liquidity' | 'earn'>) {
    super(props)
    this.earn = props.earn
  }
}
