import { NextRequest, NextResponse } from "next/server";

import { query, transaction } from "@/lib/db";
import { errorName, logOperation, operationResponse, requestIdFromHeaders, stableLogHash } from "@/lib/operation-log";
import { assertCanMutateOrganization, ForbiddenError, requireOrganization, UnauthorizedError } from "@/lib/server-session";

type AuditDocument = {
  id: string;
  url: string;
  clientName: string;
  industry?: string;
  clientLogo?: string;
  date: string;
  results: Record<string, unknown>;
  notes?: Record<string, unknown>;
  scan?: Record<string, unknown>;
  workflow?: Record<string, unknown>;
};

const noStoreHeaders = { "Cache-Control": "no-store" };

async function parseAuditDocumentRequestBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, error: "Request body must be an audit document." };
    }
    return { ok: true as const, body };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

function validDocument(value: unknown): value is AuditDocument {
  if (!value || typeof value !== "object") return false;
  const audit = value as Partial<AuditDocument>;
  return (
    typeof audit.id === "string" &&
    audit.id.length > 0 &&
    audit.id.length <= 160 &&
    typeof audit.url === "string" &&
    audit.url.length <= 2048 &&
    typeof audit.clientName === "string" &&
    audit.clientName.length <= 240 &&
    typeof audit.date === "string" &&
    Boolean(audit.results) &&
    typeof audit.results === "object"
  );
}

function errorResponse(error: unknown, requestId: string, startedAt: number, operation: string) {
  if (error instanceof UnauthorizedError) {
    logOperation({
      level: "warn",
      component: "api",
      operation,
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "unauthorized", statusCode: 401 },
    });
    return operationResponse({ error: error.message }, { status: 401, headers: noStoreHeaders }, requestId);
  }
  if (error instanceof ForbiddenError) {
    logOperation({
      level: "warn",
      component: "api",
      operation,
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "forbidden", statusCode: 403 },
    });
    return operationResponse({ error: error.message }, { status: 403, headers: noStoreHeaders }, requestId);
  }
  logOperation({
    level: "error",
    component: "api",
    operation,
    requestId,
    status: "error",
    durationMs: Date.now() - startedAt,
    metadata: { error: errorName(error), statusCode: 500 },
  });
  return operationResponse(
    { error: "Audit storage is temporarily unavailable." },
    { status: 500, headers: noStoreHeaders },
    requestId,
  );
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const organization = await requireOrganization(request.headers);
    const result = await query<{ document: AuditDocument }>(
      `SELECT jsonb_build_object(
         'id', a.external_id,
         'url', p.domain,
         'clientName', p.client_name,
         'industry', p.industry,
         'clientLogo', COALESCE(p.logo_url, ''),
         'date', a.created_at,
         'results', a.results,
         'notes', a.notes,
         'scan', a.scan,
         'workflow', a.workflow
       ) AS document
       FROM audits a
       JOIN projects p ON p.id = a.project_id
       WHERE p.organization_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [organization.organization_id],
    );

    logOperation({
      level: "info",
      component: "api",
      operation: "audits.list",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { count: result.rows.length },
    });
    return operationResponse({ audits: result.rows.map((row) => row.document) }, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, startedAt, "audits.list");
  }
}

export async function PUT(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const organization = await requireOrganization(request.headers);
    assertCanMutateOrganization(organization.role);
    const parsedBody = await parseAuditDocumentRequestBody(request);
    if (!parsedBody.ok) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "audits.upsert",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_body", statusCode: 400 },
      });
      return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);
    }
    const document: unknown = parsedBody.body;
    if (!validDocument(document)) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "audits.upsert",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_document", statusCode: 400 },
      });
      return operationResponse({ error: "Invalid audit document." }, { status: 400, headers: noStoreHeaders }, requestId);
    }

    await transaction(async (client) => {
      const project = await client.query<{ id: string }>(
        `INSERT INTO projects (organization_id, client_name, domain, industry, logo_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (organization_id, domain) DO UPDATE SET
           client_name = EXCLUDED.client_name,
           industry = EXCLUDED.industry,
           logo_url = EXCLUDED.logo_url,
           updated_at = now()
         RETURNING id`,
        [
          organization.organization_id,
          document.clientName,
          document.url,
          document.industry ?? "",
          document.clientLogo || null,
        ],
      );

      await client.query(
        `INSERT INTO audits (
           project_id, external_id, status, requested_pages, analyzed_pages,
           checked_items, score, grade, results, notes, scan, workflow, completed_at, created_at
         ) VALUES (
           $1, $2, 'completed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12
         )
         ON CONFLICT (project_id, external_id) DO UPDATE SET
           status = EXCLUDED.status,
           requested_pages = EXCLUDED.requested_pages,
           analyzed_pages = EXCLUDED.analyzed_pages,
           checked_items = EXCLUDED.checked_items,
           score = EXCLUDED.score,
           grade = EXCLUDED.grade,
           results = EXCLUDED.results,
           notes = EXCLUDED.notes,
           scan = EXCLUDED.scan,
           workflow = EXCLUDED.workflow,
           completed_at = EXCLUDED.completed_at`,
        [
          project.rows[0].id,
          document.id,
          Number(document.scan?.pageLimit ?? 1),
          Number(document.scan?.pagesAnalyzed ?? 0),
          Object.keys(document.results).length,
          null,
          null,
          document.results,
          document.notes ?? {},
          document.scan ?? {},
          document.workflow ?? {},
          new Date(document.date),
        ],
      );
    });

    logOperation({
      level: "info",
      component: "api",
      operation: "audits.upsert",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { auditHash: stableLogHash(document.id), resultItems: Object.keys(document.results).length },
    });
    return operationResponse({ ok: true }, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, startedAt, "audits.upsert");
  }
}

export async function DELETE(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const organization = await requireOrganization(request.headers);
    assertCanMutateOrganization(organization.role);
    const id = request.nextUrl.searchParams.get("id");
    if (!id || id.length > 160) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "audits.delete",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_id", statusCode: 400 },
      });
      return operationResponse({ error: "Audit id is required." }, { status: 400, headers: noStoreHeaders }, requestId);
    }

    await query(
      `DELETE FROM audits a
       USING projects p
       WHERE a.project_id = p.id
         AND p.organization_id = $1
         AND a.external_id = $2`,
      [organization.organization_id, id],
    );

    logOperation({
      level: "info",
      component: "api",
      operation: "audits.delete",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { auditHash: stableLogHash(id) },
    });
    return operationResponse({ ok: true }, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    return errorResponse(error, requestId, startedAt, "audits.delete");
  }
}
