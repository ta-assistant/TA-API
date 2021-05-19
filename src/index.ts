import { expressMiddleware } from "better-logging";
import express, { Application } from "express";
import config from "./config";
import preStartScriptHandler from "./preStartScript/preStartScriptHandler";
import TaApiMiddleWare from "./API/middleWare";
import getJobDraftApi from "./API/v1/getJobDraftApi";

const app: Application = express();

// Run preStartScript
preStartScriptHandler.run();

// Middleware Setup
// Use the bodyParser middleware to parse the JSON request
app.use(express.json());
// Use the better-logging expressMiddleWare to log the incomming request
app.use(expressMiddleware(console));
// Check the request permission with TaApiMiddleWare
app.use(TaApiMiddleWare);

app.get("/", (req, res) => {
  res.send("Success!");
});

app.get("/v1/getJobDraft", (req, res) => {
  getJobDraftApi.apiHandler(req, res);
});

// Start the server on the configured port
app
  .listen(config.appPort, () => {
    console.info("Successfully to start the server on port " + config.appPort);
  })
  .on("error", (e) => {
    console.error("Failed to start the server (" + e.message + ")");
  });
