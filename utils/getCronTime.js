exports.getCronTime = (timeInSeconds) => {
  const time = timeInSeconds * 1000;
  const localDate = new Date(time);

  // Convert to local time components
  const seconds = localDate.getSeconds();
  const minutes = localDate.getMinutes();
  const hours = localDate.getHours();
  const dayOfMonth = localDate.getDate();
  const month = localDate.getMonth() + 1;

  // Construct cron expression for the local time
  return `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} *`;
};
