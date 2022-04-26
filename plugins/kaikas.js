import routerABI from "../utils/smartcontracts/router.json";
import factoryABI from "../utils/smartcontracts/factory.json";
import wethABI from "../utils/smartcontracts/weth.json";

export default (_, inject) => {
  inject("kaikas", {
    address: null,
    routerAddress: "0xB0B695584234F2CC16266588b2b951F3d2885705",
    factoryAddress: "0xEB487a3A623E25cAa668B6D199F1aBa9D2380456",
    wethAddress: "0xae3a8a1D877a446b22249D8676AFeB16F056B44e",
    routerContract: null,
    factoryContract: null,
    wethContract: null,

    async connectKaikas() {
      if (
        process.server ||
        typeof window?.klaytn === "undefined" ||
        typeof window?.caver === "undefined"
      ) {
        return;
      }

      const { klaytn, caver } = window;

      const addresses = await klaytn.enable();

      this.address = addresses[0];
      this.routerContract = new caver.klay.Contract(
        routerABI.abi,
        this.routerAddress
      );
      this.factoryContract = new caver.klay.Contract(
        factoryABI.abi,
        this.factoryAddress
      );
      this.wethContract = new caver.klay.Contract(
        wethABI.abi,
        this.wethAddress
      );
      return addresses[0];
    },

    createContract(address, abi) {
      const { caver } = window;
      return new caver.klay.Contract(abi, address);
    },

    getFormattedAddress(address) {
      const addressLength = address.length;
      return `${address.slice(2, 6)}...${address.slice(
        addressLength - 6,
        addressLength - 2
      )}`;
    },

    isEmptyAddress(address) {
      return Number(address?.slice(2)) === 0;
    },
  });
};
