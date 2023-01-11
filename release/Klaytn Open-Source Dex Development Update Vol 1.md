# Klaytn Open-Source Dex Development Update Vol.1

Dear Klaytn community,

On behalf of the SORAMITSU team, we would like to thank you for your time testing the Klaytn Open Source Dex infrastructure we developed. The first few weeks of testing have been highly informative and valuable for the team. In a series of updates, we will keep you informed on the progress of the issues raised and feedback provided in the [Dex Github repository](https://github.com/klaytn/klaytn-dex-frontend/issues), based on the severity of the case. There are some issues that were reported by several testers, so we will summarise them in a single issue to save time.

Here are the contents of the [first update](https://github.com/klaytn/klaytn-dex-frontend/pull/178);

- Users reported being unable to remove liquidity from pools or access their funds related to liquidity pool functionality. This issue has now been fixed. [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/24)][[2](https://github.com/klaytn/klaytn-dex-frontend/issues/29)][[3](https://github.com/klaytn/klaytn-dex-frontend/issues/58)][[4](https://github.com/klaytn/klaytn-dex-frontend/issues/59)][[5](https://github.com/klaytn/klaytn-dex-frontend/issues/62)][[6](https://github.com/klaytn/klaytn-dex-frontend/issues/71)][[7](https://github.com/klaytn/klaytn-dex-frontend/issues/95)][[8](https://github.com/klaytn/klaytn-dex-frontend/issues/116)]
- An issue related to transaction exceptions within swaps and liquidity provision and withdrawal was addressed and fixed. [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/45)][[2](https://github.com/klaytn/klaytn-dex-frontend/issues/162)][[3](https://github.com/klaytn/klaytn-dex-frontend/issues/38)][[4](https://github.com/klaytn/klaytn-dex-frontend/issues/81)][[5](https://github.com/klaytn/klaytn-dex-frontend/issues/165)][[6](https://github.com/klaytn/klaytn-dex-frontend/issues/147)]
- We have listened to your input and addressed UI issues regarding adaptive layouts and headers where some users, accessing on mobile devices especially, were unable to access certain buttons within the Dex. [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/35)][[2](https://github.com/klaytn/klaytn-dex-frontend/issues/91)][[3](https://github.com/klaytn/klaytn-dex-frontend/issues/118)][[4](https://github.com/klaytn/klaytn-dex-frontend/issues/132)][[5](https://github.com/klaytn/klaytn-dex-frontend/issues/48)]
- Thanks to keen users, we were able to detect and fix an issue connected to the malicious use of markdown formatting within snapshot.org. [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/66)]
- An issue regarding the wrong calculation of exchange rates in pairs with different decimals was fixed [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/161)]
- The interval to receive updates in a poll was decreased [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/37)]
- Retrieval information about farming pools was fixed [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/103)]
- The process to add liquidity was updated [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/180)]

Other implementations included in this release are;

- Complete transaction history during infinity scrolling has been addressed
- Loading the Dex swap form from a new in-browser session is now possible
- Price formatting for $USD has been updated
- Slippage information was included in the add & remove liquidity forms
- Refactoring has been added to the code, which will make it faster to execute and improve the overall user experience. [[1](https://github.com/klaytn/klaytn-dex-frontend/issues/102)]

We appreciate your ongoing interest and support in the Klaytn Open-Source Dex and we would like to remind you that testing will be ongoing until January 20th, with regular updates released we will continue to inform you of the changes and improvements.

Thank you for your continued support.

**The SORAMITSU Team.**
