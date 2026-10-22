import { apiHeader, getData, postData } from "../utils/ApiHelper";
import {
  mapEthnicityTree,
  mapRaceTree,
  type RaceAndEthnicityPayload,
  type DemographicTreeNode,
  type EthnicityCategory,
  type RaceCategory,
} from "../data/demographics";

// Outcome of a scan-qr fetch. The caller branches on `status` so it can tell a
// genuine "this QR doesn't exist" (404) apart from a transient failure or a
// rate-limit — they need very different handling on the page.
export type ScanQrResult =
  | { status: "ok"; data: any }
  | { status: "not_found" } // 404 — invalid/expired slug, drop any cached page
  // 403 — the slug is valid but the QR is closed to responses right now
  // (paused / outside its schedule / response cap reached). `code` and
  // `message` come straight from the API so the page can show its reason.
  | { status: "closed"; code: string; message: string }
  | { status: "rate_limited" } // 429 — the global gate takes over
  | { status: "error" }; // network/5xx — keep whatever's cached

// GET /public/scan-qr/{slug}
export const getScanQr = async (slug: string): Promise<ScanQrResult> => {
  const response: any = await getData(
    `public/scan-qr/${encodeURIComponent(slug)}`,
    {},
    apiHeader(false),
  );

  const code = Number(response?.status);
  if (code === 200) return { status: "ok", data: response.data };
  if (code === 404) return { status: "not_found" };
  if (code === 403) {
    const body = response?.data ?? {};
    return {
      status: "closed",
      code: String(body.error ?? "SCAN_NOT_ACCEPTING"),
      message: String(
        body.message ?? "This QR code is not accepting responses right now.",
      ),
    };
  }
  if (code === 429) return { status: "rate_limited" };

  console.log("getScanQr failed:", response?.data?.message ?? response?.status);
  return { status: "error" };
};

// A reaction the customer can pick, configured per-vendor in the admin panel and
// delivered inline with the scan-qr payload (`data.reactions`). `type` is the
// stable identifier sent back on submit; `media_url` is a full CDN url and
// `background_color` a hex string applied as the chip's background.
export type ScanQrReaction = {
  reaction_id: string;
  type: string;
  label: string;
  media_url: string;
  background_color: string;
  display_order: number;
};

// A selectable business service/product offered to customers on a business QR.
// `image` is optional — it's set from the admin panel and may be absent.
export type ScanQrProduct = {
  product_id: string;
  name: string;
  image?: string | null;
};

// A "respondent group" question (e.g. Department / Shift) the business asks on
// this QR or survey, delivered inline with the scan-qr payload
// (`data.profile_prompts`) in the order it should be shown. Labels are
// business-defined free text — render them as-is. Fixed groups are applied
// server-side and never appear here.
export interface ProfilePrompt {
  field_id: string;
  label: string;
  mode: "optional" | "required";
  options: { id: string; label: string }[];
}

// One answered group question on submit — the chosen option of a single field.
export type ProfileAnswer = { field_id: string; option_id: string };

// Read `profile_prompts` off a scan-qr payload. Older cached payloads predate
// the field, so anything that isn't a list of prompts with options becomes [].
export const getProfilePrompts = (data: any): ProfilePrompt[] =>
  Array.isArray(data?.profile_prompts)
    ? (data.profile_prompts as ProfilePrompt[]).filter(
        (p) => p?.field_id && Array.isArray(p.options) && p.options.length > 0,
      )
    : [];

// Map form state (field_id → option_id) to the submit `profile` array: answered
// prompts only, in prompt order, and only options the prompt still offers.
export const buildProfilePayload = (
  prompts: ProfilePrompt[],
  values: Record<string, string>,
): ProfileAnswer[] =>
  prompts.flatMap((p) => {
    const optionId = values[p.field_id];
    return optionId && p.options.some((o) => o.id === optionId)
      ? [{ field_id: p.field_id, option_id: optionId }]
      : [];
  });

