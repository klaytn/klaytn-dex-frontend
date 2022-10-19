import { Serializer } from '@vueuse/core'
import { JsonValue } from 'type-fest'

/**
 * Serializer for {@link @vueuse/core#useLocalStorage()}
 */
export const JSON_SERIALIZER: Serializer<JsonValue> = {
  read: (raw) => JSON.parse(raw),
  write: (parsed) => JSON.stringify(parsed),
}
