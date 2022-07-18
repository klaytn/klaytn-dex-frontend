import { Address } from '@/core/kaikas'
import { TokensPair, doForPair } from '@/utils/pair'

export function useLocalStorageSync(selection: TokensPair<Address | null>, key: string) {
  doForPair((type) => {
    const ls = useLocalStorage<null | Address>(`${key}-${type}`, null)
    const inSelection = toRef(selection, type)

    if (ls.value && !inSelection.value) {
      inSelection.value = ls.value
    }

    syncRef(inSelection, ls)
  })
}
