const cron = require("node-cron");
const ethers = require("ethers");
const { abi } = require("../abi/stETH.mock.sol/StETH.json");

const ybtAbi = abi;

async function addYbtYield(wallet, ybts) {
  for (let i = 0; i < ybts.length; i++) {
    const address = ybts[i].address;
    try {
      const contract = new ethers.Contract(address, ybtAbi, wallet);
      const estimatedGas = await contract.addInterest.estimateGas();

      if (estimatedGas.toString() === "0") {
        console.error(`Gas estimation failed for contract at index ${i}, address: ${address}`);
        continue;
      }

      const tx = await contract.addInterest({ gasLimit: estimatedGas });
      await tx.wait();
    } catch (error) {
      console.log(error);
    }
  }
}

async function scheduleAddYbtYieldCronjob(wallet, ybts) {
  cron.schedule("*/5 * * * *", () => {
    console.log("Adding Interest to the YBTs");
    addYbtYield(wallet, ybts);
  });
}

module.exports = { scheduleAddYbtYieldCronjob };
