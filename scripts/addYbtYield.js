const cron = require("node-cron");
const ethers = require("ethers");
const { abi } = require("../abi/stETH.mock.sol/StETH.json");

const ybtAbi = abi;

async function addYbtYield(wallet, ybts) {
  try {
    let currentNonce = await wallet.getNonce();

    ybts.map((ybt) => {
      const address = ybt.address;

      const contract = new ethers.Contract(address, ybtAbi, wallet);
      contract.addInterest({ nonce: currentNonce });

      currentNonce++;
    });
  } catch (error) {
    console.log(error);
  }
}

async function scheduleAddYbtYieldCronjob(wallet, ybts) {
  cron.schedule("*/5 * * * *", () => {
    console.log("Adding Interest to the YBTs");
    addYbtYield(wallet, ybts);
  });
}

module.exports = { scheduleAddYbtYieldCronjob };