// Resolved "Label: Option" pairs for the thank-you summary, captured at submit
// time so a restored summary doesn't depend on the live prompt list.
export const buildProfileSummary = (
  prompts: ProfilePrompt[],
  values: Record<string, string>,
): { label: string; value: string }[] =>
  prompts.flatMap((p) => {
    const opt = p.options.find((o) => o.id === values[p.field_id]);
    return opt ? [{ label: p.label, value: opt.label }] : [];
  });

// GET /public/scan-qr/{slug}/products  — the services a customer can pick from
// on a business QR. Returns [] on any non-200 so the caller can render the rest
// of the form regardless (the field just shows no options).
export const getScanQrProducts = async (
  slug: string,
): Promise<ScanQrProduct[]> => {
  const response: any = await getData(
    `public/scan-qr/${encodeURIComponent(slug)}/products`,
    {},
    apiHeader(false),
  );

  if (Number(response?.status) === 200) {
    // The endpoint may return a bare array or wrap it in { data: [...] }.
    const body = response?.data;
    const list = Array.isArray(body) ? body : body?.data;
    if (Array.isArray(list)) return list as ScanQrProduct[];
  }
  return [];
};

// Pull the category tree out of a demographics response. The endpoint returns
// the array under `data` ({ data: [...] }), but we also accept a bare array or
// a `tree` key so a backend shape tweak won't silently break the fields.
const extractTree = (body: any): DemographicTreeNode[] | null => {
  const list = Array.isArray(body) ? body : (body?.data ?? body?.tree);
  return Array.isArray(list) ? (list as DemographicTreeNode[]) : null;
};

// GET /public/ethnicity — ethnicity categories (+ sub-ethnicities as children).
// Returns [] on any non-200 so the caller can fall back to its defaults.
export const getEthnicities = async (): Promise<EthnicityCategory[]> => {
  const response: any = await getData("public/ethnicity", {}, apiHeader(false));
  if (Number(response?.status) === 200) {
    const tree = extractTree(response?.data);
    if (tree) return mapEthnicityTree(tree);
  }
  return [];
};

// GET /public/race — race categories (+ sub-races as children).
export const getRaces = async (): Promise<RaceCategory[]> => {
  const response: any = await getData("public/race", {}, apiHeader(false));
  if (Number(response?.status) === 200) {
    const tree = extractTree(response?.data);
    if (tree) return mapRaceTree(tree);
  }
  return [];
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
  postal_code?: string;
  // IDs of the business services the customer selected (business QR only).
  product_ids?: string[];
  race_and_ethnicity?: RaceAndEthnicityPayload;
  // Answered respondent-group questions (omit unanswered optional ones).
  profile?: ProfileAnswer[];
};

// per-question answer inside a survey submission
// Only reaction questions carry top-level rating/reaction; open-text and
// multiple-choice answers send just `answer`.
export type SurveyAnswer = {
  survey_question_id: string;
  rating?: number | null;
  reaction?: string | null;
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
  // Time from form open to submit, in milliseconds.
  completion_ms?: number;
  description?: string;
  email?: string;
  gender?: string;
  age?: number;
  postal_code?: string;
  race_and_ethnicity?: RaceAndEthnicityPayload;
  // Answered respondent-group questions (omit unanswered optional ones).
  profile?: ProfileAnswer[];
  answers: SurveyAnswer[];
};

export type ReviewPayload = QrReviewPayload | SurveyReviewPayload;

// 400 error codes for the `profile` array. REQUIRED: a required prompt wasn't
// answered; OPTION_INVALID: the option was removed — re-fetch and ask again.
// Both carry `details.field_id`.
export const REVIEW_PROFILE_REQUIRED = "REVIEW_PROFILE_REQUIRED";
export const REVIEW_PROFILE_OPTION_INVALID = "REVIEW_PROFILE_OPTION_INVALID";

export const submitReview = async (payload: ReviewPayload) => {
  const response: any = await postData(
    "public/reviews",
    payload,
    apiHeader(false),
  );
  return response;
};
