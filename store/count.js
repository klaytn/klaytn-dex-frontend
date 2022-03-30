export const state = () => ({
  count: 0
})

export const mutations = {
  plus(state) {
    state.count = state.count + 1
  },
  minus(state) {
    state.count = state.count - 1
  },
}
