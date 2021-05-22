import { API, APIResponse } from "../constructure";
import { Request, Response } from "express";
import { ResponseStatusCode, ResponseMessage } from "../constructure";
import { Rules } from "validatorjs";
import admin from "firebase-admin";
import {
  WorkManagementApi,
  WorkManagementApiResponseMessage,
} from "./constructure";

/**
 * Example request:
 *
 * curl -v -X POST {PREFIX}/v1/getWorkDraft/{workId} \
 *   -H 'Authorization: ApiKey' \
 *   -H 'Content-Type: application/json' \
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
class GetWorkDraftApi extends WorkManagementApi {
  requestStructure: Rules = {};

  apiHandler(req: Request, res: Response) {
    if (typeof req.params.workId === "undefined") {
      return this.sendResponse(
        req,
        res,
        ResponseStatusCode.badRequest,
        ResponseMessage.invalidRequest,
        {
          reasons: "No workId in your request",
        }
      );
    }
    const firestore = admin.firestore();
    let userId: string = req.headers.userId as string;
    let workId: string = req.params.workId;

    console.info("Requesting access to workDraft for workId: " + workId);

    // Check if workId is exists.
    return this.checkworkIdExist(firestore, workId)
      .then((workDoc) => {
        // Check user permission.
        return this.checkClassAccessPermission(
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
        return this.promiseChainOnCrashHandler(e, req, res);
      });
  }

  private async checkClassAccessPermission(
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
        message: WorkManagementApiResponseMessage.insufficientPermission,
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
        message: WorkManagementApiResponseMessage.workBroken,
        isExpectedThrown: true,
        reasons: {
          reasons: "The workDraft for this workId is not found",
        },
      } as APIResponse;
    }
    return workDraft.data();
  }
}

export = new GetWorkDraftApi();
