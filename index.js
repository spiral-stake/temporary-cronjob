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

const app = express();
const { port, rpcUrl, chain } = getCommandArgs();
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const { spiralPoolFactory } = require(`../v1-core/addresses/${chain}.json`);
const { underlying } = require(`../v1-core/addresses/${chain}.json`);
const { YBTs } = require(`../v1-core/addresses/${chain}.json`);
const ybtAddresses = Object.values(YBTs);

app.use(cors());
app.use(express.json());

app.post("/schedule-pool-cronjob", async (req, res) => {
  const { poolAddress } = req.body;

  try {
    const pool = await getSpiralPool(wallet, poolAddress);
    scheduleCronjob(pool);
    res.send(`Cronjob scheduled for ${poolAddress}`);
  } catch (error) {
    console.error("Error scheduling cron job:", error);
    res.status(500).send("Failed to schedule cron job.");
  }
});

app.listen(port, async () => {
  getInitialPoolsAndScheduleCronjob(wallet, spiralPoolFactory, underlying);
  // scheduleAddYbtYieldCronjob(wallet, ybtAddresses); need to un-comment

  console.log(`Server running on port ${port}`);
});
