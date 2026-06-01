import { apiHeader, getData, postData } from "../utils/ApiHelper";

// GET /public/scan-qr/{slug}
export const getScanQr = async (slug: string) => {
  const response: any = await getData(
    `public/scan-qr/${encodeURIComponent(slug)}`,
    {},
    apiHeader(false)
  );

  if (String(response?.status) === "200") {
    return response.data;
  }

  console.log("getScanQr failed:", response?.data?.message ?? response?.status);
  return null;
};

// POST /public/reviews  — vendor (business), product & survey feedback save

// vendor (business) & product feedback
export type QrReviewPayload = {
  kind: "business_qr" | "product_qr";
  qr_code_id: string;
  rating: number;
  reaction: string;
  description?: string;
  email?: string;
  gender?: string;
  age?: number;
};

// per-question answer inside a survey submission
export type SurveyAnswer = {
  survey_question_id: string;
  rating: number | null;
  reaction: string | null;
  answer:
    | { type: "reaction"; value: string | null }
    | { type: "rating_1_5"; value: number | null }
    | { type: "open_text"; text: string }
    | { type: "multiple_choice"; selected: string[] };
};

// survey feedback
export type SurveyReviewPayload = {
  kind: "survey";
  survey_id: string;
  description?: string;
  email?: string;
  gender?: string;
  age?: number;
  answers: SurveyAnswer[];
};

export type ReviewPayload = QrReviewPayload | SurveyReviewPayload;

export const submitReview = async (payload: ReviewPayload) => {
  const response: any = await postData("public/reviews", payload, apiHeader(false));
  return response;
};
