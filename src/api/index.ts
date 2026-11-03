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
  // (SCAN_NOT_ACCEPTING / SURVEY_NOT_OPEN_YET / SURVEY_CLOSED). `code`,
  // `message` and `details` (opens_at / closes_at) come straight from the API.
  | {
      status: "closed";
      code: string;
      message: string;
      details?: Record<string, any>;
    }
  | { status: "rate_limited" } // 429 — the global gate takes over
  | { status: "error" }; // network/5xx — keep whatever's cached

// Every successful scan-qr call counts as one "open" in the vendor's
// completion rate, so concurrent calls for the same slug (StrictMode's double
// effect, a quick re-render) share one request instead of counting twice.
const scanInflight = new Map<string, Promise<ScanQrResult>>();

const fetchScanQr = async (slug: string): Promise<ScanQrResult> => {
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
      ...(body.details && typeof body.details === "object"
        ? { details: body.details }
        : {}),
    };
  }
  if (code === 429) return { status: "rate_limited" };

  console.log("getScanQr failed:", response?.data?.message ?? response?.status);
  return { status: "error" };
};

// GET /public/scan-qr/{slug}
export const getScanQr = (slug: string): Promise<ScanQrResult> => {
  let pending = scanInflight.get(slug);
  if (!pending) {
    pending = fetchScanQr(slug).finally(() => scanInflight.delete(slug));
    scanInflight.set(slug, pending);
  }
  return pending;
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

// One answer of the separate Ethnicity question, from the scan-qr payload's
// `about_you.options.ethnicity`. `value` is what's sent on submit; `label` is
// display-only (never hardcoded on our side).
export type EthnicityOption = { value: string; label: string };

export const getEthnicityOptions = (data: any): EthnicityOption[] => {
  const list = data?.about_you?.options?.ethnicity;
  return Array.isArray(list)
    ? (list as EthnicityOption[]).filter((o) => o?.value && o?.label)
    : [];
};

// Gender answers from `about_you.options.gender`; falls back to the four
// values the API accepts when an older payload doesn't carry the list.
export type GenderOption = { value: string; label: string };

const DEFAULT_GENDER_OPTIONS: GenderOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const getGenderOptions = (data: any): GenderOption[] => {
  const list = data?.about_you?.options?.gender;
  const opts = Array.isArray(list)
    ? (list as GenderOption[]).filter((o) => o?.value && o?.label)
    : [];
  return opts.length ? opts : DEFAULT_GENDER_OPTIONS;
};

// The per-prompt modes. Most live under `user_info_modes`; ethnicity_mode and
// race_mode may also come top-level on the scan response, so fall back to those.
export const getUserInfoModes = (data: any) => ({
  ...data?.user_info_modes,
  ethnicity_mode:
    data?.user_info_modes?.ethnicity_mode ?? data?.ethnicity_mode,
  race_mode: data?.user_info_modes?.race_mode ?? data?.race_mode,
});

// Race & Ethnicity picker category id (GET /public/ethnicity) → Ethnicity
// question value. The backend uses the same mapping.
const PICKER_TO_ETHNICITY: Record<number, string> = {
  1: "hispanic_or_latino",
  6: "not_hispanic_or_latino",
};

// The Ethnicity answer implied by the picker's ethnicity, when the question
// offers it; "" otherwise.
export const ethnicityFromPicker = (
  pickerEthnicityId: number | null | undefined,
  options: EthnicityOption[],
): string => {
  const value =
    pickerEthnicityId != null ? PICKER_TO_ETHNICITY[pickerEthnicityId] : "";
  return value && options.some((o) => o.value === value) ? value : "";
};

// GET /public/scan-qr/{slug}/products  — the services a customer can pick from
// on a business QR (only call it when the scan response has `is_product`).
// Pages through the list ({ count, limit, offset, data }) so vendors with more
// than one page of services get all of them. Returns what it has on any
// non-200 so the rest of the form still renders.
const PRODUCTS_PAGE_SIZE = 100;

export const getScanQrProducts = async (
  slug: string,
): Promise<ScanQrProduct[]> => {
  const all: ScanQrProduct[] = [];
  let offset = 0;
  // Hard stop so a bad `count` can never loop forever.
  for (let page = 0; page < 50; page++) {
    const response: any = await getData(
      `public/scan-qr/${encodeURIComponent(slug)}/products`,
      { limit: PRODUCTS_PAGE_SIZE, offset },
      apiHeader(false),
    );
    if (Number(response?.status) !== 200) break;

    // The endpoint may return a bare array or wrap it in { data: [...] }.
    const body = response?.data;
    const list = Array.isArray(body) ? body : body?.data;
    if (!Array.isArray(list)) break;
    all.push(...(list as ScanQrProduct[]));

    const count = Number(body?.count);
    const limit = Number(body?.limit) || PRODUCTS_PAGE_SIZE;
    if (Array.isArray(body) || !Number.isFinite(count)) break;
    offset += limit;
    if (offset >= count || list.length === 0) break;
  }
  return all;
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
  // Sent instead of `age` when the reviewer picks "Prefer not to say".
  age_prefer_not_to_say?: boolean;
  postal_code?: string;
  // IDs of the business services the customer selected (business QR only).
  product_ids?: string[];
  // Answer value of the separate Ethnicity question (ethnicity_mode).
  ethnicity?: string;
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
  // Sent instead of `age` when the reviewer picks "Prefer not to say".
  age_prefer_not_to_say?: boolean;
  postal_code?: string;
  // Answer value of the separate Ethnicity question (ethnicity_mode).
  ethnicity?: string;
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

// 400 when a required "about you" prompt (email, age, gender, postal code,
// ethnicity, race) is missing. `details.field` names the body field.
export const REVIEW_PII_REQUIRED = "REVIEW_PII_REQUIRED";

// Body field → the forms' error key, for showing a REVIEW_PII_REQUIRED inline.
export const PII_FIELD_ERROR_KEYS: Record<string, string> = {
  email: "email",
  age: "age",
  gender: "gender",
  postal_code: "postalCode",
  ethnicity: "ethnicity",
  race_and_ethnicity: "race",
  description: "description",
};

// 400 when description_mode is required and the description is empty.
export const REVIEW_DESCRIPTION_REQUIRED = "REVIEW_DESCRIPTION_REQUIRED";
// 400 when a survey answer is missing its emoji / points.
export const REVIEW_ANSWER_REACTION_REQUIRED = "REVIEW_ANSWER_REACTION_REQUIRED";
// 400 when the chosen reaction was turned off by the vendor.
export const REACTION_NOT_AVAILABLE = "REACTION_NOT_AVAILABLE";

export const submitReview = async (payload: ReviewPayload) => {
  // A 429 on submit is shown inline (the form keeps its answers), so it must
  // not trip the full-page rate-limit gate.
  const response: any = await postData(
    "public/reviews",
    payload,
    apiHeader(false),
    { skipRateLimitGate: true },
  );
  return response;
};

// A page-level state the form hands back to the page when the submit shows the
// QR / survey / vendor is no longer taking this response.
export type BlockedState =
  | { kind: "not_found" }
  | {
      kind: "closed";
      code: string;
      message: string;
      details?: Record<string, any>;
    };

// What to do with a failed submit that isn't one of the inline field errors
// (PII / description / profile / answer-reaction), which the forms handle
// themselves. See the review-site spec §6.
export type SubmitErrorAction =
  // Stale form or client bug: tell the person and offer a reload.
  | { type: "reload"; message: string }
  // Cadence survey left open past midnight: fetch today's question.
  | { type: "refresh"; message: string }
  // The picked reaction was turned off: refresh the reactions, pick again.
  | { type: "reaction_unavailable"; message: string }
  // The page itself should switch to a state screen.
  | { type: "blocked"; state: BlockedState }
  // Anything else: a message, the form stays filled in.
  | { type: "toast"; message: string };

const STALE_FORM_CODES = new Set([
  "REVIEW_ANSWER_TYPE_MISMATCH",
  "REVIEW_ANSWER_OPTION_INVALID",
  "REVIEW_ANSWER_QUESTION_MISMATCH",
  "REVIEW_ANSWER_DUPLICATE",
]);

export const classifySubmitError = (response: any): SubmitErrorAction => {
  const status = Number(response?.status);
  const body = response?.data ?? {};
  const code: string = String(body.error ?? "");

  if (status === 429)
    return {
      type: "toast",
      message:
        "You've already sent feedback recently. Please try again later.",
    };

  if (code === "VALIDATION_ERROR") {
    console.warn("Review validation failed:", body.details ?? body.message);
    return {
      type: "toast",
      message: "Please check your answers and try again.",
    };
  }
  if (STALE_FORM_CODES.has(code))
    return { type: "reload", message: "This survey changed. Please reload." };
  if (code === "QR_TYPE_MISMATCH" || code === "QR_PRODUCT_MISSING")
    return { type: "reload", message: "This page changed. Please reload." };
  if (code === REACTION_NOT_AVAILABLE)
    return {
      type: "reaction_unavailable",
      message: "That reaction isn't available any more. Please pick another.",
    };
  if (code === "SURVEY_QUESTION_NOT_TODAY")
    return {
      type: "refresh",
      message: "Today's question has changed. Please answer the new one.",
    };
  if (code === "QR_NOT_FOUND" || code === "SURVEY_NOT_FOUND")
    return { type: "blocked", state: { kind: "not_found" } };
  if (
    code === "SURVEY_NOT_OPEN_YET" ||
    code === "SURVEY_CLOSED" ||
    code === "VENDOR_NOT_ACCEPTING" ||
    code === "VENDOR_SUBSCRIPTION_LOCKED" ||
    code === "SCAN_NOT_ACCEPTING"
  )
    return {
      type: "blocked",
      state: {
        kind: "closed",
        code,
        message: String(body.message ?? ""),
        ...(body.details && typeof body.details === "object"
          ? { details: body.details }
          : {}),
      },
    };

  return {
    type: "toast",
    message: "Something went wrong. Please try again.",
  };
};
