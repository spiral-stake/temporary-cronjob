const cron = require("node-cron");
const ethers = require("ethers");
const { abi } = require("../abi/stETH.mock.sol/StETH.json");

const ybtAbi = abi;

async function addYbtYield(wallet, ybts) {
  let currentNonce = await wallet.getNonce();

  ybts.map((ybt) => {
    const address = ybt.address;

    const contract = new ethers.Contract(address, ybtAbi, wallet);
    contract.addInterest({ nonce: currentNonce });

    currentNonce++;
  });
}

async function scheduleAddYbtYieldCronjob(wallet, ybts) {
  cron.schedule("*/5 * * * *", () => {
    console.log("Adding Interest to the YBTs");
    try {
      addYbtYield(wallet, ybts);
    } catch (error) {
      console.log(error, "Error adding YBT Yield");
    }
  });
}

module.exports = { scheduleAddYbtYieldCronjob };
