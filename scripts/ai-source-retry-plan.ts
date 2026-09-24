import { readFile, rename, writeFile } from "node:fs/promises";

type RawReport = {
  method: string;
  promptSetVersion?: string;
  result: { observations: Array<{ promptId: string; error?: string; inputTokens: number; outputTokens: number }> };
};

async function main() {
  const inputPath = process.env.AUDITPRO_AI_RETRY_PLAN_INPUT;
  const outputPath = process.env.AUDITPRO_AI_RETRY_PLAN_OUTPUT;
  if (!inputPath || !outputPath || inputPath === outputPath) throw new Error("Distinct retry-plan input and output paths are required.");
  const report = JSON.parse(await readFile(inputPath, "utf8")) as RawReport;
  const failed = report.result.observations.filter((item) => item.error);
  const errorCounts = new Map<string, number>();
  for (const item of failed) errorCounts.set(item.error!, (errorCounts.get(item.error!) ?? 0) + 1);
  const plan = {
    method: "failed-observation-retry-plan@1.0.0",
    sourceMethod: report.method,
    promptSetVersion: report.promptSetVersion,
    generatedAt: new Date().toISOString(),
    requiresFreshExplicitApproval: true,
    automaticallyExecutable: false,
    failedPromptCount: failed.length,
    failedPromptIds: failed.map((item) => item.promptId),
    recordedFailedInputTokens: failed.reduce((total, item) => total + item.inputTokens, 0),
    recordedFailedOutputTokens: failed.reduce((total, item) => total + item.outputTokens, 0),
    errorCounts: [...errorCounts.entries()].map(([error, count]) => ({ error, count })),
  };
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(plan, null, 2), { flag: "w" });
  await rename(temporaryPath, outputPath);
  console.log(JSON.stringify(plan));
}

void main();
