import { DexFactory, DexRouter } from '../typechain'
import { AgentAnon } from './agent'

interface Contracts {
  router: DexRouter
  factory: DexFactory
}

export default class CommonContracts implements Readonly<Contracts> {
  public static async load(agent: AgentAnon): Promise<CommonContracts> {
    const [router, factory] = await Promise.all([
      agent.createContract(agent.routerAddress, 'router'),
      agent.createContract(agent.factoryAddress, 'factory'),
    ])

    return new CommonContracts({ router, factory })
  }

  public readonly router!: DexRouter
  public readonly factory!: DexFactory

  private constructor(x: Contracts) {
    Object.assign(this, x)
  }
}
