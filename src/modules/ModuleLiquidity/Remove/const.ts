export const TABS = ['amount', 'detailed'] as const

export type Tab = typeof TABS[number]
