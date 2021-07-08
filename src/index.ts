import { expressMiddleware } from "better-logging";
import express, { Application, NextFunction, Request, Response } from "express";
import config from "./config";
import preStartScriptHandler from "./preStartScript/preStartScriptHandler";
import TaApiMiddleWare from "./API/middleWare";
import {
  APIMethod,
  ResponseMessage,
  ResponseStatusCode,
} from "./API/v1/constructure";
import apisList from "./API/apisList";

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

// Extract all apis list from the apisList Config file.
console.info("Extracting all apis from the apisList.ts config file");
Object.keys(apisList).forEach((apiVersion) => {
  console.debug(`=> ${apiVersion} apis`);
  apisList[apiVersion].forEach((apisListElement) => {
    let apiPath: string = `/${apiVersion}/${apisListElement.path}`;
    console.debug(` |-> ${apisListElement.name}`);
    console.debug(` | |- Path : ${apiPath}`);
    console.debug(` | |- Method : ${apisListElement.apiMethod}`);

    if (apisListElement.apiMethod === APIMethod.GET) {
      app.get(apiPath, (req, res) => {
        apisListElement.apiObject.apiHandler(req, res);
      });
    }
    if (apisListElement.apiMethod === APIMethod.POST) {
      app.post(apiPath, (req, res) => {
        apisListElement.apiObject.apiHandler(req, res);
      });
    }
  });
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
