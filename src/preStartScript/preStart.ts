import betterLog from "./betterLog";

/**
 * This function contain the script which will be called before the server start
 */
function preStartScript() {
  betterLog();
  console.debug("Successfully to run the preStartScript");
}

export = preStartScript;
