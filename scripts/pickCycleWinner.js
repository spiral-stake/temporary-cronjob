const cron = require("node-cron");
const ethers = require("ethers");
const { abi: spiralPoolAbi } = require("../abi/SpiralPool.sol/SpiralPool.json");
const { getCronTime } = require("../utils/getCronTime");
const { sendRandomTxn } = require("../utils/sendRandomTxn");

async function getInitialPoolsAndScheduleCronjob(
  wallet,
  spiralPoolFactory,
  baseTokens,
  delayedRNG
) {
  for (let baseToken of baseTokens) {
    const spiralPoolAddresses = await spiralPoolFactory.getSpiralPoolsForBaseToken(
      baseToken.address
    );

    const spiralPools = await Promise.all(
      spiralPoolAddresses.map(async (poolAddress) => {
        return await getSpiralPool(wallet, poolAddress); // Corrected the async return
      })
    );

    spiralPools.forEach((pool) => {
      scheduleCronjob(pool, delayedRNG);
    });
  }
}

async function getSpiralPool(wallet, poolAddress) {
  const spiralPoolContract = new ethers.Contract(poolAddress, spiralPoolAbi, wallet);

  const [startTime, totalCycles, cycleDuration, cycleDepositDuration] = await Promise.all([
    spiralPoolContract.getStartTime(),
    spiralPoolContract.getTotalCycles(),
    spiralPoolContract.getCycleDuration(),
    spiralPoolContract.getCycleDepositDuration(),
  ]);

  return {
    contract: spiralPoolContract,
    address: poolAddress,
    startTime: parseInt(startTime) + 5,
    totalCycles: parseInt(totalCycles),
    cycleDuration: parseInt(cycleDuration),
    cycleDepositDuration: parseInt(cycleDepositDuration),
    requiredPositions: parseInt(totalCycles),
  };
}

async function scheduleCronjob(pool, delayedRNG) {
  if (Date.now() < pool.startTime * 1000) {
    const cronTime = getCronTime(pool.startTime);
    cron.schedule(cronTime, async () => {
      const positionsFilled = parseInt(await pool.contract.getPositionsFilled());
      if (positionsFilled === pool.requiredPositions) {
        _schedulePickCycleWinner(pool, delayedRNG);
      }
    });

    console.log(`Scheduled start time pool check at ${cronTime}`);
  } else {
    const positionsFilled = parseInt(await pool.contract.getPositionsFilled());
    if (positionsFilled === pool.requiredPositions) {
      _schedulePickCycleWinner(pool, delayedRNG);
    }

    console.log("Pool start time has already elapsed. Scheduled immediately.");
  }
}

async function _schedulePickCycleWinner(pool, delayedRNG) {
  for (let i = 0; i < pool.totalCycles; i++) {
    const cycleTime = pool.startTime + pool.cycleDepositDuration + i * pool.cycleDuration;

    if (Date.now() < cycleTime * 1000) {
      const cycleCronTime = getCronTime(cycleTime);

      cron.schedule(cycleCronTime, async () => {
        console.log(`Pinging ${pool.address} at cycle - ${i + 1}`);
        const tx = await pool.contract.requestCycleWinner({ value: ethers.parseEther("0.001") });

        if (delayedRNG) {
          sendRandomTxn(); // Don't remove, essential for local
          const receipt = await tx.wait(2); // This needs to change (be varying)

          const requestId = receipt.logs.find(
            (log) => log.fragment?.name === "RequestedCycleWinner"
          )?.args[0];

          await delayedRNG.fulfillRandomWords(requestId, { gasLimit: 500000 });
        }
      });

      console.log(`Scheduled ping pick winner at ${cycleCronTime}`);
    }
  }
}

module.exports = {
  getInitialPoolsAndScheduleCronjob,
  getSpiralPool,
  scheduleCronjob,
};
