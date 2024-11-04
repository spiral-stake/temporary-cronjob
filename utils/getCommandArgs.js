const { Command } = require("commander");

exports.getCommandArgs = () => {
  program = new Command();

  program
    .option("-p, --port <number>", "Port number")
    .option("--rpcUrl <url>", "RPC URL")
    .option("--chain <number>", "Chain id");

  program.parse(process.argv);

  return program.opts();
};
