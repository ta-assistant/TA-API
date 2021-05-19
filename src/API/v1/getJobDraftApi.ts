import { API, APIResponse, ResponseMessage } from "./constructure";
import { Request, Response } from "express";
import { ResponseStatusCode } from "./constructure";

class GetJobDraftApi extends API {
  apiHandler(req: Request, res: Response) {}
}

export = new GetJobDraftApi();
