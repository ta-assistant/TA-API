import { API, APIResponse, ResponseMessage } from "./constructure";
import { Request, Response } from "express";
import { ResponseStatusCode } from "./constructure";
import { Rules } from "validatorjs";
import admin from "firebase-admin";

/**
 * Example request:
 *
 * curl -v -X POST {PREFIX}/v1/getWorkDraft \
 *   -H 'Authorization: Bearer {channel access token}' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *          'workId': "String"
 *       }
 *
 * Example Success Response:
 *
 * {
 *    "statusCode": 200,
 *    "message": "Success",
 *    "workDraft" : {
 *              ....
 *              ....
 *          }
 * }
 */
class GetWorkDraftApi extends API {
  requestStructure: Rules = {
    workId: "required|string",
  };

  async apiHandler(req: Request, res: Response) {
    let validateStructure = this.validateRequestStructure(req);
    if (!validateStructure.isSuccess) {
      return this.sendResponse(
        req,
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

    console.info("Requesting access to workDraft for workId: " + workId);

    // Check if workId is exists.
    return this.checkworkIdExist(firestore, workId)
      .then((workDoc) => {
        // Check user permission.
        return this.checkWorkAccessingPermission(
          firestore,
          workDoc.classroomId,
          userId
        );
      })
      .then(() => {
        // Get workDraft.
        return this.getWorkDraft(firestore, workId);
      })
      .then((workDraftData) => {
        // Send response.
        return this.sendResponse(
          req,
          res,
          ResponseStatusCode.success,
          ResponseMessage.success,
          { workDraft: workDraftData }
        );
      })
      .catch((e) => {
        // In case, There is an error
        // Check for isExpectedThrown to determine
        // if this is the predicted error
        if (e.isExpectedThrown) {
          return this.sendResponse(
            req,
            res,
            e.statusCode,
            e.message,
            e.errorDetails
          );
        }

        // In case Unknown error.
        console.error(e);
        return this.sendResponse(
          req,
          res,
          ResponseStatusCode.internalServerError,
          ResponseMessage.unknownError
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
      console.debug("Work Document not found");
      throw {
        statusCode: ResponseStatusCode.badRequest,
        message: GetWorkDraftApiResponseMessage.workIdNotFound,
        isExpectedThrown: true,
      } as APIResponse;
    }
    console.debug("Work Document found");
    if (typeof workDoc.data()?.classroomId === "undefined") {
      let errorMessage = "The classroomId of this work is empty.";
      console.error(errorMessage);
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: GetWorkDraftApiResponseMessage.workBroken,
        isExpectedThrown: true,
        errorDetails: {
          errorDetails: errorMessage,
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
      console.info("User don't have permission to access this work");
      throw {
        statusCode: ResponseStatusCode.forbidden,
        message: GetWorkDraftApiResponseMessage.insufficientPermission,
        isExpectedThrown: true,
      } as APIResponse;
    }
    console.debug("User have permission to access this work");
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
    console.debug("Requested work Draft: " + JSON.stringify(workDraft.data()));
    if (!workDraft.exists) {
      console.debug("The work draft document doesn't exists");
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: GetWorkDraftApiResponseMessage.workBroken,
        isExpectedThrown: true,
      } as APIResponse;
    }
    return workDraft.data();
  }
}

enum GetWorkDraftApiResponseMessage {
  workIdNotFound = "The workId you specified was not found.",
  insufficientPermission = "You don't have permission to access this work.",
  workBroken = "The work structure in the server is broken. Contact the administrator to resolve this ASAP.",
}

export = new GetWorkDraftApi();
