import routerABI from "~/utils/smartcontracts/router.json";
import factoryABI from "~/utils/smartcontracts/factory.json";
import wethABI from "~/utils/smartcontracts/weth.json";

class Config {
  address = null;
  routerAddress = "0xB0B695584234F2CC16266588b2b951F3d2885705";
  factoryAddress = "0xEB487a3A623E25cAa668B6D199F1aBa9D2380456";
  wethAddress = "0xae3a8a1D877a446b22249D8676AFeB16F056B44e";
  routerContract = null;
  factoryContract = null;
  wethContract = null;
  caver = null;

  constructor() {
    this.connectKaikas();
    console.log('CONFIG constructor')
  }

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

    this.wethContract = new caver.klay.Contract(wethABI.abi, this.wethAddress);
    this.caver = caver;
    return addresses[0];
  }
}

const config = new Config()

export default config
