import BigNumber from 'bignumber.js'

export const fromWei = (value: BigNumber | string | number, decimals = 18): BigNumber => $kaikas.bigNumber(value).multipliedBy($kaikas.bigNumber(0.1).exponentiatedBy(decimals))

export const toWei = (value: BigNumber | string | number, decimals = 18) => $kaikas.bigNumber(value).multipliedBy($kaikas.bigNumber(10).exponentiatedBy(decimals)).toFixed(0)
