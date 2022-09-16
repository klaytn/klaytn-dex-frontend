import { ADDRESS_MULTICALL } from '../const'
import { IsomorphicContract } from '../isomorphic-contract'
import { Address } from '../types'
import { AgentPure } from './agent'

export interface CallStruct {
  target: Address
  callData: string | number[]
}

export interface AggregateResult {
  blockNumber: number
  returnData: string[]
}

export default class MulticallPure {
  #agent: AgentPure
  #contract: IsomorphicContract<'multicall'> | null = null

  public constructor({ agent }: { agent: AgentPure }) {
    this.#agent = agent
  }

  public async aggregate(calls: CallStruct[]): Promise<AggregateResult> {
    const contract = this.#contract || (await this.initContract())

    const { blockNumber, returnData } = await contract
      .aggregate({
        argsEthers: () => [calls],
        argsWeb3: () => [calls.map((x) => [x.target, x.callData])],
      })
      .call()

    return { blockNumber: Number(blockNumber), returnData }
  }

  private async initContract() {
    this.#contract = await this.#agent.createContract(ADDRESS_MULTICALL, 'multicall')
    return this.#contract
  }
}
