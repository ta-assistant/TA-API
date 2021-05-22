import { API, APIMethod } from "./v1/constructure";
import getWorkDraftApi from "./v1/WorkManagementApi/getWorkDraftApi";
import submitScoreApi from "./v1/WorkManagementApi/submitScoreApi";

interface apiDetail {
  name: string;
  path: string;
  apiObject: API;
  apiMethod: APIMethod;
}

interface apisList {
  [key: string]: Array<apiDetail>;
}

export = {
  v1: [
    {
      name: "getWorkDraft",
      path: "workManagement/:workId/getWorkDraft/",
      apiObject: getWorkDraftApi,
      apiMethod: APIMethod.GET,
    },
    {
      name: "submitScores",
      path: "workManagement/:workId/submitScores/",
      apiObject: submitScoreApi,
      apiMethod: APIMethod.POST,
    },
  ],
} as apisList;
