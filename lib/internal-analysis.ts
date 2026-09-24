declare global {
  var auditProInternalAnalysisToken: string | undefined;
}

export const internalAnalysisToken =
  global.auditProInternalAnalysisToken ?? crypto.randomUUID();

global.auditProInternalAnalysisToken = internalAnalysisToken;
