import { readFile, rename, writeFile } from "node:fs/promises";
import { compareResolvedSourceReports, type ResolvedSourceReport } from "../lib/ai-source-engine-comparison";

async function main() {
  const specification = process.env.AUDITPRO_AI_ENGINE_COMPARISON_INPUTS;
  const outputPath = process.env.AUDITPRO_AI_ENGINE_COMPARISON_OUTPUT;
  if (!specification || !outputPath) throw new Error("Comparison inputs and output path are required.");
  const inputs = JSON.parse(specification) as Array<{ id: string; engine: string; round: string; path: string }>;
  const reports = await Promise.all(inputs.map(async (item) => ({
    id: item.id,
    engine: item.engine,
    round: item.round,
    report: JSON.parse(await readFile(item.path, "utf8")) as ResolvedSourceReport,
  })));
  const comparison = compareResolvedSourceReports(reports);
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(comparison, null, 2), { flag: "w" });
  await rename(temporaryPath, outputPath);
  console.log(JSON.stringify({ outputPath, reports: comparison.reports, pairwise: comparison.pairwise, publicationEligible: false }));
}

void main();
