const cron = require("node-cron");
const ethers = require("ethers");
const { abi: spiralPoolAbi } = require("../../v1-core/out/SpiralPool.sol/SpiralPool.json");
const { getCronTime } = require("../utils/getCronTime");
const {
  abi: poolFactoryAbi,
} = require("../../v1-core/out/SpiralPoolFactory.sol/SpiralPoolFactory.json");

async function getInitialPoolsAndScheduleCronjob(wallet, spiralPoolFactoryAddress, underlying) {
  const poolFactoryContract = new ethers.Contract(spiralPoolFactoryAddress, poolFactoryAbi, wallet);

  for (let underlyingToken of Object.values(underlying)) {
    const spiralPoolAddresses = await poolFactoryContract.getSpiralPoolsForBaseToken(
      underlyingToken.address
    );

    const spiralPools = await Promise.all(
      spiralPoolAddresses.map(async (poolAddress) => {
        return await getSpiralPool(wallet, poolAddress); // Corrected the async return
      })
    );

    spiralPools.forEach((pool) => {
      scheduleCronjob(pool);
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

function scheduleCronjob(pool) {
  const cronTime = getCronTime(pool.startTime);

  cron.schedule(cronTime, async () => {
    const positionsFilled = parseInt(await pool.contract.getPositionsFilled());
    if (positionsFilled === pool.requiredPositions) {
      for (let i = 0; i < pool.totalCycles; i++) {
        const cycleCronTime = getCronTime(
          pool.startTime + pool.cycleDepositDuration + i * pool.cycleDuration
        );

        cron.schedule(cycleCronTime, async () => {
          console.log(`Pinging ${pool.address} at cycle - ${i + 1}`);
          try {
            await pool.contract.selectWinnerAndTransferLiquidity();
          } catch (error) {
            // corrected variable name here
            console.log("Error in selectWinnerAndTransferLiquidity:", error);
          }
        });

        console.log(`Scheduled ping pick winner at ${cycleCronTime}`);
      }
    }
  });

  console.log(`Scheduled start time pool check at ${cronTime}`);
}

module.exports = {
  getInitialPoolsAndScheduleCronjob,
  getSpiralPool,
  scheduleCronjob,
};
