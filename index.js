require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  getInitialPoolsAndScheduleCronjob,
  getSpiralPool,
  scheduleCronjob,
} = require("./scripts/pickCycleWinner");
const { ethers } = require("ethers");
const { scheduleAddYbtYieldCronjob } = require("./scripts/addYbtYield");
const { getCommandArgs } = require("./utils/getCommandArgs");
const { onboard } = require("./scripts/onboard");
const { getTokens } = require("./utils/getTokens");
const { corsOption } = require("./config/cors");
const { abi: poolFactoryAbi } = require("./abi/SpiralPoolFactory.sol/SpiralPoolFactory.json");
const { abi: delayedRNGAbi } = require("./abi/DelayedRNG.sol/DelayedRNG.json");

const app = express();
const { port, rpcUrl, chain, privateKey } = getCommandArgs();
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const addresses = require(`./addresses/${chain}.json`);
const { spiralPoolFactory: spiralPoolFactoryAddress, delayedRNG: delayedRNGAddress } = addresses;
const { ybts, baseTokens } = getTokens(addresses);

const spiralPoolFactory = new ethers.Contract(spiralPoolFactoryAddress, poolFactoryAbi, wallet);
const delayedRNG = delayedRNGAddress
  ? new ethers.Contract(delayedRNGAddress, delayedRNGAbi, wallet)
  : null;

app.use(cors(corsOption));
app.use(express.json());

app.post("/schedule-pool-cronjob", async (req, res) => {
  const { poolAddress } = req.body;

  try {
    const pool = await getSpiralPool(wallet, poolAddress);
    scheduleCronjob(pool, delayedRNG);
    res.send(`Cronjob scheduled for ${poolAddress}`);
  } catch (error) {
    console.error("Error scheduling cron job:", error);
    res.status(500).send("Failed to schedule cron job.");
  }
});

app.post("/onboard", async (req, res) => {
  const { userAddress, amountNative, amountYbt, amountBase } = req.body;
  await onboard(wallet, ybts, baseTokens, userAddress, amountNative, amountYbt, amountBase);

  res.status(200).send("Onboarding successful");
});

app.listen(port, async () => {
  getInitialPoolsAndScheduleCronjob(wallet, spiralPoolFactory, baseTokens, delayedRNG);
  scheduleAddYbtYieldCronjob(wallet, ybts);

  console.log(`Server running on port ${port}`);
});
