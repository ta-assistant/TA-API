import { Request, Response } from "express";

export abstract class API {
  abstract apiHandler(req: Request, res: Response): void;
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
