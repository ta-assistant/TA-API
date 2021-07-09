import { Request, Response } from "express";
import Validator, { Rules } from "validatorjs";

export abstract class API {
  abstract requestStructure: Rules;

  abstract apiHandler(req: Request, res: Response): void;

  validateRequestStructure(req: Request): RequestValidationResult {
    let validation = new Validator(req.body, this.requestStructure);
    if (validation.fails()) {
      return {
        isSuccess: false,
        reason: validation.errors,
      };
    }
    return {
      isSuccess: true,
    };
  }

  /**
   * This function is used to send the response to the caller
   * @param res Response Object
   * @param statusCode StatusCode you want to send response
   * @param message Message you want to send response
   * @param extendedObject Optional. The other object that will be send in the request
   */
  sendResponse(
    req: Request,
    res: Response,
    statusCode: number,
    message: string,
    extendedObject?: object
  ) {
    const packageJson = require("../../../package.json");
    let responseObj: APIResponse = {
      statusCode: statusCode,
      message: message,
      requestId: req.headers.requestId as string,
    };
    if (typeof extendedObject === "object") {
      responseObj = Object.assign(responseObj, extendedObject);
    }
    console.info("Response: " + JSON.stringify(responseObj));
    res.set({
      TaApiVersion: packageJson.version,
    });
    return res.status(responseObj.statusCode).send(responseObj);
  }
}

export enum ResponseStatusCode {
  success = 200,
  badRequest = 400,
  accessUnauthorized = 401,
  forbidden = 403,
  notFound = 404,
  internalServerError = 500,
}

export enum ResponseMessage {
  success = "Success",
  noApiKeyFound = "The API Key was no found in your request. Access Denied.",
  invalidApiKey = "The API Key in your request is invalid, Access Denied.",
  invalidRequest = "This request is invalid. Please check the request body if it follow the API requirement",
  jsonOnly = "TA APIs accept only request with the JSON Body.",
  unknownError = "Unknown error has occurred. Please contact administrator for more information.",
  resourceNotFound = "The resource you requested was not found. Please check the path again",
}

export interface RequestValidationResult {
  isSuccess: boolean;
  reason?: any;
}

export interface APIResponse {
  statusCode: ResponseStatusCode;
  message: string;
  requestId?: string;
  [key: string]: any;
}

export enum APIMethod {
  GET = "GET",
  POST = "POST",
}
