import type Caver from 'caver-js'
import type { AbiItem, Contract } from 'caver-js'

import type BigNumber from 'bignumber.js'
import utils from './utils'
import routerABI from '@/utils/smartcontracts/router.json'
import factoryABI from '@/utils/smartcontracts/factory.json'
import wethABI from '@/utils/smartcontracts/weth.json'
import type { DexFactory, DexRouter } from '@/types/typechain/swap'
import type { WETH9 } from '@/types/typechain/tokens/WKLAY.sol'
import { type Address, KaikasStatus } from '@/types'

export class Config {
  address: Address | null = null

  routerAddress = '0xB0B695584234F2CC16266588b2b951F3d2885705'
  factoryAddress = '0xEB487a3A623E25cAa668B6D199F1aBa9D2380456'
  wethAddress = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'

  routerContract: DexRouter | null = null
  factoryContract: DexFactory | null = null
  wethContract: WETH9 | null = null
  caver: Caver | null = null

  status = KaikasStatus.Initial

  constructor() {
    const { caver, klaytn } = window

    if (!caver || !klaytn) {
      this.status = KaikasStatus.NotInstalled
      return
    }

    this.caver = caver

    this.routerContract = new caver.klay.Contract(
      routerABI.abi as AbiItem[],
      this.routerAddress,
    ) as unknown as DexRouter

    this.factoryContract = new caver.klay.Contract(
      factoryABI.abi as AbiItem[],
      this.factoryAddress,
    ) as unknown as DexFactory

    this.wethContract = new caver.klay.Contract(
      wethABI.abi as AbiItem[],
      this.wethAddress,
    ) as unknown as WETH9

    this.status = KaikasStatus.ShouldConnect
  }

  async connectKaikas() {
    if (this.status !== KaikasStatus.ShouldConnect)
      throw new Error('Can\'t connect to Kaikas')

    this.caver = <Caver> this.caver
    const { klaytn } = window
    const addresses = await klaytn.enable()
    this.address = addresses[0]
    this.caver.klay.defaultAccount = addresses[0]

    this.status = KaikasStatus.Connected

    return addresses[0]
  }

  createContract<T>(address: Address, abi: AbiItem[]) {
    if (this.status !== KaikasStatus.Connected)
      throw new Error('Can\'t create contract, check connect to Kaikas')

    this.caver = <Caver> this.caver
    return new this.caver.klay.Contract(abi, address) as unknown as T
  }

  async approveAmount(address: Address, abi: AbiItem[], amount: BigNumber.Value) {
    const contract = this.createContract<Contract>(address, abi)

    const allowance = await contract.methods
      .allowance(this.address, this.routerAddress)
      .call({
        from: this.address,
      })

    const amountValue = utils.bigNumber(amount)
    const allowanceValue = utils.bigNumber(allowance)

    if (amountValue.isLessThanOrEqualTo(allowanceValue))
      return amount

    const gas = await contract.methods
      .approve(this.routerAddress, amount)
      .estimateGas()

    return await contract.methods.approve(this.routerAddress, amount).send({
      from: this.address,
      gas,
      gasPrice: 250000000000,
    })
  }
}

const config = new Config()

interface ConfigWithConnectedKaikas extends Config {
  address: Address

  routerContract: DexRouter
  factoryContract: DexFactory
  wethContract: WETH9
  caver: Caver

  status: KaikasStatus.Connected
}

export function useConfigWithConnectedKaikas() {
  if (config.status !== KaikasStatus.Connected)
    throw new Error('Kaikas is not connected')

  return config as ConfigWithConnectedKaikas
}

export default config
