import { expressMiddleware } from "better-logging";
import express, { Application, NextFunction, Request, Response } from "express";
import config from "./config";
import preStartScriptHandler from "./preStartScript/preStartScriptHandler";
import TaApiMiddleWare from "./API/middleWare";
import getWorkDraftApi from "./API/v1/WorkManagementApi/getWorkDraftApi";
import submitScoreApi from "./API/v1/WorkManagementApi/submitScoreApi";
import { ResponseMessage, ResponseStatusCode } from "./API/v1/constructure";

const app: Application = express();

// Run preStartScript
preStartScriptHandler.run();

// Middleware Setup
// Use the bodyParser middleware to parse the JSON request
app.use(express.json());

// Check if the bodyParser has failed parsing Request
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.type === "entity.parse.failed") {
    return res.status(ResponseStatusCode.badRequest).send({
      statusCode: ResponseStatusCode.badRequest,
      message: ResponseMessage.invalidRequest,
    });
  }
  next();
});

// Use the better-logging expressMiddleWare to log the incomming request
app.use(expressMiddleware(console));
// Check the request permission with TaApiMiddleWare
app.use(TaApiMiddleWare);

app.get("/", (req, res) => {
  res.send("Success!");
});

app.get("/v1/workManagement/:workId/getWorkDraft/", (req, res) => {
  getWorkDraftApi.apiHandler(req, res);
});
app.post("/v1/workManagement/:workId/submitScore/", (req, res) => {
  submitScoreApi.apiHandler(req, res);
});

// 404-Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(ResponseStatusCode.notFound).send({
    statusCode: ResponseStatusCode.notFound,
    message: ResponseMessage.resourceNotFound,
  });
});

// Start the server on the configured port
app
  .listen(config.appPort, () => {
    console.info("Successfully to start the server on port " + config.appPort);
  })
  .on("error", (e) => {
    console.error("Failed to start the server (" + e.message + ")");
  });
