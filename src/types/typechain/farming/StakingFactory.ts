/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type BN from "bn.js";
import type { ContractOptions } from "web3-eth-contract";
import type { EventLog } from "web3-core";
import type { EventEmitter } from "events";
import type {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "../types";

export interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type NewStakingContract = ContractEventLog<{
  staking: string;
  0: string;
}>;
export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string;
  newOwner: string;
  0: string;
  1: string;
}>;

export interface StakingFactory extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): StakingFactory;
  clone(): StakingFactory;
  methods: {
    deployPool(
      _stakedToken: string,
      _rewardToken: string,
      _rewardPerBlock: number | string | BN,
      _startBlock: number | string | BN,
      _bonusEndBlock: number | string | BN,
      _poolLimitPerUser: number | string | BN,
      _numberBlocksForUserLimit: number | string | BN,
      _admin: string
    ): NonPayableTransactionObject<string>;

    owner(): NonPayableTransactionObject<string>;

    renounceOwnership(): NonPayableTransactionObject<void>;

    transferOwnership(newOwner: string): NonPayableTransactionObject<void>;
  };
  events: {
    NewStakingContract(cb?: Callback<NewStakingContract>): EventEmitter;
    NewStakingContract(
      options?: EventOptions,
      cb?: Callback<NewStakingContract>
    ): EventEmitter;

    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter;
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "NewStakingContract", cb: Callback<NewStakingContract>): void;
  once(
    event: "NewStakingContract",
    options: EventOptions,
    cb: Callback<NewStakingContract>
  ): void;

  once(event: "OwnershipTransferred", cb: Callback<OwnershipTransferred>): void;
  once(
    event: "OwnershipTransferred",
    options: EventOptions,
    cb: Callback<OwnershipTransferred>
  ): void;
}
