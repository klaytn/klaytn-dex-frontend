import type { Except } from 'type-fest'
import type { ConfigParsed } from '../src/types/config'
import type { Address, Network, Token } from '../src/core/types'
import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { isAddress } from '@ethersproject/address'
import type { Plugin } from 'vite'
import consola from 'consola'
import chalk from 'chalk'

import RAW_CONFIG_JSON from '../dex-config.json'
import invariant from 'tiny-invariant'
import { match } from 'ts-pattern'

interface ConfigRaw extends Except<ConfigParsed, 'network' | 'tokenNative' | 'tokenDex'> {
  tokenNative: Address
  tokenDex: Address
  network: Except<Network, 'nativeToken'>
}

const SCHEMA_ADDRESS: JSONSchemaType<Address> = {
  type: 'string',
  format: 'address',
}

const SCHEMA_URI: JSONSchemaType<string> = {
  type: 'string',
  format: 'uri',
}

const SCHEMA_CONFIG_RAW: JSONSchemaType<ConfigRaw> = {
  type: 'object',
  properties: {
    tokens: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'object',
        required: ['name', 'address', 'decimals', 'symbol'],
        properties: {
          name: { type: 'string' },
          address: SCHEMA_ADDRESS,
          decimals: { type: 'integer' },
          symbol: { type: 'string' },
        },
      },
    },
    network: {
      type: 'object',
      properties: {
        chainId: { type: 'integer' },
        chainName: { type: 'string' },
        rpcUrl: SCHEMA_URI,
        blockExplorerUrl: SCHEMA_URI,
      },
      required: ['chainId', 'chainName', 'rpcUrl', 'blockExplorerUrl'],
    },
    tokenNative: SCHEMA_ADDRESS,
    tokenDex: SCHEMA_ADDRESS,
    smartcontracts: {
      type: 'object',
      properties: {
        factory: SCHEMA_ADDRESS,
        router: SCHEMA_ADDRESS,
        weth: SCHEMA_ADDRESS,
        multicall: SCHEMA_ADDRESS,
        farming: SCHEMA_ADDRESS,
      },
      required: ['factory', 'farming', 'multicall', 'router', 'weth'],
    },
    subgraphs: {
      type: 'object',
      properties: {
        exchange: SCHEMA_URI,
        farming: SCHEMA_URI,
        staking: SCHEMA_URI,
        snapshot: SCHEMA_URI,
      },
      required: ['exchange', 'farming', 'staking', 'snapshot'],
    },
    snapshotSpace: { type: 'string' },
    uriDashboards: SCHEMA_URI,
    uriConnectWalletGuide: SCHEMA_URI,
    uriIPFS: SCHEMA_URI,
  },
  required: [
    'network',
    'tokens',
    'smartcontracts',
    'tokenDex',
    'tokenNative',
    'subgraphs',
    'uriDashboards',
    'snapshotSpace',
    'uriConnectWalletGuide',
    'uriIPFS',
  ],
  additionalProperties: false,
}

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
ajv.addFormat('address', isAddress)

const validate = ajv.compile(SCHEMA_CONFIG_RAW)

function validateOrExit(): ConfigRaw {
  if (!validate(RAW_CONFIG_JSON)) {
    const { errors } = validate
    invariant(errors)

    const message =
      `Failed to validate DEX configuration (./dex-config.json):\n` +
      errors
        .map((x) => {
          const path = match(x.instancePath)
            .with('', () => chalk.bold.blue('<root>'))
            .otherwise((x) => chalk.bold.yellow(x))

          const message = x.message

          return `  ${path}: ${message}`
        })
        .join('\n')

    consola.fatal(message)

    process.exit(1)
  }

  return RAW_CONFIG_JSON
}

function parseConfig(raw: ConfigRaw): ConfigParsed {
  const findTokenOrFail = (type: 'dex' | 'native'): Token => {
    const address = match(type)
      .with('dex', () => raw.tokenDex)
      .with('native', () => raw.tokenNative)
      .exhaustive()
      .toLowerCase()

    const token = raw.tokens.find((x) => x.address.toLowerCase() === address)

    if (!token) {
      consola.fatal(chalk`Cannot find {bold.blue ${type.toUpperCase()}} token in tokens list`)
      process.exit(1)
    }

    return token
  }

  const trimTrailingSlash = (str: string): string => {
    return str.replace(/\/$/, '')
  }

  const tokenNative = findTokenOrFail('native')
  const tokenDex = findTokenOrFail('dex')

  const parsed: ConfigParsed = {
    subgraphs: {
      exchange: trimTrailingSlash(raw.subgraphs.exchange),
      farming: trimTrailingSlash(raw.subgraphs.farming),
      staking: trimTrailingSlash(raw.subgraphs.staking),
      snapshot: trimTrailingSlash(raw.subgraphs.snapshot),
    },
    tokens: raw.tokens,
    smartcontracts: raw.smartcontracts,
    uriDashboards: trimTrailingSlash(raw.uriDashboards),
    uriConnectWalletGuide: trimTrailingSlash(raw.uriConnectWalletGuide),
    snapshotSpace: raw.snapshotSpace,
    tokenDex,
    tokenNative,
    network: {
      ...raw.network,
      rpcUrl: trimTrailingSlash(raw.network.rpcUrl),
      blockExplorerUrl: trimTrailingSlash(raw.network.blockExplorerUrl),
      nativeToken: tokenNative,
    },
    uriIPFS: trimTrailingSlash(raw.uriIPFS),
  }

  return parsed
}

const MODULE_ID = '~config'

export default (): Plugin => {
  const raw = validateOrExit()
  const parsedAsJson = JSON.stringify(parseConfig(raw))

  return {
    name: 'app:parsed-config',
    resolveId(id) {
      if (id === MODULE_ID) return id
    },
    load(id) {
      if (id === MODULE_ID) {
        return `export default ${parsedAsJson}`
      }
    },
  }
}
