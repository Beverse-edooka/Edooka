export type ParsedQuestionRow = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  rationale: string | null;
  orderIndex: number | null;
};

export type CsvParseResult =
  | { ok: true; rows: ParsedQuestionRow[] }
  | { ok: false; error: string; line?: number };

/** Parse one CSV line respecting quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeCorrect(raw: string): "a" | "b" | "c" | "d" | null {
  const x = raw.trim().toLowerCase();
  if (x === "a" || x === "b" || x === "c" || x === "d") return x;
  if (x === "1") return "a";
  if (x === "2") return "b";
  if (x === "3") return "c";
  if (x === "4") return "d";
  return null;
}

const HEADER_ALIASES: Record<string, keyof ParsedQuestionRow | "skip"> = {
  question: "questionText",
  questiontext: "questionText",
  question_text: "questionText",
  optiona: "optionA",
  option_a: "optionA",
  a: "optionA",
  optionb: "optionB",
  option_b: "optionB",
  b: "optionB",
  optionc: "optionC",
  option_c: "optionC",
  c: "optionC",
  optiond: "optionD",
  option_d: "optionD",
  d: "optionD",
  correct: "correctOption",
  correctoption: "correctOption",
  correct_option: "correctOption",
  answer: "correctOption",
  rationale: "rationale",
  explanation: "rationale",
  orderindex: "orderIndex",
  order_index: "orderIndex",
  order: "orderIndex",
};

function mapHeaderRow(cells: string[]): Record<number, keyof ParsedQuestionRow> | null {
  const map: Record<number, keyof ParsedQuestionRow> = {};
  let matched = 0;
  for (let i = 0; i < cells.length; i++) {
    const key = cells[i].replace(/^\uFEFF/, "").trim().toLowerCase();
    const field = HEADER_ALIASES[key];
    if (field && field !== "skip") {
      map[i] = field;
      matched++;
    }
  }
  if (matched < 6) return null;
  return map;
}

function rowFromCells(cells: string[], lineNo: number): CsvParseResult {
  const get = (idx: number, fallback = "") => cells[idx]?.trim() ?? fallback;
  const questionText = get(0);
  if (!questionText) {
    return { ok: false, error: "Question text is empty", line: lineNo };
  }
  const correct = normalizeCorrect(get(5, "a"));
  if (!correct) {
    return { ok: false, error: `Invalid correct option (use a/b/c/d): "${get(5)}"`, line: lineNo };
  }
  const orderRaw = get(7);
  const orderIndex = orderRaw ? Number(orderRaw) : null;
  return {
    ok: true,
    rows: [
      {
        questionText,
        optionA: get(1) || "—",
        optionB: get(2) || "—",
        optionC: get(3) || "—",
        optionD: get(4) || "—",
        correctOption: correct,
        rationale: get(6) || null,
        orderIndex: orderIndex !== null && !Number.isNaN(orderIndex) ? orderIndex : null,
      },
    ],
  };
}

function rowFromMapped(
  cells: string[],
  colMap: Record<number, keyof ParsedQuestionRow>,
  lineNo: number
): CsvParseResult {
  const draft: Partial<ParsedQuestionRow> = {
    optionA: "—",
    optionB: "—",
    optionC: "—",
    optionD: "—",
    correctOption: "a",
    rationale: null,
    orderIndex: null,
  };
  for (const [idx, field] of Object.entries(colMap)) {
    const val = cells[Number(idx)]?.trim() ?? "";
    if (field === "orderIndex") {
      draft.orderIndex = val ? Number(val) : null;
      if (val && Number.isNaN(draft.orderIndex)) {
        return { ok: false, error: `Invalid order_index: "${val}"`, line: lineNo };
      }
    } else if (field === "correctOption") {
      const c = normalizeCorrect(val);
      if (!c) return { ok: false, error: `Invalid correct: "${val}"`, line: lineNo };
      draft.correctOption = c;
    } else if (field === "rationale") {
      draft.rationale = val || null;
    } else {
      (draft as Record<string, string>)[field] = val || "—";
    }
  }
  if (!draft.questionText?.trim()) {
    return { ok: false, error: "Question text is empty", line: lineNo };
  }
  return {
    ok: true,
    rows: [
      {
        questionText: draft.questionText.trim(),
        optionA: draft.optionA ?? "—",
        optionB: draft.optionB ?? "—",
        optionC: draft.optionC ?? "—",
        optionD: draft.optionD ?? "—",
        correctOption: draft.correctOption ?? "a",
        rationale: draft.rationale ?? null,
        orderIndex: draft.orderIndex ?? null,
      },
    ],
  };
}

/** Parse CSV text into question rows (max 500 data rows). */
export function parseQuestionsCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: "CSV file is empty" };
  }

  const maxRows = 500;
  const firstCells = parseCsvLine(lines[0]);
  const headerMap = mapHeaderRow(firstCells);
  const dataLines = headerMap ? lines.slice(1) : lines;

  if (dataLines.length > maxRows) {
    return { ok: false, error: `Too many rows (max ${maxRows})` };
  }

  const rows: ParsedQuestionRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const lineNo = headerMap ? i + 2 : i + 1;
    const cells = parseCsvLine(dataLines[i]);
    const parsed = headerMap
      ? rowFromMapped(cells, headerMap, lineNo)
      : rowFromCells(cells, lineNo);
    if (!parsed.ok) return parsed;
    rows.push(...parsed.rows);
  }

  if (rows.length === 0) {
    return { ok: false, error: "No question rows found" };
  }

  return { ok: true, rows };
}

export const QUESTIONS_CSV_TEMPLATE = `question,option_a,option_b,option_c,option_d,correct,rationale,order_index
"What is quality control?","Daily checks","Ignore SOPs","Skip calibration","Random guesses","a","QC ensures reliable lab results",1
`;
