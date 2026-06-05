export type NumberTestKeyBlock = {
  id: string;
  label: string;
  sheetName: string;
  questionColumn: string;
  answerColumn: string;
  answerCount: number;
  keyValues: number[];
  topDownKeyValues?: number[];
  bottomUpKeyValues?: number[];
  segments?: Array<{
    direction: Exclude<AnswerDirection, "auto">;
    startRow: number;
    endRow: number;
    keyValues: number[];
  }>;
};

export type NumberTestWorkbook = {
  fileName: string;
  sheetCount: number;
  blocks: NumberTestKeyBlock[];
};

export type AnswerDirection = "auto" | "top-down" | "bottom-up";

export type AnswerCheckItem = {
  index: number;
  expected: number;
  detected?: number;
  correct: boolean;
};

export type AnswerCheckResult = {
  direction: Exclude<AnswerDirection, "auto">;
  checked: number;
  correct: number;
  missing: number;
  extra: number;
  scorePercent: number;
  detectedAnswers: number[];
  sourceAnswers: number[];
  offset: number;
  items: AnswerCheckItem[];
};

function formatNumber(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

export function extractNumbersFromAnswerText(text: string, options?: { ignoreSingleDigit?: boolean }) {
  const numbers = [...text.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").matchAll(/[+-]?\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((value) => Number.isFinite(value))
    .map(formatNumber);

  if (!options?.ignoreSingleDigit) return numbers;
  return numbers.filter((value) => Math.abs(value) >= 10);
}

function compareAnswers(sourceAnswers: number[], expectedValues: number[], direction: Exclude<AnswerDirection, "auto">): AnswerCheckResult {
  const expected = expectedValues;
  let detectedAnswers = sourceAnswers.slice(0, expected.length);
  let offset = 0;

  if (sourceAnswers.length > expected.length) {
    let best = { score: -1, offset: 0, detectedAnswers };
    for (let index = 0; index <= sourceAnswers.length - expected.length; index += 1) {
      const candidate = sourceAnswers.slice(index, index + expected.length);
      const score = candidate.filter((value, valueIndex) => value === expected[valueIndex]).length;
      if (score > best.score) best = { score, offset: index, detectedAnswers: candidate };
    }
    detectedAnswers = best.detectedAnswers;
    offset = best.offset;
  }

  const checked = Math.min(detectedAnswers.length, expected.length);
  const items = expected.map((expectedValue, index) => {
    const detected = detectedAnswers[index];
    return {
      index,
      expected: expectedValue,
      detected,
      correct: detected === expectedValue
    };
  });
  const correct = items.filter((item) => item.detected !== undefined && item.correct).length;
  const missing = Math.max(0, expected.length - detectedAnswers.length);
  const extra = Math.max(0, sourceAnswers.length - detectedAnswers.length);

  return {
    direction,
    checked,
    correct,
    missing,
    extra,
    scorePercent: expected.length ? Math.round((correct / expected.length) * 100) : 0,
    detectedAnswers,
    sourceAnswers,
    offset,
    items
  };
}

export function checkNumberTestAnswers({
  text,
  keyValues,
  topDownKeyValues,
  bottomUpKeyValues,
  direction,
  ignoreSingleDigit
}: {
  text: string;
  keyValues: number[];
  topDownKeyValues?: number[];
  bottomUpKeyValues?: number[];
  direction: AnswerDirection;
  ignoreSingleDigit?: boolean;
}) {
  const detectedAnswers = extractNumbersFromAnswerText(text, { ignoreSingleDigit });
  const topDownExpected = topDownKeyValues?.length ? topDownKeyValues : keyValues;
  const bottomUpExpected = bottomUpKeyValues?.length ? bottomUpKeyValues : [...keyValues].reverse();
  const topDown = compareAnswers(detectedAnswers, topDownExpected, "top-down");
  const bottomUp = compareAnswers(detectedAnswers, bottomUpExpected, "bottom-up");

  if (direction === "top-down") return topDown;
  if (direction === "bottom-up") return bottomUp;

  if (topDown.correct === 0 && bottomUp.correct > 0) return bottomUp;
  return topDown;
}
