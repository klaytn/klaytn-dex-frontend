import { Agent } from './agent'
import { IsomorphicContract } from '../isomorphic-contract'
import { ADDRESS_FARMING } from '../const'
import { Wei } from '../entities'
import { Opaque } from 'type-fest'
import { Address } from '../types'
import { Interface, JsonFragment } from '@ethersproject/abi'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { defaultAbiCoder } from '@/core'
import MulticallPure from './MulticallPure'

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
  poolId: Address
}

interface PropsFarming {
  amount: Wei
  poolId: PoolId
}

export class Earn {
  public readonly farming: Farming
  public readonly staking: Staking

  public constructor(props: { agent: Agent; multicall: MulticallPure }) {
    this.farming = new Farming(props)
    this.staking = new Staking(props)
  }
}

export class Farming {
  #agent: Agent
  #contract: IsomorphicContract<'farming'> | null = null
  #rewardsEncoder: null | ((poolId: PoolId, address: Address) => string) = null
  #multicall: MulticallPure

  public constructor(props: { agent: Agent; multicall: MulticallPure }) {
    this.#agent = props.agent
    this.#multicall = props.multicall
  }

  public async getRewards(pools: PoolId[]): Promise<RewardsWithBlockNumber<PoolId>> {
    const encode = this.#rewardsEncoder || (await this.initEncoder())

    const calls = pools.map((poolId) => ({
      target: ADDRESS_FARMING,
      callData: encode(poolId, this.#agent.address),
    }))
    const { blockNumber, returnData } = await this.#multicall.aggregate(calls)
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
  #rewardsEncoder: null | ((poolAddress: Address) => string) = null
  #multicall: MulticallPure

  public constructor(props: { agent: Agent; multicall: MulticallPure }) {
    this.#agent = props.agent
    this.#multicall = props.multicall
  }

  public async getRewards(pools: Address[]): Promise<RewardsWithBlockNumber<Address>> {
    const encode = this.#rewardsEncoder || (await this.initEncoder())

    const calls = pools.map((poolId) => ({
      target: poolId,
      callData: encode(this.#agent.address),
    }))
    const { blockNumber, returnData } = await this.#multicall.aggregate(calls)
    const rewards = makeRewardsMap(pools, returnData)

    return { rewards, blockNumber }
  }

  public async deposit(props: PropsStaking): Promise<void> {
    const contract = await this.initContract(props.poolId)

    const gasPrice = await this.#agent.getGasPrice()
    await contract.deposit([props.amount.asStr], { from: this.#agent.address, gasPrice }).estimateAndSend()
  }

  public async withdraw(props: PropsStaking): Promise<void> {
    const contract = await this.initContract(props.poolId)

    const gasPrice = await this.#agent.getGasPrice()
    await contract.withdraw([props.amount.asStr], { gasPrice, from: this.#agent.address }).estimateAndSend()
  }

  private async initContract(poolId: Address) {
    return this.#agent.createContract(poolId, 'staking')
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
      const [decoded] = defaultAbiCoder.decode(['uint256'], hex) as [EthersBigNumber]
      const value = new Wei(decoded)
      return [poolId, value]
    }),
  )
}
