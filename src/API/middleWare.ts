import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { APIResponse } from "./v1/constructure";
import { ResponseStatusCode, ResponseMessage } from "./v1/constructure";

function sendDenieResponse(
  req: Request,
  res: Response,
  statsuCode: ResponseStatusCode,
  message: ResponseMessage
) {
  const responseObj: APIResponse = {
    statusCode: statsuCode,
    message: message,
    requestId: req.headers.requestId as string,
  };
  console.info("Response: " + JSON.stringify(responseObj));
  return res.status(statsuCode).send(responseObj);
}

async function getUserData(apiKey: string) {
  const firestore = admin.firestore();
  let userCredentails: FirebaseFirestore.QuerySnapshot = await firestore
    .collection("Users")
    .where("apiKey", "==", apiKey)
    .get();
  if (userCredentails.size !== 1) {
    return false;
  }
  return userCredentails.docs[0].data().userId;
}

/**
 * This Function is the Express Middleware function to check the permission
 * of the request
 *
 * @param req Request Object
 * @param res Response Object
 * @param next Next Function
 */
async function TaApiMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.info("[Request Headers] " + JSON.stringify(req.headers));
  console.info("[Request Body] " + JSON.stringify(req.body));
  if (typeof req.headers.authorization === "undefined") {
    return sendDenieResponse(
      req,
      res,
      ResponseStatusCode.accessUnauthorized,
      ResponseMessage.noApiKeyFound
    );
  }
  if (req.headers["content-type"] !== "application/json") {
    return sendDenieResponse(
      req,
      res,
      ResponseStatusCode.badRequest,
      ResponseMessage.jsonOnly
    );
  }
  const apiKey = req.headers.authorization;
  const user = await getUserData(apiKey);
  if (!user) {
    return sendDenieResponse(
      req,
      res,
      ResponseStatusCode.accessUnauthorized,
      ResponseMessage.invalidApiKey
    );
  }
  req.headers.userId = user;
  req.headers.requestId =
    Date.now().toString() + "-" + Math.random().toString(36).substring(2, 5);
  console.info("Authorized as " + user);
  console.info("requestId: " + req.headers.requestId);
  next();
}

export = TaApiMiddleWare;
