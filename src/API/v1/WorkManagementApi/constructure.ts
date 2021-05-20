import { API, APIResponse, ResponseMessage } from "../constructure";
import { ResponseStatusCode } from "../constructure";
import { Request, Response } from "express";

export abstract class WorkManagementApi extends API {
  async checkworkIdExist(
    firestore: FirebaseFirestore.Firestore,
    workId: string
  ) {
    let workDoc: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(workId)
      .get();
    if (!workDoc.exists) {
      console.debug("Work Document not found");
      throw {
        statusCode: ResponseStatusCode.badRequest,
        message: WorkManagementApiResponseMessage.workIdNotFound,
        isExpectedThrown: true,
      } as APIResponse;
    }
    console.debug("Work Document found");
    if (typeof workDoc.data()?.classroomId === "undefined") {
      let errorMessage = "The classroomId of this work is empty.";
      console.error(errorMessage);
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: WorkManagementApiResponseMessage.workBroken,
        isExpectedThrown: true,
        reasons: {
          reasons: errorMessage,
        },
      } as APIResponse;
    }
    return workDoc.data() as FirebaseFirestore.DocumentData;
  }

  promiseChainOnCrashHandler(e: any, req: Request, res: Response) {
    // In case, There is an error
    // Check for isExpectedThrown to determine
    // if this is the predicted error
    if (e.isExpectedThrown) {
      return this.sendResponse(req, res, e.statusCode, e.message, e.reasons);
    }
    // In case Unknown error.
    console.error(e);
    return this.sendResponse(
      req,
      res,
      ResponseStatusCode.internalServerError,
      ResponseMessage.unknownError
    );
  }
}

export enum WorkManagementApiResponseMessage {
  workIdNotFound = "The workId you specified was not found.",
  insufficientPermission = "You don't have permission to access this work.",
  workBroken = "The work structure in the server is broken. Contact the administrator to resolve this ASAP.",
}
