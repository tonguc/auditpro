type ResolvedObservation = {
  promptId: string;
  error?: string;
  brandMentioned: boolean;
  providerSourcesPresent: boolean;
  resolvedUrls: string[];
  targetCited: boolean;
};

export type ResolvedSourceReport = {
  promptSetVersion?: string;
  summary: { completed: number };
  observations: ResolvedObservation[];
};

type NamedReport = { id: string; engine: string; round: string; report: ResolvedSourceReport };

function host(url: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function intersection<T>(left: Set<T>, right: Set<T>) {
  return [...left].filter((value) => right.has(value));
}

export function compareResolvedSourceReports(inputs: NamedReport[]) {
  if (inputs.length < 2) throw new Error("At least two resolved source reports are required.");
  const versions = new Set(inputs.map((item) => item.report.promptSetVersion).filter(Boolean));
  if (versions.size !== 1) throw new Error("Resolved reports must use the same prompt set version.");
  const reports = inputs.map(({ id, engine, round, report }) => {
    const successful = report.observations.filter((item) => !item.error);
    const sourceBacked = successful.filter((item) => item.providerSourcesPresent);
    const urls = new Set(sourceBacked.flatMap((item) => item.resolvedUrls));
    const domains = new Set([...urls].map(host).filter(Boolean));
    return {
      id, engine, round,
      attempted: report.observations.length,
      completed: successful.length,
      sourceBacked: sourceBacked.length,
      brandMentions: successful.filter((item) => item.brandMentioned).length,
      targetCitationsAmongSourceBacked: sourceBacked.filter((item) => item.targetCited).length,
      sourceUrls: [...urls].sort(),
      sourceDomains: [...domains].sort(),
      completedPromptIds: successful.map((item) => item.promptId).sort(),
      sourceBackedPromptIds: sourceBacked.map((item) => item.promptId).sort(),
    };
  });
  const pairwise = reports.flatMap((left, index) => reports.slice(index + 1).map((right) => {
    const commonUrls = intersection(new Set(left.sourceUrls), new Set(right.sourceUrls));
    const commonDomains = intersection(new Set(left.sourceDomains), new Set(right.sourceDomains));
    const commonCompletedPrompts = intersection(new Set(left.completedPromptIds), new Set(right.completedPromptIds));
    const commonSourceBackedPrompts = intersection(new Set(left.sourceBackedPromptIds), new Set(right.sourceBackedPromptIds));
    return {
      left: left.id,
      right: right.id,
      exactSourceUrlOverlap: commonUrls.length,
      sourceDomainOverlap: commonDomains.length,
      completedPromptOverlap: commonCompletedPrompts.length,
      sourceBackedPromptOverlap: commonSourceBackedPrompts.length,
      commonSourceDomains: commonDomains.sort(),
    };
  }));
  const allPromptIds = [...new Set(inputs.flatMap((item) => item.report.observations.map((observation) => observation.promptId)))];
  const promptCoverage = allPromptIds.map((promptId) => ({
    promptId,
    reportsCompleted: reports.filter((item) => item.completedPromptIds.includes(promptId)).map((item) => item.id),
    reportsSourceBacked: reports.filter((item) => item.sourceBackedPromptIds.includes(promptId)).map((item) => item.id),
  }));
  const domainCounts = new Map<string, number>();
  for (const report of reports) for (const domain of report.sourceDomains) domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
  return {
    method: "cross-engine-resolved-source-comparison@1.0.0",
    promptSetVersion: [...versions][0],
    generatedAt: new Date().toISOString(),
    reports: reports.map(({ sourceUrls: _urls, completedPromptIds: _completed, sourceBackedPromptIds: _sourceBacked, ...item }) => item),
    pairwise,
    promptCoverage,
    domainsSeenInMultipleReports: [...domainCounts.entries()].filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([domain, reportCount]) => ({ domain, reportCount })),
    publicationEligible: false,
    publicationReason: "Completed observations still lack provider source metadata, and this comparison does not establish two complete independent rounds per engine.",
  };
}
