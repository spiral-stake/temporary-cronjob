const { ethers } = require("ethers");
const { getCommandArgs } = require("./getCommandArgs");

const { rpcUrl, privateKey, chain } = getCommandArgs();

exports.sendRandomTxn = async () => {
  if (chain === "31337" || chain === "31338") {
    console.log("Sending random txn on local");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = {
      to: ethers.Wallet.createRandom().address, // Random address
      value: ethers.parseEther("0.00001"),
      gasLimit: 21000,
    };

    await wallet.sendTransaction(tx);
  }
};
