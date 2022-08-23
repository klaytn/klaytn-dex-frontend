import { Agent, AgentPure } from './agent'
import { IsomorphicContract } from './isomorphic-contract'
import { ADDRESS_FARMING, ADDRESS_MULTICALL } from '../const'
import Wei from './Wei'
import { Opaque } from 'type-fest'
import { Address } from '../types'

/**
 * Stringified number
 */
export type PoolId = Opaque<string, 'PoolId'>

interface PropsStaking {
  amount: Wei
}

interface PropsFarming extends PropsStaking {
  poolId: PoolId
}

export interface CallStruct {
  target: Address
  callData: string | number[]
}

export class EarnPure {
  #agent: AgentPure
  #contract: IsomorphicContract<'multicall'> | null = null

  public constructor(props: { agent: AgentPure }) {
    this.#agent = props.agent
  }

  public async multicallAggregate(calls: CallStruct[]) {
    const contract = this.#contract || (await this.initContract())

    const result = await contract
      .aggregate({
        argsEthers: () => [calls],
        argsWeb3: () => [calls.map((x) => [x.target, x.callData])],
      })
      .call()

    return result
  }

  private async initContract() {
    this.#contract = await this.#agent.createContract(ADDRESS_MULTICALL, 'multicall')
    return this.#contract
  }
}

export class Earn extends EarnPure {
  public readonly farming: Farming
  public readonly staking: Staking

  public constructor(props: { agent: Agent }) {
    super(props)
    this.farming = new Farming(props)
    this.staking = new Staking(props)
  }
}

export class Farming {
  #agent: Agent
  #contract: IsomorphicContract<'farming'> | null = null

  public constructor(props: { agent: Agent }) {
    this.#agent = props.agent
  }

  public async deposit(props: PropsFarming): Promise<void> {
    const contract = this.#contract || (await this.initContract())

    const gasPrice = await this.#agent.getGasPrice()
    await contract
      .deposit([props.poolId, props.amount.asStr], { from: this.#agent.address, gasPrice })
      .estimateAndSend()
  }

  public async withdraw(props: PropsFarming): Promise<void> {
    const contract = this.#contract || (await this.initContract())

    const gasPrice = await this.#agent.getGasPrice()
    await contract
      .withdraw([props.poolId, props.amount.asStr], { gasPrice, from: this.#agent.address })
      .estimateAndSend()
  }

  private async initContract() {
    this.#contract = await this.#agent.createContract(ADDRESS_FARMING, 'farming')
    return this.#contract
  }
}

export class Staking {
  #agent: Agent
  #contract: IsomorphicContract<'staking'> | null = null

  public constructor(props: { agent: Agent }) {
    this.#agent = props.agent
  }

  public async deposit(props: PropsStaking): Promise<void> {
    const contract = this.#contract || (await this.initContract())

    const gasPrice = await this.#agent.getGasPrice()
    await contract.deposit([props.amount.asStr], { from: this.#agent.address, gasPrice }).estimateAndSend()
  }

  public async withdraw(props: PropsStaking): Promise<void> {
    const contract = this.#contract || (await this.initContract())

    const gasPrice = await this.#agent.getGasPrice()
    await contract.withdraw([props.amount.asStr], { gasPrice, from: this.#agent.address }).estimateAndSend()
  }

  private async initContract() {
    this.#contract = await this.#agent.createContract(ADDRESS_FARMING, 'staking')
    return this.#contract
  }
}
