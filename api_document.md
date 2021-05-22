# API Document

## Definition

This contain the keywork that you need to know before using the TA API

### apiKey

| Details                                                                                                                    | Type   |
| -------------------------------------------------------------------------------------------------------------------------- | ------ |
| The key that user generated from the TA Website. It is used to authenticate the user before they can access TA environment | string |

### workDraft

| Details                                                                                           | Type |
| ------------------------------------------------------------------------------------------------- | ---- |
| The draft used during scoring process in the TA-CLI. It's required to have `outputDraft` property | JSON |

Example:

```JSON
{
    "outputDraft": [
        "ID",
        "score",
        "comment"
    ],
    "fileDraft": "{ID}_testWork.zip"
}
```

### outputDraft

| Details                                                                                                                     | Type  |
| --------------------------------------------------------------------------------------------------------------------------- | ----- |
| The array of output template that will be used to generated score object. It's required to have `ID` as one of it's element | Array |

---

## Basic Requirement

Before you can call any API in TA APIs you'll need to understand how we authenticate each requests and the structure of the request we required.

### Authentication

In order to call no matter what api is in the v1 API. We required that every requests **must specified the `Authentication` property**
in the request header which contain the [**apiKey**](#apiKey) as its value.

### Request Type

Every APIs in TA APIs **accept ONLY** the request which have the body in the **JSON** structure. So you need to specify the `Content-Type` property
in the request header which its value is **`application/json`**

Example Request:

```bash
$ curl -v -X POST {PREFIX}/v1/workManagement/exampleWork/getWorkDraft \
   -H 'Authorization: {ApiKey}' \
   -H 'Content-Type: application/json' \
   -d '....'
```

---

# API v1 Documents

---

## workManagement API

This is the API that will manage the work in the TA assistant server.

It contain 2 child APIs.

---

### getWorkDraft API

This api is used to get the [`workDraft`](#workDraft) from the TA assistant server.

> This API help the examiner to score the work with the same output so it can be submitted into the TA assistant server.

|        | Details                                                    |
| ------ | ---------------------------------------------------------- |
| Path   | /v1/workManagement/**{workId}**/getWorkDraft               |
| Method | GET                                                        |
| Header | [_(As in the basic requirement said)_](#basic-requirement) |
| Body   | -                                                          |

Example Request:

```bash
$ curl -v -X GET {PREFIX}/v1/workManagement/testWork/getWorkDraft   \
     -H 'Authorization: ApiKey' \
     -H 'Content-Type: application/json' \
```

Example Response:

```JSON
{
    "statusCode": 200,
    "message": "Success",
    "requestId": "1621698588044-xxd",
    "workDraft": {
        "outputDraft": [
            "ID",
            "score",
            "comment"
        ],
        "fileDraft": "{ID}_testWork.zip"
    }
}
```

---

### submitScores API

This API is used to submit the scores into the TA assistant server.

|        | Details                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Path   | /v1/workManagement/**{workId}**/submitScores                                                                                          |
| Method | POST                                                                                                                                  |
| Header | [_(As in the basic requirement said)_](#basic-requirement)                                                                            |
| Body   | <code>{</br> "workDraft": {// The workDraft Object for current scores array} </br> "scores": [//Array of score object]</br> } </code> |

Example Request:

```bash
$ curl -v -X POST /v1/workManagement/testWork/submitScores   \
     -H 'Authorization: ApiKey' \
     -H 'Content-Type: application/json' \
     -d '{
            "workDraft": {
                "outputDraft": [
                    "ID",
                    "score",
                    "comment"
                ],
                "fileDraft": "{ID}_testWork.zip"
            },
            "scores": [
                {
                    "ID": "test1",
                    "score": "Test",
                    "comment": "Test"
                },
                {
                    "ID": "test2",
                    "score": "Test",
                    "comment": "Test"
                }
            ]
        }'
```

!> Please make sure that the score object in the `scores` property is structured as you specified in [`outputDraft`](#outputDraft) property of the [`workDraft`](#workDraft) sending along with your request.

Example Response:

```JSON
{
    "statusCode": 200,
    "message": "Success",
    "requestId": "1621703071214-nwr"
}
```

!> Keep this in mind. This API **won't override** the existed score data that have been wrote before. If this happen, It will returned the **ID** of score in the property named `existedIDs` without performing any action.

Example Response:

```JSON
{
    "statusCode": 200,
    "message": "Success",
    "requestId": "1621703339253-l24",
    "existedIDs": [
        "test1",
        "test2"
    ]
}
```

---
