export const state = () => ({
  address: null,
  isNotInstalled: !process.server && typeof window?.klaytn === 'undefined',
})

export const mutations = {
  CONNECT_KAIKAS(state, address) {
    state.address = address
  }
}

export const actions = {
  async connect({commit}) {
    if (process.server || typeof window?.klaytn === 'undefined') {
      return
    }

    const address = this.$kaikas.connectKaikas

    commit('CONNECT_KAIKAS', address)
  },
}
