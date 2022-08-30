/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type { KIP7, KIP7Interface } from "../../tokens/KIP7";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "safeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001045380380620010458339810160408190526200003491620001db565b81516200004990600390602085019062000068565b5080516200005f90600490602084019062000068565b50505062000282565b828054620000769062000245565b90600052602060002090601f0160209004810192826200009a5760008555620000e5565b82601f10620000b557805160ff1916838001178555620000e5565b82800160010185558215620000e5579182015b82811115620000e5578251825591602001919060010190620000c8565b50620000f3929150620000f7565b5090565b5b80821115620000f35760008155600101620000f8565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200013657600080fd5b81516001600160401b03808211156200015357620001536200010e565b604051601f8301601f19908116603f011681019082821181831017156200017e576200017e6200010e565b816040528381526020925086838588010111156200019b57600080fd5b600091505b83821015620001bf5785820183015181830184015290820190620001a0565b83821115620001d15760008385830101525b9695505050505050565b60008060408385031215620001ef57600080fd5b82516001600160401b03808211156200020757600080fd5b620002158683870162000124565b935060208501519150808211156200022c57600080fd5b506200023b8582860162000124565b9150509250929050565b600181811c908216806200025a57607f821691505b602082108114156200027c57634e487b7160e01b600052602260045260246000fd5b50919050565b610db380620002926000396000f3fe608060405234801561001057600080fd5b50600436106101005760003560e01c806342842e0e11610097578063a9059cbb11610066578063a9059cbb14610208578063b88d4fde1461021b578063dd62ed3e1461022e578063eb7955491461024157600080fd5b806342842e0e146101b157806370a08231146101c457806395d89b41146101ed578063a457c2d7146101f557600080fd5b806323b872dd116100d357806323b872dd14610167578063313ce5671461017a5780633950935114610189578063423f6cef1461019c57600080fd5b806301ffc9a71461010557806306fdde031461012d578063095ea7b31461014257806318160ddd14610155575b600080fd5b610118610113366004610a0c565b610254565b60405190151581526020015b60405180910390f35b6101356102a6565b6040516101249190610a7d565b610118610150366004610aac565b610338565b6002545b604051908152602001610124565b610118610175366004610ad6565b610350565b60405160128152602001610124565b610118610197366004610aac565b610374565b6101af6101aa366004610aac565b610396565b005b6101af6101bf366004610ad6565b6103bb565b6101596101d2366004610b12565b6001600160a01b031660009081526020819052604090205490565b6101356103e8565b610118610203366004610aac565b6103f7565b610118610216366004610aac565b610475565b6101af610229366004610bd0565b610483565b61015961023c366004610c38565b6104a2565b6101af61024f366004610c6b565b6104cd565b60006001600160e01b03198216636578737160e01b148061028557506001600160e01b0319821663a219a02560e01b145b806102a057506301ffc9a760e01b6001600160e01b03198316145b92915050565b6060600380546102b590610cc2565b80601f01602080910402602001604051908101604052809291908181526020018280546102e190610cc2565b801561032e5780601f106103035761010080835404028352916020019161032e565b820191906000526020600020905b81548152906001019060200180831161031157829003601f168201915b5050505050905090565b6000336103468185856104da565b5060019392505050565b60003361035e8582856105fd565b610369858585610671565b506001949350505050565b60003361034681858561038783836104a2565b6103919190610cfd565b6104da565b60003390506103b68184846040518060200160405280600081525061083b565b505050565b336103c78482846105fd565b6103e28484846040518060200160405280600081525061083b565b50505050565b6060600480546102b590610cc2565b6000338161040582866104a2565b9050838110156104685760405162461bcd60e51b8152602060048201526024808201527f4b4950373a2064656372656173656420616c6c6f77616e63652062656c6f77206044820152637a65726f60e01b60648201526084015b60405180910390fd5b61036982868684036104da565b600033610346818585610671565b3361048f8582856105fd565b61049b8585858561083b565b5050505050565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b336103e28185858561083b565b6001600160a01b03831661053c5760405162461bcd60e51b815260206004820152602360248201527f4b4950373a20617070726f76652066726f6d20746865207a65726f206164647260448201526265737360e81b606482015260840161045f565b6001600160a01b03821661059c5760405162461bcd60e51b815260206004820152602160248201527f4b4950373a20617070726f766520746f20746865207a65726f206164647265736044820152607360f81b606482015260840161045f565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b600061060984846104a2565b905060001981146103e257818110156106645760405162461bcd60e51b815260206004820152601c60248201527f4b4950373a20696e73756666696369656e7420616c6c6f77616e636500000000604482015260640161045f565b6103e284848484036104da565b6001600160a01b0383166106d35760405162461bcd60e51b8152602060048201526024808201527f4b4950373a207472616e736665722066726f6d20746865207a65726f206164646044820152637265737360e01b606482015260840161045f565b6001600160a01b0382166107345760405162461bcd60e51b815260206004820152602260248201527f4b4950373a207472616e7366657220746f20746865207a65726f206164647265604482015261737360f01b606482015260840161045f565b6001600160a01b038316600090815260208190526040902054818110156107ab5760405162461bcd60e51b815260206004820152602560248201527f4b4950373a207472616e7366657220616d6f756e7420657863656564732062616044820152646c616e636560d81b606482015260840161045f565b6001600160a01b038085166000908152602081905260408082208585039055918516815290812080548492906107e2908490610cfd565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161082e91815260200190565b60405180910390a36103e2565b610846848484610671565b610852848484846108b6565b6103e25760405162461bcd60e51b815260206004820152602f60248201527f4b4950373a207472616e7366657220746f206e6f6e20494b495037526563656960448201526e3b32b91034b6b83632b6b2b73a32b960891b606482015260840161045f565b60006001600160a01b0384163b1561036957604051634e8c461160e11b81526001600160a01b03851690639d188c22906108fa903390899088908890600401610d23565b6020604051808303816000875af1925050508015610935575060408051601f3d908101601f1916820190925261093291810190610d60565b60015b6109d6573d808015610963576040519150601f19603f3d011682016040523d82523d6000602084013e610968565b606091505b5080516109ce5760405162461bcd60e51b815260206004820152602e60248201527f4b4950373a207472616e7366657220746f206e6f6e204b49503752656365697660448201526d32b91034b6b83632b6b2b73a32b960911b606482015260840161045f565b805181602001fd5b6001600160e01b031916634e8c461160e11b149050949350505050565b6001600160e01b031981168114610a0957600080fd5b50565b600060208284031215610a1e57600080fd5b8135610a29816109f3565b9392505050565b6000815180845260005b81811015610a5657602081850181015186830182015201610a3a565b81811115610a68576000602083870101525b50601f01601f19169290920160200192915050565b602081526000610a296020830184610a30565b80356001600160a01b0381168114610aa757600080fd5b919050565b60008060408385031215610abf57600080fd5b610ac883610a90565b946020939093013593505050565b600080600060608486031215610aeb57600080fd5b610af484610a90565b9250610b0260208501610a90565b9150604084013590509250925092565b600060208284031215610b2457600080fd5b610a2982610a90565b634e487b7160e01b600052604160045260246000fd5b600082601f830112610b5457600080fd5b813567ffffffffffffffff80821115610b6f57610b6f610b2d565b604051601f8301601f19908116603f01168101908282118183101715610b9757610b97610b2d565b81604052838152866020858801011115610bb057600080fd5b836020870160208301376000602085830101528094505050505092915050565b60008060008060808587031215610be657600080fd5b610bef85610a90565b9350610bfd60208601610a90565b925060408501359150606085013567ffffffffffffffff811115610c2057600080fd5b610c2c87828801610b43565b91505092959194509250565b60008060408385031215610c4b57600080fd5b610c5483610a90565b9150610c6260208401610a90565b90509250929050565b600080600060608486031215610c8057600080fd5b610c8984610a90565b925060208401359150604084013567ffffffffffffffff811115610cac57600080fd5b610cb886828701610b43565b9150509250925092565b600181811c90821680610cd657607f821691505b60208210811415610cf757634e487b7160e01b600052602260045260246000fd5b50919050565b60008219821115610d1e57634e487b7160e01b600052601160045260246000fd5b500190565b6001600160a01b0385811682528416602082015260408101839052608060608201819052600090610d5690830184610a30565b9695505050505050565b600060208284031215610d7257600080fd5b8151610a29816109f356fea26469706673582212204ca4a9ea5b62ab5938aa2a71c3d2e47d9ed15c3637bc51e5204056abaa9de61364736f6c634300080c0033";

type KIP7ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: KIP7ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class KIP7__factory extends ContractFactory {
  constructor(...args: KIP7ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<KIP7> {
    return super.deploy(name_, symbol_, overrides || {}) as Promise<KIP7>;
  }
  override getDeployTransaction(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(name_, symbol_, overrides || {});
  }
  override attach(address: string): KIP7 {
    return super.attach(address) as KIP7;
  }
  override connect(signer: Signer): KIP7__factory {
    return super.connect(signer) as KIP7__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): KIP7Interface {
    return new utils.Interface(_abi) as KIP7Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): KIP7 {
    return new Contract(address, _abi, signerOrProvider) as KIP7;
  }
}
