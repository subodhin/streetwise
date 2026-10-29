import { readFileSync } from "node:fs";
import { classifyWithRules } from "../src/lib/classifier";

type LabelledReport = {
  id: string;
  text: string;
  expected: {
    type: string;
    priority: number;
  };
};

const dataset = JSON.parse(
  readFileSync("data/labelled-reports.json", "utf8"),
) as { reports: LabelledReport[] };

let typeCorrect = 0;
let priorityCorrect = 0;

const failures: {
  id: string;
  text: string;
  expectedType: string;
  actualType: string;
  expectedPriority: number;
  actualPriority: number;
}[] = [];

for (const report of dataset.reports) {
  const actual = classifyWithRules(report.text);

  const typeMatches = actual.type === report.expected.type;
  const priorityMatches = actual.priority === report.expected.priority;

  if (typeMatches) typeCorrect++;
  if (priorityMatches) priorityCorrect++;

  if (!typeMatches || !priorityMatches) {
    failures.push({
      id: report.id,
      text: report.text,
      expectedType: report.expected.type,
      actualType: actual.type,
      expectedPriority: report.expected.priority,
      actualPriority: actual.priority,
    });
  }
}

const total = dataset.reports.length;

console.log(`Reports evaluated: ${total}`);
console.log(
  `Type accuracy: ${typeCorrect}/${total} (${(typeCorrect / total * 100).toFixed(1)}%)`,
);
console.log(
  `Priority accuracy: ${priorityCorrect}/${total} (${(priorityCorrect / total * 100).toFixed(1)}%)`,
);
console.log("\nClassification failures:");

for (const failure of failures) {
  console.log(JSON.stringify(failure));
}