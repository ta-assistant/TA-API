import { API, APIResponse, ResponseMessage } from "./constructure";
import { Request, Response } from "express";
import { ResponseStatusCode } from "./constructure";
import { Rules } from "validatorjs";

class GetJobDraftApi extends API {
  requestStructure: Rules = {
    jobId: "required|string",
  };

  async apiHandler(req: Request, res: Response) {
    let validateStructure = this.validateRequestStructure(req);
    if (!validateStructure.isSuccess) {
      let responseObj: APIResponse = {
        statusCode: ResponseStatusCode.badRequest,
        message: ResponseMessage.invalidRequest,
        errors: validateStructure.reason.errors,
      };
      return this.sendResponse(res, responseObj);
    }
    res.send("Success");
  }

  private getJobDraft() {}
}

export = new GetJobDraftApi();
