import betterLogging from "better-logging";
import chalk from "chalk";
import config from "../config";
import { PreStartScript } from "./constructure";

class BetterLog extends PreStartScript {
  constructor() {
    super("Better Log");
  }

  runScript() {
    betterLogging(console, {
      color: {
        base: chalk.grey,
        type: {
          debug: chalk.greenBright,
          info: chalk.cyanBright,
          log: chalk.whiteBright,
          error: chalk.redBright,
          warn: chalk.yellowBright,
        },
      },
      logLevels: {
        debug: config.debug ? 0 : 10,
        error: 0,
        info: 0,
        log: 0,
        warn: 0,
      },
    });
  }
}

export default BetterLog;
