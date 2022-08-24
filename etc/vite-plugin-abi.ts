import { PluginOption } from 'vite'

function tryParseId(id: string): null | { abiName: string } {
  const match = id.match(/^~abi\/(.+)$/)
  if (match) {
    const [, abiName] = match
    return { abiName }
  }
  return null
}

export default function (): PluginOption {
  return {
    name: 'app:abi',
    resolveId(id) {
      const parsed = tryParseId(id)
      if (parsed) {
        return id
      }
    },
    load(id) {
      const parsed = tryParseId(id)
      if (parsed) {
        return `import { abi } from '@/core/smartcontracts/${parsed.abiName}.json'\nexport default abi`
      }
    },
  }
}
