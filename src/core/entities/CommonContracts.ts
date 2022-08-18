import { AgentAnon } from './agent'
import { type IsomorphicContract } from './isomorphic-contract'

type CommonContractKey = 'router' | 'factory'

export default class CommonContracts {
  #cache = new Map<CommonContractKey, IsomorphicContract<CommonContractKey>>()
  #agent: AgentAnon

  public constructor(agent: AgentAnon) {
    this.#agent = agent
  }

  public get<T extends CommonContractKey>(what: T): undefined | IsomorphicContract<T> {
    return this.#cache.get(what) as undefined | IsomorphicContract<T>
  }

  public async init<T extends CommonContractKey>(what: T): Promise<IsomorphicContract<T>> {
    const contract = await this.#agent.createContract(
      what === 'router' ? this.#agent.routerAddress : this.#agent.factoryAddress,
      what,
    )
    this.#cache.set(what, contract)
    return contract
  }
}
