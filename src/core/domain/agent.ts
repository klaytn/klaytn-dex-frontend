import { type JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Contract } from 'ethers'
import { Address, Kaikas, Token } from '../types'
import { AbiContractEthers, AbiContractWeb3, AbiLoader, type AvailableAbi } from '../abi'
import { Wei } from '../entities'
import type Caver from 'caver-js'
import type { AbiItem } from 'caver-js'
import { IsomorphicContract, isomorphicContract } from '../isomorphic-contract'
import invariant from 'tiny-invariant'
import { Except } from 'type-fest'

export interface CommonAddrs {
  router: Address
  factory: Address
}

interface AnonCtorProps {
  provider: AgentProvider
  addrs: CommonAddrs
  abi: AbiLoader
}

export type AgentProvider =
  | {
      kind: 'caver'
      caver: Caver
      kaikas: Kaikas
      unstableEthers: JsonRpcProvider
    }
  | {
      kind: 'ethers'
      ethers: JsonRpcProvider
    }

export class AgentPure {
  #provider: AgentProvider
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

  public get abi() {
    return this.#abi
  }

  public get routerAddress(): Address {
    return this.#addrs.router
  }

  public get factoryAddress(): Address {
    return this.#addrs.factory
  }

  public async createContract<A extends AvailableAbi>(address: Address, abiKey: A): Promise<IsomorphicContract<A>> {
    return this.createContractInternal(address, abiKey, 'provider')
  }

  public async getGasPrice(): Promise<Wei> {
    return new Wei(
      this.#provider.kind === 'ethers'
        ? await this.#provider.ethers.getGasPrice()
        : await this.#provider.caver.klay.getGasPrice(),
    )
  }

  public async isSmartContract(address: Address): Promise<boolean> {
    const code =
      this.#provider.kind === 'ethers'
        ? await this.#provider.ethers.getCode(address)
        : await this.#provider.caver.klay.getCode(address)
    return code !== '0x'
  }

  public async getBalance(address: Address): Promise<Wei> {
    const value =
      this.#provider.kind === 'ethers'
        ? await this.#provider.ethers.getBalance(address)
        : await this.#provider.caver.klay.getBalance(address)
    return new Wei(value)
  }

  public async getBlockNumber(): Promise<number> {
    return this.#provider.kind === 'ethers'
      ? this.#provider.ethers.getBlockNumber()
      : this.#provider.caver.klay.getBlockNumber()
  }

  /**
   * @param mode actual only for `ethers` provider
   */
  protected async createContractInternal<A extends AvailableAbi>(
    address: Address,
    abiKey: A,
    mode: 'provider' | 'signer',
  ): Promise<IsomorphicContract<A>> {
    const abi = this.#abi.get(abiKey) || (await this.#abi.load(abiKey))

    if (this.#provider.kind === 'ethers') {
      const { ethers: provider } = this.#provider

      let useForContract: JsonRpcProvider | JsonRpcSigner = provider
      if (mode === 'signer') {
        const signer = provider.getSigner()
        invariant(signer)
        useForContract = signer
      }

      const contract = new Contract(address, abi, useForContract) as unknown as AbiContractEthers[A]
      return isomorphicContract({ lib: 'ethers', ethers: contract })
    }

    const { caver } = this.#provider

    const contract = new caver.klay.Contract(abi as AbiItem[], address) as unknown as AbiContractWeb3[A]
    return isomorphicContract({ lib: 'web3', web3: contract })
  }
}

export class Agent extends AgentPure {
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
    contract: IsomorphicContract<'kip7' | 'pair'>,
    amount: Wei,
    spender = this.routerAddress,
  ): Promise<void> {
    const allowance = await this.getAllowanceWithContract(contract, spender)
    if (amount.asBigInt <= allowance.asBigInt) return

    const gasPrice = await this.getGasPrice()
    await contract.approve([spender, amount.asStr], { gasPrice, from: this.address }).estimateAndSend()
  }

  /**
   * Note: uses KIP7
   *
   * @param spender default is the router address
   */
  public async getAllowance(contract: Address, spender = this.routerAddress): Promise<Wei> {
    const kip = await this.createContract(contract, 'kip7')
    return this.getAllowanceWithContract(kip, spender)
  }

  public async getAllowanceWithContract(
    contract: IsomorphicContract<'kip7' | 'pair'>,
    spender = this.routerAddress,
  ): Promise<Wei> {
    const value = await contract.allowance([this.#address, spender], { from: this.address }).call()
    return new Wei(value)
  }

  public async createContract<A extends AvailableAbi>(address: Address, abiKey: A): Promise<IsomorphicContract<A>> {
    return this.createContractInternal(address, abiKey, 'signer')
  }

  /**
   * @see https://eips.ethereum.org/EIPS/eip-747
   * @see https://docs.metamask.io/guide/rpc-api.html#wallet-watchasset
   * @see https://docs.kaikas.io/02_api_reference/01_klaytn_provider#wallet_watchasset
   */
  public async watchAsset(
    asset: Partial<Except<Token, 'name'>> & {
      /**
       * image url
       */
      image?: string
    },
  ): Promise<void> {
    const ethers =
      this.provider.kind === 'caver'
        ? // by using `ethers` and not `Kaikas` directly, we uniform the interaction
          // also we don't need to generate random request id - `ethers` does it for us
          this.provider.unstableEthers
        : this.provider.ethers

    await ethers.send(
      'wallet_watchAsset',
      // it doesn't work if pass it as a single-element array for some reason
      {
        type: 'ERC20',
        options: asset,
      } as any,
    )
  }
}
