import { AgentAnon } from './agent'
import { type IsomorphicContract } from './isomorphic-contract'

interface Contracts {
  router: IsomorphicContract<'router'>
  factory: IsomorphicContract<'factory'>
}

export default class CommonContracts implements Readonly<Contracts> {
  public static async load(agent: AgentAnon): Promise<CommonContracts> {
    const [router, factory] = await Promise.all([
      agent.createContract(agent.routerAddress, 'router'),
      agent.createContract(agent.factoryAddress, 'factory'),
    ])

    return new CommonContracts({ router, factory })
  }

  public readonly router!: IsomorphicContract<'router'>
  public readonly factory!: IsomorphicContract<'factory'>

  private constructor(x: Contracts) {
    Object.assign(this, x)
  }
}
