export type HeaderDeclaration = {name:string;value:string|null};
const SECURITY_HEADERS = ['content-security-policy','content-security-policy-report-only','x-frame-options','x-content-type-options','referrer-policy'] as const;

// Allowlist only: do not retain cookies, authorization or unrelated response headers.
export function securityHeaderEvidence(headers:Headers, hstsOnly=false):HeaderDeclaration[] {
  return (hstsOnly ? ['strict-transport-security'] : SECURITY_HEADERS).map(name=>({name,value:headers.get(name)}));
}
