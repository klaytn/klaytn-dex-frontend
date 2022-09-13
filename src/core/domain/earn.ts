import { Agent, AgentPure } from './agent'
import { IsomorphicContract } from '../isomorphic-contract'
import { ADDRESS_FARMING, ADDRESS_MULTICALL } from '../const'
import { Wei } from '../entities'
import { Opaque } from 'type-fest'
import { Address } from '../types'
import { Interface, JsonFragment } from '@ethersproject/abi'
import { defaultAbiCoder } from '@/core'

/**
 * Stringified number
 */
export type PoolId = Opaque<string, 'PoolId'>

export type Rewards<K extends PoolId | Address> = Map<K, Wei>

export interface RewardsWithBlockNumber<K extends PoolId | Address> {
  rewards: Rewards<K>
  blockNumber: number
}

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

export class Earn extends EarnPure {
  public readonly farming: Farming
  public readonly staking: Staking

  public constructor(props: { agent: Agent }) {
    super(props)
    const withEarn = { agent: props.agent, earn: this }
    this.farming = new Farming(withEarn)
    this.staking = new Staking(withEarn)
  }
}

export class Farming {
  #agent: Agent
  #contract: IsomorphicContract<'farming'> | null = null
  #rewardsEncoder: null | ((poolId: PoolId, address: Address) => string) = null
  #earn: EarnPure

  public constructor(props: { agent: Agent; earn: EarnPure }) {
    this.#agent = props.agent
    this.#earn = props.earn
  }

  public async getRewards(pools: PoolId[]): Promise<RewardsWithBlockNumber<PoolId>> {
    const encode = this.#rewardsEncoder || (await this.initEncoder())

    const calls = pools.map((poolId) => ({
      target: ADDRESS_FARMING,
      callData: encode(poolId, this.#agent.address),
    }))
    const { blockNumber, returnData } = await this.#earn.multicallAggregate(calls)
    const rewards = makeRewardsMap(pools, returnData)

    return { rewards, blockNumber }
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

  private async initEncoder() {
    const fragments = this.#agent.abi.get('farming') || (await this.#agent.abi.load('farming'))
    const iface = new Interface(fragments as JsonFragment[])
    this.#rewardsEncoder = (poolId, addr) =>
      // FIXME please describe why we use `pendingPtn` here
      iface.encodeFunctionData('pendingPtn', [poolId, addr])
    return this.#rewardsEncoder
  }
}

export class Staking {
  #agent: Agent
  #contract: IsomorphicContract<'staking'> | null = null
  #rewardsEncoder: null | ((poolAddress: Address) => string) = null
  #earn: EarnPure

  public constructor(props: { agent: Agent; earn: EarnPure }) {
    this.#agent = props.agent
    this.#earn = props.earn
  }

  public async getRewards(pools: Address[]): Promise<RewardsWithBlockNumber<Address>> {
    const encode = this.#rewardsEncoder || (await this.initEncoder())

    const calls = pools.map((poolId) => ({
      target: poolId,
      callData: encode(this.#agent.address),
    }))
    const { blockNumber, returnData } = await this.#earn.multicallAggregate(calls)
    const rewards = makeRewardsMap(pools, returnData)

    return { rewards, blockNumber }
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

  private async initEncoder() {
    const fragments = this.#agent.abi.get('staking') || (await this.#agent.abi.load('staking'))
    const iface = new Interface(fragments as JsonFragment[])
    this.#rewardsEncoder = (addr) =>
      // FIXME please describe why we use `pendingReward` here
      iface.encodeFunctionData('pendingReward', [addr])
    return this.#rewardsEncoder
  }
}

function makeRewardsMap<K extends PoolId | Address>(indices: K[], returnData: string[]): Rewards<K> {
  return new Map(
    returnData.map((hex, idx) => {
      const poolId = indices[idx]
      const [decoded] = defaultAbiCoder.decode(['uint256'], hex)
      const value = new Wei(decoded)
      return [poolId, value]
    }),
  )
}
