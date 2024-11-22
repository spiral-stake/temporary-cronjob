exports.getTokens = (data) => {
  const ybts = [];
  const baseTokens = [];

  Object.keys(data.baseTokens).forEach((baseTokenKey) => {
    const baseToken = data.baseTokens[baseTokenKey];

    baseTokens.push(baseToken);

    Object.keys(baseToken.YBTs).forEach((ybtKey) => {
      const ybt = baseToken.YBTs[ybtKey];
      ybts.push(ybt);
    });
  });

  return { ybts, baseTokens };
};
