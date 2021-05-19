import { API, APIResponse, ResponseMessage } from "./constructure";
import { Request, Response } from "express";
import { ResponseStatusCode } from "./constructure";
import { Rules } from "validatorjs";
import admin from "firebase-admin";

class GetJobDraftApi extends API {
  requestStructure: Rules = {
    jobId: "required|string",
  };

  async apiHandler(req: Request, res: Response) {
    let validateStructure = this.validateRequestStructure(req);
    if (!validateStructure.isSuccess) {
      return this.sendResponse(
        res,
        ResponseStatusCode.badRequest,
        ResponseMessage.invalidRequest,
        {
          errors: validateStructure.reason.errors,
        }
      );
    }
    const firestore = admin.firestore();
    let userId: string = req.headers.userId as string;
    let workDoc: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(req.body.jobId)
      .get();
    if (!workDoc.exists) {
      return this.sendResponse(
        res,
        ResponseStatusCode.badRequest,
        GetJobDraftApiResponseMessage.jobIdNotFound
      );
    }

    let classroomTeacher: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Classrooms")
      .doc(workDoc.data()?.classroomId)
      .collection("teachers")
      .doc(userId)
      .get();

    if (!classroomTeacher.exists) {
      return this.sendResponse(
        res,
        ResponseStatusCode.forbidden,
        GetJobDraftApiResponseMessage.insufficientPermission
      );
    }

    let jobDraft: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(req.body.jobId)
      .collection("jobDraft")
      .doc("draft")
      .get();

    if (!jobDraft.exists) {
      return this.sendResponse(
        res,
        ResponseStatusCode.internalServerError,
        GetJobDraftApiResponseMessage.jobBroken
      );
    }
    return this.sendResponse(
      res,
      ResponseStatusCode.success,
      ResponseMessage.success,
      {
        jobDraft: jobDraft.data(),
      }
    );
  }
}

enum GetJobDraftApiResponseMessage {
  jobIdNotFound = "The jobId you specified was not found.",
  insufficientPermission = "You don't have permission to access this job.",
  jobBroken = "The job structure in the server is broken. Contact the administrator to resolve this ASAP.",
}

export = new GetJobDraftApi();
