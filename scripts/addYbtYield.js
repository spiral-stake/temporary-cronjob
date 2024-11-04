const cron = require("node-cron");
const ethers = require("ethers");
const { abi } = require("../../v1-core/out/stETH.mock.sol/StETH.json");

const ybtAbi = abi;

async function addYbtYield(wallet, ybtAddresses) {
  for (let i = 0; i < ybtAddresses.length; i++) {
    const address = ybtAddresses[i];
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

async function scheduleAddYbtYieldCronjob(wallet, ybtAddresses) {
  cron.schedule("*/30 * * * * *", () => {
    console.log("Adding Interest to the YBTs");
    addYbtYield(wallet, ybtAddresses);
  });
}

module.exports = { scheduleAddYbtYieldCronjob };
