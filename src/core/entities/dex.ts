import { AbiLoader } from '../abi'
import { Address } from '../types'
import { Agent, AgentAnon, CommonAddrs, AgentProvider } from './agent'
import CommonContracts from './CommonContracts'
import { Liquidity, LiquidityAnon } from './liquidity'
import { Swap, SwapAnon } from './swap'
import { Tokens, TokensAnon } from './tokens'

export class DexAnon<
  A extends AgentAnon = AgentAnon,
  T extends TokensAnon = TokensAnon,
  S extends SwapAnon = SwapAnon,
  L extends LiquidityAnon = LiquidityAnon,
> {
  public static async initAnonymous(props: {
    provider: AgentProvider
    abi: AbiLoader
    addrs: CommonAddrs
  }): Promise<DexAnon> {
    const agent = new AgentAnon(props)
    const contracts = await CommonContracts.load(agent)

    const tokens = new TokensAnon({ agent, contracts })
    const swap = new SwapAnon({ contracts })
    const liquidity = new LiquidityAnon({ agent, tokens })

    return new DexAnon({ agent, tokens, swap, liquidity })
  }

  public readonly agent!: A
  public readonly tokens!: T
  public readonly swap!: S
  public readonly liquidity!: L

  protected constructor(props: Pick<DexAnon, 'agent' | 'tokens' | 'swap' | 'liquidity'>) {
    Object.assign(this, props)
  }
}

export class Dex extends DexAnon<Agent, Tokens, Swap, Liquidity> {
  public static async init(
    props: { provider: AgentProvider; abi: AbiLoader; addrs: CommonAddrs },
    address: Address,
  ): Promise<Dex> {
    const agent = new Agent({ base: props, address })
    const contracts = await CommonContracts.load(agent)

    const tokens = new Tokens({ agent, contracts })
    const swap = new Swap({ agent, contracts })
    const liquidity = new Liquidity({ agent, tokens, contracts })

    return new Dex({ agent, tokens, swap, liquidity })
  }

  public constructor(props: Pick<Dex, 'agent' | 'tokens' | 'swap' | 'liquidity'>) {
    super(props)
  }
}
