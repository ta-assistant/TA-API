import { expressMiddleware } from "better-logging";
import express, { Application } from "express";
import config from "./config";
import preStartScript from "./preStartScript/preStartScript";

const app: Application = express();

// Run preStartScript
preStartScript();

// Middleware Setup
// Use the bodyParser middleware to parse the JSON request
app.use(express.json());
// Use the better-logging expressMiddleWare to log the incomming request
app.use(expressMiddleware(console));

app.get("/", (req, res) => {
  res.send("Success!");
});

// Start the server on the configured port
app
  .listen(config.appPort, () => {
    console.info("Successfully to start the server on port " + config.appPort);
  })
  .on("error", (e) => {
    console.error("Failed to start the server (" + e.message + ")");
  });
