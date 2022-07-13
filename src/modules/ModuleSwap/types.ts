import { Address, ValueWei } from '@/core/kaikas'

export interface InputRaw {
  addr: Address | null
  inputRaw: string
}

export interface InputWei {
  addr: Address
  input: ValueWei<string>
}
