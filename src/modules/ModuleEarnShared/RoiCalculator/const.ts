import { Period } from './types'

export const PERIOD_DAYS = {
  [Period.d1]: 1,
  [Period.d7]: 7,
  [Period.d14]: 14,
  [Period.d30]: 30,
  [Period.y1]: 365,
  [Period.y5]: 365 * 5,
}

export const PERIOD_NAMES = {
  [Period.d1]: 'Daily',
  [Period.d7]: 'Weekly',
  [Period.d14]: '2 Weeks',
  [Period.d30]: 'Monthly',
  [Period.y1]: 'Annual',
  [Period.y5]: '5 Years',
}
