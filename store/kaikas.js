export const state = () => ({
  address: null,
  isNotInstalled: !process.server && typeof window?.klaytn === "undefined",
});

export const mutations = {
  CONNECT_KAIKAS(state, address) {
    state.address = address;
  },
};
