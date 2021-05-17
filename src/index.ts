import express, { Application } from "express";
import config from "./config";

const app: Application = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Success!");
});
app.listen(config.appPort);
