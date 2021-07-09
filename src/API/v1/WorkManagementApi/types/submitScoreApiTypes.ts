export type SubmitScoreApiBody = {
  workDraft: {
    outputDraft: Array<string>;
    fileDraft: string;
  };
  scores: Array<ScoreElement>;
};

export type ScoreElement = {
  studentId: string;
  score: number;
  [key: string]: any;
};
