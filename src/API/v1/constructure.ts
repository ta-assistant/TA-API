import { Request, Response } from "express";

export abstract class API {
  abstract apiHandler(req: Request, res: Response): void;
}

export class APIResponse {
  statusCode: ResponseStatusCode;
  message: string;

  constructor(statusCode: number, message: string) {
    this.statusCode = statusCode;
    this.message = message;
  }
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
}

export enum APIMethod {
  GET,
  POST,
}
