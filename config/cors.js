exports.corsOption = {
  origin: (origin, callback) => {
    if (!origin || ["http://localhost:5173", "https://spiralstake.xyz"].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
