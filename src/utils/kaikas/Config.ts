import type Caver from 'caver-js'
import type { AbiItem, Contract } from 'caver-js'

import type BigNumber from 'bignumber.js'
import utils from './utils'
import routerABI from '@/utils/smartcontracts/router.json'
import factoryABI from '@/utils/smartcontracts/factory.json'
import wethABI from '@/utils/smartcontracts/weth.json'

export const kaikasStatuses = {
  initial: 'INITIAL',
  notInstalled: 'NOT_INSTALLED',
  shouldConnect: 'SHOULD_CONNECT',
  connected: 'CONNECTED',
}

class Config {
  address: string | null = null

  routerAddress = '0xB0B695584234F2CC16266588b2b951F3d2885705'
  factoryAddress = '0xEB487a3A623E25cAa668B6D199F1aBa9D2380456'
  wethAddress = '0xae3a8a1D877a446b22249D8676AFeB16F056B44e'

  routerContract: Contract | null = null
  factoryContract: Contract | null = null
  wethContract: Contract | null = null
  caver: Caver | null = null

  status = kaikasStatuses.initial

  constructor() {
    const { caver, klaytn } = window

    if (!caver || !klaytn) {
      this.status = kaikasStatuses.notInstalled
      return
    }

    this.caver = caver

    this.routerContract = new caver.klay.Contract(
      routerABI.abi as AbiItem[],
      this.routerAddress,
    )
    this.factoryContract = new caver.klay.Contract(
      factoryABI.abi as AbiItem[],
      this.factoryAddress,
    )
    this.wethContract = new caver.klay.Contract(wethABI.abi as AbiItem[], this.wethAddress)

    this.status = kaikasStatuses.shouldConnect
  }

  async connectKaikas() {
    if (this.status !== kaikasStatuses.shouldConnect)
      throw new Error('Can\'t connect to Kaikas')

    this.caver = <Caver> this.caver
    const { klaytn } = window
    const addresses = await klaytn.enable()
    this.address = addresses[0]
    this.caver.klay.defaultAccount = addresses[0]

    return addresses[0]
  }

  createContract(address: string, abi: AbiItem[]) {
    if (this.status !== kaikasStatuses.shouldConnect)
      throw new Error('Can\'t create contract, check connect to Kaikas')

    this.caver = <Caver> this.caver
    return new this.caver.klay.Contract(abi, address)
  }

  async approveAmount(address: string, abi: AbiItem[], amount: BigNumber.Value) {
    const contract = this.createContract(address, abi)

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

export default config
