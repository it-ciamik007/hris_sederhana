import ExcelJS from "exceljs";
import type { NumberTestKeyBlock, NumberTestWorkbook } from "@/lib/number-test-key";

const defaultWorkbookPath = "\\\\Ddserver\\data klien lanjutan\\HRD\\Tes\\Jawaban TES BS dan Angka.xlsx";
type ExcelJsLoadBuffer = Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0];

function colorText(color?: Partial<ExcelJS.Color>) {
  if (!color) return "";
  if ("argb" in color && color.argb) return color.argb.toUpperCase();
  if ("indexed" in color && color.indexed !== undefined) return `indexed:${color.indexed}`;
  if ("theme" in color && color.theme !== undefined) return `theme:${color.theme}`;
  return "";
}

function isRedKeyCell(cell: ExcelJS.Cell) {
  const color = colorText(cell.font?.color);
  return color === "indexed:10" || color === "indexed:3" || color.includes("FF0000") || color.includes("C00000");
}

function numericCellValue(cell: ExcelJS.Cell) {
  const raw = cell.value;
  if (typeof raw === "number") return raw;
  if (raw && typeof raw === "object" && "result" in raw && typeof raw.result === "number") return raw.result;
  return null;
}

function splitContiguousRows(cells: Array<{ row: number; value: number }>) {
  const segments: Array<Array<{ row: number; value: number }>> = [];
  for (const cell of cells) {
    const lastSegment = segments.at(-1);
    const lastCell = lastSegment?.at(-1);
    if (!lastSegment || !lastCell || cell.row > lastCell.row + 1) {
      segments.push([cell]);
    } else {
      lastSegment.push(cell);
    }
  }
  return segments;
}

function segmentDirection(values: number[]): "top-down" | "bottom-up" {
  return values.at(-1)! >= values[0] ? "top-down" : "bottom-up";
}

function columnLetter(worksheet: ExcelJS.Worksheet, columnNumber: number) {
  return worksheet.getColumn(columnNumber).letter;
}

function parseWorkbook(workbook: ExcelJS.Workbook, fileName: string): NumberTestWorkbook {
  const blocks: NumberTestKeyBlock[] = [];

  for (const worksheet of workbook.worksheets) {
    if (!/^Asli\s*\d+/i.test(worksheet.name)) continue;

    for (let column = 1; column <= worksheet.columnCount; column += 1) {
      const keyCells: Array<{ row: number; value: number }> = [];
      for (let row = 1; row <= worksheet.rowCount; row += 1) {
        const cell = worksheet.getCell(row, column);
        const value = numericCellValue(cell);
        if (value !== null && isRedKeyCell(cell)) keyCells.push({ row, value });
      }

      if (keyCells.length < 10) continue;

      const segments = splitContiguousRows(keyCells)
        .filter((segment) => segment.length >= 10)
        .map((segment) => {
          const keyValues = segment.map((cell) => cell.value);
          return {
            direction: segmentDirection(keyValues),
            startRow: segment[0].row,
            endRow: segment.at(-1)!.row,
            keyValues
          };
        });

      if (!segments.length) continue;

      const answerColumn = columnLetter(worksheet, column);
      const questionColumn = column > 1 ? columnLetter(worksheet, column - 1) : answerColumn;
      const topDownKeyValues = segments.find((segment) => segment.direction === "top-down")?.keyValues ?? [];
      const bottomUpKeyValues = segments.find((segment) => segment.direction === "bottom-up")?.keyValues ?? [];
      const keyValues = topDownKeyValues.length ? topDownKeyValues : segments[0].keyValues;
      blocks.push({
        id: `${worksheet.name}:${answerColumn}`,
        label: `${worksheet.name} - Kolom ${answerColumn}`,
        sheetName: worksheet.name,
        questionColumn,
        answerColumn,
        answerCount: Math.max(...segments.map((segment) => segment.keyValues.length)),
        keyValues,
        topDownKeyValues,
        bottomUpKeyValues,
        segments
      });
    }
  }

  return {
    fileName,
    sheetCount: workbook.worksheets.length,
    blocks
  };
}

export async function extractNumberTestWorkbookFromBuffer(buffer: Buffer, fileName = "uploaded.xlsx") {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJsLoadBuffer);
  return parseWorkbook(workbook, fileName);
}

export async function extractNumberTestWorkbookFromFile(path = process.env.TEST_ANSWER_WORKBOOK_PATH || defaultWorkbookPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  return parseWorkbook(workbook, path.split(/[\\/]/).pop() ?? "workbook.xlsx");
}
