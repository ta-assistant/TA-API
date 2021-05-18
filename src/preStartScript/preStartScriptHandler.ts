import BetterLog from "./betterLog";
import { PreStartScript } from "./constructure";
import InitFirebaseAdmin from "./initFirebaseAdmin";

class PreStartScriptHandler {
  private _scriptArray: Array<any>;
  constructor() {
    this._scriptArray = [];
  }
  addPreStartScript(scriptObj: PreStartScript) {
    this._scriptArray.push(scriptObj);
  }
  run() {
    // Call Better Log PreStartScript Seperately
    // Due to the forEach need the `.debug()` method
    this.startBetterLog();

    // Loop calling the PreStartScripts
    this._scriptArray.forEach((script) => {
      console.debug(
        "[PreStartScript] Calling the `" +
          script.scriptName +
          "` PreStartScript"
      );
      script.runScript();
      console.debug(
        "[PreStartScript] Executed the `" +
          script.scriptName +
          "` PreStartScript"
      );
    });
    console.info("Successfully to execute all PreStartScript.");
  }

  private startBetterLog() {
    const betterLog = new BetterLog();
    betterLog.runScript();
  }
}

// Init object PreStartScriptHandler
let preStartScriptHandler: PreStartScriptHandler = new PreStartScriptHandler();

// Add the PreStartScript
preStartScriptHandler.addPreStartScript(new InitFirebaseAdmin());

// Export it to be call in the server starting process
export = preStartScriptHandler;
