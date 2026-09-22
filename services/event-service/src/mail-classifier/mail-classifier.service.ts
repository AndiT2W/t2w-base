import { Inject, Injectable } from "@nestjs/common";

export const MAIL_CATEGORIES = [
  "EVENT_QUESTION",
  "EVENT_UPDATE",
  "REGISTRATION",
  "PARTICIPANTS",
  "FINANCE",
  "INVOICE",
  "OFFER_REQUEST",
  "SPONSORSHIP",
  "TECHNICAL",
  "INTERNAL",
  "NO_ACTION",
  "OTHER",
] as const;

export type MailCategory = (typeof MAIL_CATEGORIES)[number];

export type MailEventCandidate = {
  eventCode: string;
  name: string;
  startAt?: string;
  endAt?: string;
  location?: string | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  folderId?: string | null;
};

export type MailClassificationInput = {
  mail: {
    subject: string;
    body: string;
    from: string;
    to: string[];
    receivedAt?: string;
  };
  eventCandidates: MailEventCandidate[];
};

type ModelProposal = {
  category?: unknown;
  categoryConfidence?: unknown;
  eventCode?: unknown;
  eventConfidence?: unknown;
  isQuestion?: unknown;
  questionSummary?: unknown;
  reasons?: unknown;
};

export type OllamaChatClient = {
  chat(prompt: string): Promise<string>;
};

export const OLLAMA_CHAT_CLIENT = "OLLAMA_CHAT_CLIENT";

export type MailClassificationResult = {
  category: MailCategory;
  categoryConfidence: number;
  event: { eventCode: string; name: string; confidence: number } | null;
  isQuestion: boolean;
  questionSummary: string | null;
  reasons: string[];
  reviewRequired: boolean;
  outlookPlan: OutlookMarkingPlan;
  forwardPlan: ForwardPlan | null;
};

export type OutlookMarkingPlan = {
  categories: string[];
  subject: string;
  flag: "flagged" | "notFlagged";
  moveToFolderId: string | null;
  requiresApproval: true;
};

export type ForwardPlan = {
  recipient: string | null;
  subject: string;
  summary: string;
  requiresApproval: true;
};

const MAX_BODY_LENGTH = 8_000;
const EVENT_MATCH_THRESHOLD = 0.85;

