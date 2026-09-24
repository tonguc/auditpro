import { readFile, writeFile } from "node:fs/promises";
import { analyzeAiAnswer } from "../lib/ai-visibility";
import { resolveAiSourceUrls } from "../lib/ai-source-resolution";

type RawObservation = {
  promptId: string;
  answer: string;
  brandMentioned: boolean;
  citedUrls: string[];
  error?: string;
};

type RawReport = {
  method: string;
  promptSetVersion?: string;
  result: {
    observations: RawObservation[];
  };
};

async function main() {
  const inputPath = process.env.AUDITPRO_AI_SOURCE_REPORT_INPUT?.trim();
  const outputPath = process.env.AUDITPRO_AI_SOURCE_REPORT_OUTPUT?.trim();
  if (!inputPath || !outputPath || inputPath === outputPath) throw new Error("Distinct input and output report paths are required.");

  const report = JSON.parse(await readFile(inputPath, "utf8")) as RawReport;
  const observations = [];
  for (const observation of report.result.observations) {
    const sources = await resolveAiSourceUrls(observation.citedUrls, 4);
    const resolvedUrls = sources.map((item) => item.resolvedUrl);
    const analyzed = analyzeAiAnswer({
      answer: observation.answer,
      brandName: "Tonguç Karacay",
      domain: "tonguckaracay.com",
      sourceUrls: resolvedUrls,
    });
    observations.push({
      promptId: observation.promptId,
      error: observation.error,
      brandMentioned: observation.brandMentioned,
      providerSourcesPresent: observation.citedUrls.length > 0,
      sourceResolutionComplete: sources.every((item) => item.state !== "unresolved"),
      sources,
      resolvedUrls,
      targetCited: analyzed.targetCited,
      competitorDomains: analyzed.competitorDomains,
    });
  }

  const successful = observations.filter((item) => !item.error);
  const sourceBacked = successful.filter((item) => item.providerSourcesPresent);
  const allSourcesResolved = sourceBacked.every((item) => item.sourceResolutionComplete);
  const competitorCounts = new Map<string, number>();
  for (const domain of sourceBacked.flatMap((item) => item.competitorDomains)) {
    competitorCounts.set(domain, (competitorCounts.get(domain) ?? 0) + 1);
  }
  const summary = {
    completed: successful.length,
    brandMentions: successful.filter((item) => item.brandMentioned).length,
    sourceBackedObservations: sourceBacked.length,
    sourceResolutionComplete: allSourcesResolved,
    unresolvedSourceUrls: sourceBacked.flatMap((item) => item.sources).filter((item) => item.state === "unresolved").length,
    targetCitationsAmongSourceBacked: sourceBacked.filter((item) => item.targetCited).length,
    resolvedSourceUrls: sourceBacked.flatMap((item) => item.resolvedUrls).length,
    uniqueResolvedSourceUrls: new Set(sourceBacked.flatMap((item) => item.resolvedUrls)).size,
    citationRate: successful.length > 0 && sourceBacked.length === successful.length && allSourcesResolved
      ? Math.round(sourceBacked.filter((item) => item.targetCited).length / successful.length * 100)
      : null,
    topSourceDomains: [...competitorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([domain, citations]) => ({ domain, citations })),
  };

  await writeFile(outputPath, JSON.stringify({
    method: "provider-source-redirect-resolution@1.0.0",
    rawMethod: report.method,
    promptSetVersion: report.promptSetVersion,
    resolvedAt: new Date().toISOString(),
    summary,
    observations,
  }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ outputPath, summary }));
}

void main();
