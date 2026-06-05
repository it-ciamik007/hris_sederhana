export type NumberCell = {
  row: number;
  col: number;
  value: number;
};

export type SequenceIssue = {
  id: string;
  axis: "row" | "column";
  lineNumber: number;
  row: number;
  col: number;
  detected: number;
  expected: number;
  step: number;
  direction: "naik" | "turun" | "tetap";
};

export type SequenceSummary = {
  axis: "row" | "column";
  lineNumber: number;
  length: number;
  step: number;
  direction: "naik" | "turun" | "tetap";
  issueCount: number;
};

export type SequenceAnalysis = {
  rows: NumberCell[][];
  issues: SequenceIssue[];
  summaries: SequenceSummary[];
  normalizedText: string;
};

function normalizeOcrText(text: string) {
  return text
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[–—]/g, "-")
    .replace(/[^\d\s,.;:\-+]/g, " ")
    .replace(/[;:]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function directionForStep(step: number): "naik" | "turun" | "tetap" {
  if (step > 0) return "naik";
  if (step < 0) return "turun";
  return "tetap";
}

function candidateSteps(values: number[]) {
  const steps = new Set<number>();
  for (let start = 0; start < values.length; start += 1) {
    for (let end = start + 1; end < values.length; end += 1) {
      const rawStep = (values[end] - values[start]) / (end - start);
      if (Number.isFinite(rawStep)) steps.add(formatNumber(rawStep));
    }
  }
  return [...steps].filter((step) => Math.abs(step) > 0);
}

function analyzeCells(cells: NumberCell[], axis: "row" | "column", lineNumber: number, minLength = 3) {
  if (cells.length < minLength) return { issues: [] as SequenceIssue[], summary: null as SequenceSummary | null };

  const values = cells.map((cell) => cell.value);
  const steps = candidateSteps(values);
  let best: { score: number; step: number; anchorIndex: number; expected: number[] } | null = null;

  for (const step of steps) {
    for (let anchorIndex = 0; anchorIndex < values.length; anchorIndex += 1) {
      const expected = values.map((_, index) => formatNumber(values[anchorIndex] + step * (index - anchorIndex)));
      const score = expected.filter((value, index) => value === values[index]).length;
      if (!best || score > best.score || (score === best.score && Math.abs(step) < Math.abs(best.step))) {
        best = { score, step, anchorIndex, expected };
      }
    }
  }

  if (!best || best.score < Math.max(2, cells.length - 2)) {
    return { issues: [] as SequenceIssue[], summary: null as SequenceSummary | null };
  }

  const direction = directionForStep(best.step);
  const issues = cells
    .map((cell, index) => ({ cell, expected: best!.expected[index] }))
    .filter((item) => item.cell.value !== item.expected)
    .map((item) => ({
      id: `${axis}-${lineNumber}-${item.cell.row}-${item.cell.col}`,
      axis,
      lineNumber,
      row: item.cell.row,
      col: item.cell.col,
      detected: item.cell.value,
      expected: item.expected,
      step: best!.step,
      direction
    }));

  if (issues.length > Math.max(1, Math.floor(cells.length / 2))) {
    return { issues: [] as SequenceIssue[], summary: null as SequenceSummary | null };
  }

  return {
    issues,
    summary: {
      axis,
      lineNumber,
      length: cells.length,
      step: best.step,
      direction,
      issueCount: issues.length
    }
  };
}

export function analyzeNumberSequences(text: string): SequenceAnalysis {
  const normalizedText = normalizeOcrText(text);
  const parsedRows = normalizedText
    .split(/\n+/)
    .map((line, rowIndex) => {
      const matches = [...line.matchAll(/[+-]?\d+(?:\.\d+)?/g)].map((match, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value: Number(match[0])
      }));
      return matches.filter((cell) => Number.isFinite(cell.value));
    })
    .filter((row) => row.length > 0);

  const fallbackRow = [...normalizedText.matchAll(/[+-]?\d+(?:\.\d+)?/g)].map((match, colIndex) => ({
    row: 0,
    col: colIndex,
    value: Number(match[0])
  }));
  const rows = parsedRows.length ? parsedRows : fallbackRow.length ? [fallbackRow] : [];

  const issues: SequenceIssue[] = [];
  const summaries: SequenceSummary[] = [];

  rows.forEach((row, index) => {
    const result = analyzeCells(row, "row", index + 1);
    issues.push(...result.issues);
    if (result.summary) summaries.push(result.summary);
  });

  const maxCols = Math.max(0, ...rows.map((row) => row.length));
  for (let col = 0; col < maxCols; col += 1) {
    const column = rows.map((row) => row[col]).filter((cell): cell is NumberCell => Boolean(cell));
    const result = analyzeCells(column, "column", col + 1, 4);
    issues.push(...result.issues);
    if (result.summary) summaries.push(result.summary);
  }

  const uniqueIssues = Array.from(new Map(issues.map((issue) => [issue.id, issue])).values());
  return { rows, issues: uniqueIssues, summaries, normalizedText };
}
