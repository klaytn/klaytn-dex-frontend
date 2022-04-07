export const state = () => ({
  address: null,
  isNotInstalled: !process.server && typeof window?.klaytn === 'undefined'
})

export const mutations = {
  connect(state, p) {
    state.address = p
  }
}

export const actions = {
  async connect({ commit }) {
    if(process.server || typeof window?.klaytn === 'undefined') {
      return
    }

    const { klaytn } = window;

    const addresses = await klaytn.enable();
    commit('connect', addresses[0])
  },
}
