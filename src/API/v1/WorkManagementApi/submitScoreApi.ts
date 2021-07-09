import { API, APIResponse, RequestValidationResult } from "../constructure";
import { ResponseStatusCode, ResponseMessage } from "../constructure";
import Validator, { Rules } from "validatorjs";
import { Request, Response } from "express";
import {
  WorkManagementApi,
  WorkManagementApiResponseMessage,
} from "./constructure";
import admin from "firebase-admin";
import { ScoreElement } from "./types/submitScoreApiTypes";

class SubmitScoreApi extends WorkManagementApi {
  requestStructure: Rules = {
    workDraft: "required",
    scores: "required|array",
  };
  async apiHandler(req: Request, res: Response) {
    let validateRequestResult = this.validateRequestStructure(req);
    if (!validateRequestResult.isSuccess) {
      return this.sendResponse(
        req,
        res,
        ResponseStatusCode.badRequest,
        ResponseMessage.invalidRequest,
        {
          reasons: validateRequestResult.reason,
        }
      );
    }

    let firestore = admin.firestore();
    let workId: string = req.params.workId;
    let userId: string = req.headers.userId as string;
    return this.checkworkIdExist(firestore, workId)
      .then(() => {
        return this.checkWorkAccessPermission(firestore, workId, userId);
      })
      .then(() => {
        return this.checkWorkDraft(firestore, workId, req.body.workDraft);
      })
      .then(() => {
        return this.checkIfDocAlreadyExists(firestore, workId, req);
      })
      .then((existedIDs) => {
        return this.writeScoresToDatabase(
          firestore,
          workId,
          userId,
          req,
          existedIDs
        );
      })
      .then((apiResponse: APIResponse) => {
        return this.sendResponse(
          req,
          res,
          apiResponse.statusCode,
          apiResponse.message,
          {
            existedIDs: apiResponse.existedIDs,
          }
        );
      })
      .catch((e) => {
        return this.promiseChainOnCrashHandler(e, req, res);
      });
  }

  async writeScoresToDatabase(
    firestore: FirebaseFirestore.Firestore,
    workId: string,
    userId: string,
    req: Request,
    existedIDs: Array<string>
  ) {
    let promiseArray: Array<Promise<FirebaseFirestore.WriteResult>> = [];

    req.body.scores.forEach((element: ScoreElement) => {
      if (!existedIDs.includes(element.ID)) {
        let parsedDataObj: any = {};

        for (let elementPositionInWorkDraft in req.body.workDraft.outputDraft) {
          let elementInOutputDraft =
            req.body.workDraft.outputDraft[elementPositionInWorkDraft];
          let value = element[elementInOutputDraft];
          if (["score", "scoreTimestamp"].includes(elementInOutputDraft)) {
            value = parseInt(value);
          }
          parsedDataObj[elementInOutputDraft] = value;
        }
        delete parsedDataObj.ID;
        let setFirestoreDoc = firestore
          .collection("Works")
          .doc(workId)
          .collection("scores")
          .doc(element.ID)
          .set(
            Object.assign(
              { scoredBy: userId, submitTimestamp: Date.now() },
              parsedDataObj
            )
          );
        promiseArray.push(setFirestoreDoc);
      }
    });
    await Promise.all(promiseArray);

    let apiResponse: APIResponse = {
      statusCode: ResponseStatusCode.success,
      message: ResponseMessage.success,
    };
    console.debug("Writed all scores to the database");
    if (existedIDs.length !== 0) {
      apiResponse["existedIDs"] = existedIDs;
    }
    return apiResponse;
  }

  async checkWorkAccessPermission(
    firestore: FirebaseFirestore.Firestore,
    workId: string,
    userId: string
  ) {
    let examinerDoc: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(workId)
      .collection("examiner")
      .doc(userId)
      .get();

    if (!examinerDoc.exists) {
      throw {
        statusCode: ResponseStatusCode.forbidden,
        message: WorkManagementApiResponseMessage.insufficientPermission,
        isExpectedThrown: true,
      } as APIResponse;
    }
    return true;
  }

