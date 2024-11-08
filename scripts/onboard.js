const { ethers } = require("ethers");
const transferAbi = ["function transfer(address to, uint256 amount) public returns (bool)"];

exports.onboard = async function (
  wallet,
  ybts,
  baseTokens,
  userAddress,
  amountNative,
  amountYbt,
  amountBase
) {
  try {
    let currentNonce = await wallet.getNonce();

    const nativeTxPromise = wallet
      .sendTransaction({
        to: userAddress,
        value: ethers.parseEther(amountNative),
        nonce: currentNonce,
      })
      .then((tx) => tx.wait(1)); // Wait for 1 confirmation
    currentNonce++;

    const ybtTransferPromises = ybts.map((ybt) => {
      const tokenContract = new ethers.Contract(ybt.address, transferAbi, wallet);
      const amount = ethers.parseUnits(amountYbt, parseInt(ybt.decimals));
      const txPromise = tokenContract.transfer(userAddress, amount, { nonce: currentNonce });
      currentNonce++;
      return txPromise.then((tx) => tx.wait(1)); // Wait for 1 confirmation
    });

    const baseTokenTransferPromises = baseTokens.map((baseToken) => {
      const tokenContract = new ethers.Contract(baseToken.address, transferAbi, wallet);
      const amount = ethers.parseUnits(amountBase, parseInt(baseToken.decimals));
      const txPromise = tokenContract.transfer(userAddress, amount, { nonce: currentNonce });
      currentNonce++;
      return txPromise.then((tx) => tx.wait(1)); // Wait for 1 confirmation
    });

    // Wait for all transactions to complete and confirm
    await Promise.all([nativeTxPromise, ...ybtTransferPromises, ...baseTokenTransferPromises]);
  } catch (error) {
    console.log(error);
  }
};
