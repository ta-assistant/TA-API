import { API, APIResponse, ResponseMessage } from "./constructure";
import { Request, Response } from "express";
import { ResponseStatusCode } from "./constructure";
import { Rules } from "validatorjs";
import admin from "firebase-admin";

class GetWorkDraftApi extends API {
  requestStructure: Rules = {
    workId: "required|string",
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
    let workId: string = req.body.workId;

    return this.checkworkIdExist(firestore, workId)
      .then((workDoc) => {
        return this.checkWorkAccessingPermission(
          firestore,
          workDoc.classroomId,
          userId
        );
      })
      .then(() => {
        return this.getWorkDraft(firestore, workId);
      })
      .then((workDraftData) => {
        return this.sendResponse(
          res,
          ResponseStatusCode.success,
          ResponseMessage.success,
          { workDraft: workDraftData }
        );
      })
      .catch((e) => {
        if (e.isExpectedThrown) {
          return this.sendResponse(
            res,
            e.statusCode,
            e.message,
            e.errorDetails
          );
        }
        console.error(e);
        return this.sendResponse(
          res,
          ResponseStatusCode.internalServerError,
          ResponseMessage.unknownError,
          {
            requestId: req.headers.requestId,
          }
        );
      });
  }

  private async checkworkIdExist(
    firestore: FirebaseFirestore.Firestore,
    workId: string
  ) {
    let workDoc: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(workId)
      .get();
    if (!workDoc.exists) {
      throw {
        statusCode: ResponseStatusCode.badRequest,
        message: GetWorkDraftApiResponseMessage.workIdNotFound,
        isExpectedThrown: true,
      } as APIResponse;
    }
    if (typeof workDoc.data() === "undefined") {
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: GetWorkDraftApiResponseMessage.workBroken,
        isExpectedThrown: true,
        errorDetails: {
          "Broken Detail": "The Work Document is empty",
        },
      } as APIResponse;
    }
    return workDoc.data() as FirebaseFirestore.DocumentData;
  }

  private async checkWorkAccessingPermission(
    firestore: FirebaseFirestore.Firestore,
    classroomId: string,
    userId: string
  ) {
    let classroomTeacher: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Classrooms")
      .doc(classroomId)
      .collection("teachers")
      .doc(userId)
      .get();

    if (!classroomTeacher.exists) {
      throw {
        statusCode: ResponseStatusCode.forbidden,
        message: GetWorkDraftApiResponseMessage.insufficientPermission,
        isExpectedThrown: true,
      } as APIResponse;
    }
  }

  private async getWorkDraft(
    firestore: FirebaseFirestore.Firestore,
    workId: string
  ) {
    let workDraft: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(workId)
      .collection("workDraft")
      .doc("draft")
      .get();

    if (!workDraft.exists) {
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: GetWorkDraftApiResponseMessage.workBroken,
        isExpectedThrown: true,
      } as APIResponse;
    }
    console.debug(workDraft.data());
    return workDraft.data();
  }
}

enum GetWorkDraftApiResponseMessage {
  workIdNotFound = "The workId you specified was not found.",
  insufficientPermission = "You don't have permission to access this work.",
  workBroken = "The work structure in the server is broken. Contact the administrator to resolve this ASAP.",
}

export = new GetWorkDraftApi();
