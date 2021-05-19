import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import {
  APIResponse,
  ResponseStatusCode,
  ResponseMessage,
} from "./v1/constructure";

function sendDenieResponse(
  res: Response,
  statsuCode: ResponseStatusCode,
  message: ResponseMessage
) {
  const responseObj = new APIResponse(statsuCode, message);
  console.info(responseObj);
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
  if (typeof req.headers.authorization === "undefined") {
    return sendDenieResponse(
      res,
      ResponseStatusCode.accessUnauthorized,
      ResponseMessage.noApiKeyFound
    );
  }
  const apiKey = req.headers.authorization;
  const user = await getUserData(apiKey);
  if (!user) {
    return sendDenieResponse(
      res,
      ResponseStatusCode.accessUnauthorized,
      ResponseMessage.invalidApiKey
    );
  }
  console.info("Authorized as " + user);
  next();
}

export = TaApiMiddleWare;
