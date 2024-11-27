async function retryTransaction(asyncFunction, retries = 5, delayMs = 1000) {
  try {
    return await asyncFunction(); // Attempt the transaction
  } catch (error) {
    console.log("retrying", error);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs)); // Delay before retry
      return retryTransaction(asyncFunction, retries - 1, delayMs); // Retry recursively
    }
    throw error; // Throw error after exhausting retries
  }
}