function clampConfidence(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJson(value: string): ModelProposal {
  const trimmed = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("OLLAMA_RESPONSE_NOT_JSON");
  const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("OLLAMA_RESPONSE_NOT_OBJECT");
  return parsed as ModelProposal;
}

function category(value: unknown): MailCategory {
  return typeof value === "string" && MAIL_CATEGORIES.includes(value as MailCategory)
    ? (value as MailCategory)
    : "OTHER";
}

function subjectWithEvent(subject: string, event: MailClassificationResult["event"]) {
  if (!event) return subject;
  const prefix = `[${event.eventCode} · ${event.name}]`;
  return subject.startsWith(prefix) ? subject : `${prefix} ${subject}`.slice(0, 255);
}

function outlookCategories(
  result: Pick<MailClassificationResult, "category" | "event" | "isQuestion">,
) {
  const categories: string[] = [];
  if (result.event) categories.push("T2W | Event");
  if (result.isQuestion) categories.push("T2W | Frage");
  if (!result.event) categories.push("T2W | Prüfung");
  if (result.category === "INVOICE" || result.category === "FINANCE")
    categories.push("T2W | Finanzen");
  if (result.category === "REGISTRATION" || result.category === "PARTICIPANTS")
    categories.push("T2W | Teilnehmer");
  return categories;
}

function promptFor(input: MailClassificationInput) {
  const candidates = input.eventCandidates.map((event) => ({
    eventCode: event.eventCode,
    name: event.name,
    startAt: event.startAt ?? null,
    endAt: event.endAt ?? null,
    location: event.location ?? null,
    organizerName: event.organizerName ?? null,
  }));
  return [
    "Du klassifizierst eine geschäftliche E-Mail für TIME2WIN.",
    "Antworte ausschließlich mit einem JSON-Objekt, ohne Markdown.",
    "Nutze für category ausschließlich einen Wert aus der vorgegebenen Liste.",
    "Nutze für eventCode ausschließlich einen eventCode aus der Kandidatenliste oder null.",
    "Erfinde keinen Eventnamen und keine Event-ID.",
    "isQuestion ist true, wenn die Mail eine konkrete Frage zum Event enthält.",
    "questionSummary soll die Frage in höchstens einem Satz zusammenfassen.",
    "reasons enthält höchstens drei kurze, textnahe Gründe.",
    "",
    `Erlaubte Kategorien: ${MAIL_CATEGORIES.join(", ")}`,
    `Eventkandidaten: ${JSON.stringify(candidates)}`,
    `Von: ${input.mail.from}`,
    `An: ${input.mail.to.join(", ")}`,
    `Betreff: ${input.mail.subject}`,
    `Text: ${input.mail.body.slice(0, MAX_BODY_LENGTH)}`,
    "",
    'Erwartetes Format: {"category":"EVENT_QUESTION","categoryConfidence":0.0,"eventCode":null,"eventConfidence":0.0,"isQuestion":false,"questionSummary":null,"reasons":[]}',
  ].join("\n");
}

@Injectable()
export class MailClassifierService {
  constructor(@Inject(OLLAMA_CHAT_CLIENT) private readonly ollama: OllamaChatClient) {}

  async classify(input: MailClassificationInput): Promise<MailClassificationResult> {
    let proposal: ModelProposal;
    try {
      proposal = parseJson(await this.ollama.chat(promptFor(input)));
    } catch {
      return this.resultFromProposal({}, input, true);
    }
    return this.resultFromProposal(proposal, input, false);
  }

  private resultFromProposal(
    proposal: ModelProposal,
    input: MailClassificationInput,
    parserFailed: boolean,
  ): MailClassificationResult {
    const selectedCode = text(proposal.eventCode);
    const selected = input.eventCandidates.find((event) => event.eventCode === selectedCode);
    const eventConfidence = clampConfidence(proposal.eventConfidence);
    const event = selected
      ? { eventCode: selected.eventCode, name: selected.name, confidence: eventConfidence }
      : null;
    const resultWithoutPlans = {
      category: category(proposal.category),
      categoryConfidence: clampConfidence(proposal.categoryConfidence),
      event,
      isQuestion: proposal.isQuestion === true,
      questionSummary: text(proposal.questionSummary) || null,
      reasons: Array.isArray(proposal.reasons)
        ? proposal.reasons
            .filter((reason): reason is string => typeof reason === "string")
            .slice(0, 3)
        : [],
    };
    const confidentEvent = event && event.confidence >= EVENT_MATCH_THRESHOLD ? event : null;
    const reviewRequired =
      parserFailed ||
      !confidentEvent ||
      resultWithoutPlans.categoryConfidence < EVENT_MATCH_THRESHOLD ||
      resultWithoutPlans.isQuestion;
    const outlookPlan: OutlookMarkingPlan = {
      categories: outlookCategories({ ...resultWithoutPlans, event: confidentEvent }),
      subject: subjectWithEvent(input.mail.subject, confidentEvent),
      flag: resultWithoutPlans.isQuestion ? "flagged" : "notFlagged",
      moveToFolderId: confidentEvent ? (selected?.folderId ?? null) : null,
      requiresApproval: true,
    };
    const forwardPlan =
      resultWithoutPlans.isQuestion && confidentEvent
        ? {
            recipient: selected?.organizerEmail ?? null,
            subject: `Frage zu ${confidentEvent.name}: ${input.mail.subject}`.slice(0, 255),
            summary:
              resultWithoutPlans.questionSummary ??
              "Die Mail enthält eine Frage zum genannten Event.",
            requiresApproval: true as const,
          }
        : null;
    return {
      ...resultWithoutPlans,
      event,
      reviewRequired,
      outlookPlan,
      forwardPlan,
    };
  }
}
