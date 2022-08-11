import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Contract, type ContractInterface } from 'ethers'
import type { DexPair, KIP7 } from '@/core/typechain'
import type { Address } from './types'
import Wei from './Wei'
import invariant from 'tiny-invariant'
import { AbiLoader, AbiToContract, AvailableAbi } from './abi'

interface WalletAddrs {
  // self: null | Address
  router: Address
  factory: Address
}

interface NewWalletProps {
  provider: JsonRpcProvider
  addrs: WalletAddrs
  abi: AbiLoader
}

export default class KlaytnAgent {
  #provider: JsonRpcProvider
  #addrs: WalletAddrs
  #abi: AbiLoader

  public constructor(props: NewWalletProps) {
    this.#addrs = props.addrs
    this.#provider = props.provider
    this.#abi = props.abi
  }

  public get provider() {
    return this.#provider
  }

  public get routerAddress(): Address {
    return this.#addrs.router
  }

  public get factoryAddress(): Address {
    return this.#addrs.factory
  }

  public async createContract<T extends AvailableAbi>(address: Address, abiKey: T): Promise<AbiToContract<T>> {
    const abi = this.#abi.get(abiKey) || (await this.#abi.load(abiKey))
    return new Contract(address, abi, this.#provider) as unknown as AbiToContract<T>
  }

  public async getGasPrice(): Promise<Wei> {
    const value = await this.#provider.getGasPrice()
    return new Wei(value)
  }

  public async isSmartContract(addr: Address): Promise<boolean> {
    const code = await this.#provider.getCode(addr)
    return code !== '0x'
  }

  public async getBalance(address: Address): Promise<Wei> {
    const value = await this.#provider.getBalance(address)
    return new Wei(value)
  }
}

export class UserKlaytnAgent {
  #agent: KlaytnAgent
  #address: Address

  public constructor(props: { agent: KlaytnAgent; address: Address }) {
    this.#agent = props.agent
    this.#address = this.address
  }

  public get base() {
    return this.#agent
  }

  public get address() {
    return this.#address
  }

  /**
   * Uses KIP7 by default
   */
  public async approveAmount(address: Address, amount: Wei, spender = this.#agent.routerAddress): Promise<void> {
    const contract = await this.#agent.createContract(address, 'kip7')
    await this.approveAmountWithContract(contract, amount, spender)
  }

  public async approveAmountWithContract(
    contract: KIP7 | DexPair,
    amount: Wei,
    spender = this.#agent.routerAddress,
  ): Promise<void> {
    const allowance = await this.getAllowanceWithContract(contract, spender)
    if (amount.asBigInt <= allowance.asBigInt) return
    await contract.approve(spender, amount.asStr)
  }

  public async getAllowanceWithContract(contract: KIP7 | DexPair, spender = this.#agent.routerAddress): Promise<Wei> {
    const value = await contract.allowance(this.#address, spender)
    return new Wei(value)
  }
}

// class AuthorizedWallet extends Wallet {
//   public constructor()

//   public aaa() {

//   }
// }
