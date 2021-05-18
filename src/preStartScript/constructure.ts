export abstract class PreStartScript {
  scriptName: String;

  constructor(scriptName: String) {
    this.scriptName = scriptName;
  }
  abstract runScript(): void;
}
