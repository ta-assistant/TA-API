import { Request, response, Response } from "express";
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

  sendResponse(res: Response, responseObj: APIResponse) {
    console.info(responseObj);
    return res.status(responseObj.statusCode).send(responseObj);
  }
}

interface RequestValidationResult {
  isSuccess: boolean;
  reason?: any;
}

export interface APIResponse {
  statusCode: ResponseStatusCode;
  message: string;
  [key: string]: any;
}

export enum ResponseStatusCode {
  success = 200,
  badRequest = 400,
  accessUnauthorized = 401,
  internalServerError = 500,
}

export enum ResponseMessage {
  noApiKeyFound = "The API Key was no found in your request. Access Denied.",
  invalidApiKey = "The API Key in your request is invalid, Access Denied.",
  invalidRequest = "This request is invalid. Please check the request body if it follow the API requirement",
}

export enum APIMethod {
  GET,
  POST,
}