  async checkWorkDraft(
    firestore: FirebaseFirestore.Firestore,
    workId: string,
    workDraftInRequest: any
  ) {
    let workDraftDocSnap: FirebaseFirestore.DocumentSnapshot = await firestore
      .collection("Works")
      .doc(workId)
      .collection("workDraft")
      .doc("draft")
      .get();

    if (!workDraftDocSnap.exists) {
      console.debug("Work Draft not found in the database");
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: WorkManagementApiResponseMessage.workBroken,
        isExpectedThrown: true,
        reasons: {
          reasons: "The workDraft for this workId is not found",
        },
      } as APIResponse;
    }
    if (typeof workDraftDocSnap.data() === "undefined") {
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: WorkManagementApiResponseMessage.workBroken,
        isExpectedThrown: true,
        reasons: {
          reasons: "The workDraft in the database is undefined",
        },
      } as APIResponse;
    }
    let workDraftInDatabase: any = workDraftDocSnap.data() as object;

    if (!workDraftInDatabase.outputDraft.includes("ID")) {
      throw {
        statusCode: ResponseStatusCode.internalServerError,
        message: WorkManagementApiResponseMessage.workBroken,
        isExpectedThrown: true,
        reasons: {
          reasons:
            "The workDraft must contain `ID`. But the workDraft in the database doesn't.",
        },
      } as APIResponse;
    }

    let unrelatedWorkDraftArray: Array<object> = [];
    Object.keys(workDraftInRequest).forEach(
      (workDraftInRequestElementKey: string) => {
        if (
          !Object.prototype.hasOwnProperty.call(
            workDraftInDatabase,
            workDraftInRequestElementKey
          )
        ) {
          let errorObj: any = {};
          errorObj[workDraftInRequestElementKey] = {
            message: "Property not found in the workDraft in database",
          };
          unrelatedWorkDraftArray.push(errorObj);
          return;
        }

        if (
          JSON.stringify(workDraftInDatabase[workDraftInRequestElementKey]) !==
          JSON.stringify(workDraftInRequest[workDraftInRequestElementKey])
        ) {
          let errorObj: any = {};
          errorObj[workDraftInRequestElementKey] = {
            message: "Value unrelated with the workDraft in database",
            expect: workDraftInDatabase[workDraftInRequestElementKey],
          };
          unrelatedWorkDraftArray.push(errorObj);
        }
      }
    );

    if (unrelatedWorkDraftArray.length !== 0) {
      throw {
        statusCode: ResponseStatusCode.badRequest,
        message: ResponseMessage.invalidRequest,
        isExpectedThrown: true,
        reasons: {
          reasons: {
            unrelatedWorkDraft: unrelatedWorkDraftArray,
          },
        },
      } as APIResponse;
    }
    return true;
  }

  async checkIfDocAlreadyExists(
    firestore: FirebaseFirestore.Firestore,
    workId: string,
    req: Request
  ) {
    console.debug("Checking if any docs already exists");
    let idArray: Array<string> = [];
    req.body.scores.forEach((element: any) => {
      idArray.push(element.ID);
    });

    console.debug("IDArray: " + idArray);

    let promiseArray: Array<Promise<FirebaseFirestore.DocumentSnapshot>> = [];

    idArray.forEach((element) => {
      let getScoreDoc = firestore
        .collection("Works")
        .doc(workId)
        .collection("scores")
        .doc(element)
        .get();
      promiseArray.push(getScoreDoc);
    });

    let resultOfPromises: Array<FirebaseFirestore.DocumentSnapshot> =
      await Promise.all(promiseArray);

    let existedDoc: Array<string> = [];
    for (let elementPosition in resultOfPromises) {
      let element = resultOfPromises[elementPosition];
      if (element.exists) {
        existedDoc.push(element.id);
      }
    }
    console.debug("Existed doc checked: " + existedDoc);
    return existedDoc;
  }

  validateRequestStructure(req: Request): RequestValidationResult {
    let result = super.validateRequestStructure(req);
    if (!result.isSuccess) {
      return result;
    }
    return this.checkScoresElementStructure(req);
  }

  checkScoresElementStructure(req: Request): RequestValidationResult {
    let workDraft = req.body.workDraft;
    let scores: Array<ScoreElement> = req.body.scores;
    let outputDraft: Array<any> = workDraft.outputDraft;
    let failedValidationElement: Array<any> = [];

    let outputDraftRule: Rules = {};

    if (!outputDraft.includes("score")) {
      return {
        isSuccess: false,
        reason: {
          outputDraftPropertyMissing: ["score"],
        },
      } as RequestValidationResult;
    }
    if (!outputDraft.includes("scoreTimestamp")) {
      return {
        isSuccess: false,
        reason: {
          outputDraftPropertyMissing: ["scoreTimestamp"],
        },
      } as RequestValidationResult;
    }

    outputDraft.forEach((element) => {
      outputDraftRule[element] = "required";
      if (["score", "scoreTimestamp"].includes(element)) {
        outputDraftRule[element] += "|numeric";
      }
    });

    console.debug("Output Draft Check Rules" + JSON.stringify(outputDraftRule));
    scores.forEach((scoreElement: ScoreElement, i: number) => {
      let validation = new Validator(scoreElement, outputDraftRule);
      if (validation.fails()) {
        failedValidationElement.push(
          Object.assign({ position: i }, validation.errors)
        );
      }
    });

    if (failedValidationElement.length !== 0) {
      return {
        isSuccess: false,
        reason: {
          scoreElementsValidationFailed: failedValidationElement,
        },
      } as RequestValidationResult;
    }
    return {
      isSuccess: true,
    } as RequestValidationResult;
  }
}

export = new SubmitScoreApi();
