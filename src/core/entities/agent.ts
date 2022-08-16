import { JsonRpcProvider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from 'ethers'
import { KIP7, DexPair } from '../typechain'
import { Address } from '../types'
import { AbiLoader, type AbiToContract, type AvailableAbi } from '../abi'
import Wei from './Wei'

export interface CommonAddrs {
  router: Address
  factory: Address
}

interface AnonCtorProps {
  provider: JsonRpcProvider
  addrs: CommonAddrs
  abi: AbiLoader
}

export class AgentAnon {
  #provider: JsonRpcProvider
  #addrs: CommonAddrs
  #abi: AbiLoader

  public constructor(props: AnonCtorProps) {
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
    return this.createContractInternal(address, abiKey, this.#provider)
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

  protected async createContractInternal<T extends AvailableAbi>(
    address: Address,
    abiKey: T,
    providerOrSigner: Provider | Signer,
  ): Promise<AbiToContract<T>> {
    const abi = this.#abi.get(abiKey) || (await this.#abi.load(abiKey))
    return new Contract(address, abi, providerOrSigner) as unknown as AbiToContract<T>
  }
}

export class Agent extends AgentAnon {
  #address: Address

  public constructor({ address, base }: { address: Address; base: AnonCtorProps }) {
    super(base)
    this.#address = address
  }

  public get address() {
    return this.#address
  }

  /**
   * Uses KIP7 by default
   */
  public async approveAmount(address: Address, amount: Wei, spender = this.routerAddress): Promise<void> {
    const contract = await this.createContract(address, 'kip7')
    await this.approveAmountWithContract(contract, amount, spender)
  }

  public async approveAmountWithContract(
    contract: KIP7 | DexPair,
    amount: Wei,
    spender = this.routerAddress,
  ): Promise<void> {
    const allowance = await this.getAllowanceWithContract(contract, spender)
    if (amount.asBigInt <= allowance.asBigInt) return
    await contract.approve(spender, amount.asStr)
  }

  public async getAllowanceWithContract(contract: KIP7 | DexPair, spender = this.routerAddress): Promise<Wei> {
    const value = await contract.allowance(this.#address, spender)
    return new Wei(value)
  }

  public async createContract<T extends AvailableAbi>(address: Address, abiKey: T): Promise<AbiToContract<T>> {
    return this.createContractInternal(address, abiKey, this.provider.getSigner())
  }
}
