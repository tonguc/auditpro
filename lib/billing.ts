import { hasDatabase, transaction } from "@/lib/db";
import { isPlanId, type PlanId } from "@/lib/plans";

export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export type BillingProvider = "stripe" | "manual";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "inactive";

export type BillingSyncInput = {
  organizationId: string;
  provider: BillingProvider;
  providerCustomerId?: string;
  providerSubscriptionId: string;
  providerPriceId?: string;
  planId?: PlanId;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  providerEventCreated?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
};

export type BillingSyncResult = {
  ok: true;
  planId: PlanId;
  accessPlanId: PlanId;
  duplicate: boolean;
};

export type BillingEventRecord = {
  provider: BillingProvider;
  eventId: string;
  organizationId?: string;
  payload?: Record<string, unknown>;
};

const statusValues: SubscriptionStatus[] = ["active", "trialing", "past_due", "canceled", "incomplete", "inactive"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return typeof value === "string" && statusValues.includes(value as SubscriptionStatus);
}

export function isBillingProvider(value: unknown): value is BillingProvider {
  return value === "stripe" || value === "manual";
}

export function isSubscriptionActive(status: SubscriptionStatus) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]);
}

export function billingPricePlanMap(env: NodeJS.ProcessEnv = process.env): Record<string, PlanId> {
  const entries: Array<[string | undefined, PlanId]> = [
    [env.AUDITPRO_STRIPE_PRO_PRICE_ID, "pro"],
    [env.AUDITPRO_STRIPE_AGENCY_PRICE_ID, "agency"],
    [env.AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID, "enterprise"],
  ];
  return Object.fromEntries(entries.filter((entry): entry is [string, PlanId] => Boolean(entry[0])));
}

export function planFromBillingInput(input: Pick<BillingSyncInput, "planId" | "providerPriceId">, env: NodeJS.ProcessEnv = process.env) {
  if (!input.providerPriceId) return undefined;
  return billingPricePlanMap(env)[input.providerPriceId];
}

export function planFromManualBillingInput(input: Pick<BillingSyncInput, "planId">) {
  return input.planId && isPlanId(input.planId) ? input.planId : undefined;
}

export function accessPlanForSubscription(planId: PlanId, status: SubscriptionStatus): PlanId {
  return isSubscriptionActive(status) ? planId : "free";
}

export function validateBillingSyncInput(value: unknown): BillingSyncInput {
  if (!value || typeof value !== "object") throw new Error("Invalid billing payload.");
  const input = value as Partial<BillingSyncInput>;
  if (typeof input.organizationId !== "string" || !input.organizationId) throw new Error("organizationId is required.");
  if (!uuidPattern.test(input.organizationId)) throw new Error("organizationId must be a UUID.");
  if (!isBillingProvider(input.provider)) throw new Error("Unsupported billing provider.");
  if (typeof input.providerSubscriptionId !== "string" || !input.providerSubscriptionId) throw new Error("providerSubscriptionId is required.");
  if (!isSubscriptionStatus(input.status)) throw new Error("Unsupported subscription status.");
  if (input.planId !== undefined && !isPlanId(input.planId)) throw new Error("Unsupported plan.");
  if (input.currentPeriodEnd !== undefined && Number.isNaN(Date.parse(input.currentPeriodEnd))) throw new Error("currentPeriodEnd must be an ISO date.");
  if (input.providerEventCreated !== undefined && Number.isNaN(Date.parse(input.providerEventCreated))) throw new Error("providerEventCreated must be an ISO date.");
  return {
    organizationId: input.organizationId,
    provider: input.provider,
    providerCustomerId: input.providerCustomerId,
    providerSubscriptionId: input.providerSubscriptionId,
    providerPriceId: input.providerPriceId,
    planId: input.planId,
    status: input.status,
    currentPeriodEnd: input.currentPeriodEnd,
    providerEventCreated: input.providerEventCreated,
    eventId: input.eventId,
    metadata: input.metadata,
  };
}

export async function syncSubscription(input: BillingSyncInput): Promise<BillingSyncResult> {
  if (!hasDatabase()) throw new Error("Database is required for billing sync.");
  const initialPlanId = input.provider === "manual"
    ? planFromManualBillingInput(input)
    : planFromBillingInput(input);

  return transaction(async (client) => {
    let planId = initialPlanId;
    if (!planId && input.provider === "stripe" && !isSubscriptionActive(input.status)) {
      const existing = await client.query<{ plan_id: PlanId }>(
        `SELECT plan_id
         FROM subscriptions
         WHERE organization_id = $1
           AND (provider_subscription_id = $2 OR provider = 'stripe')
         ORDER BY (provider_subscription_id = $2) DESC, updated_at DESC
         LIMIT 1`,
        [input.organizationId, input.providerSubscriptionId],
      );
      planId = existing.rows[0]?.plan_id;
    }
    if (!planId) throw new Error("No plan is mapped for this billing event.");
    const accessPlanId = accessPlanForSubscription(planId, input.status);

    if (input.eventId) {
      const event = await client.query(
        `INSERT INTO billing_events (provider, event_id, organization_id, payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, event_id) DO NOTHING
         RETURNING event_id`,
        [input.provider, input.eventId, input.organizationId, input],
      );
      if (!event.rowCount) return { ok: true, planId, accessPlanId, duplicate: true };
    }

    await client.query(
      `INSERT INTO subscriptions (
         organization_id, provider, provider_customer_id, provider_subscription_id,
         provider_price_id, plan_id, status, current_period_end, provider_event_created, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (organization_id) DO UPDATE SET
         provider = EXCLUDED.provider,
         provider_customer_id = EXCLUDED.provider_customer_id,
         provider_subscription_id = EXCLUDED.provider_subscription_id,
         provider_price_id = EXCLUDED.provider_price_id,
         plan_id = EXCLUDED.plan_id,
         status = EXCLUDED.status,
         current_period_end = EXCLUDED.current_period_end,
         provider_event_created = EXCLUDED.provider_event_created,
         metadata = EXCLUDED.metadata,
         updated_at = now()
       WHERE subscriptions.provider_event_created IS NULL
          OR EXCLUDED.provider_event_created >= subscriptions.provider_event_created`,
      [
        input.organizationId,
        input.provider,
        input.providerCustomerId ?? null,
        input.providerSubscriptionId,
        input.providerPriceId ?? null,
        planId,
        input.status,
        input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
        input.providerEventCreated ? new Date(input.providerEventCreated) : null,
        input.metadata ?? {},
      ],
    );

    const currentSubscription = await client.query<{ status: SubscriptionStatus; plan_id: PlanId }>(
      `SELECT status, plan_id
       FROM subscriptions
       WHERE organization_id = $1`,
      [input.organizationId],
    );
    const current = currentSubscription.rows[0];
    let currentAccessPlanId = accessPlanId;
    if (current) {
      currentAccessPlanId = accessPlanForSubscription(current.plan_id, current.status);
      await client.query(
        `UPDATE organizations
         SET plan_id = $2, updated_at = now()
         WHERE id = $1`,
        [input.organizationId, currentAccessPlanId],
      );
    }

    return { ok: true, planId, accessPlanId: currentAccessPlanId, duplicate: false };
  });
}

export async function recordBillingEvent(input: BillingEventRecord) {
  if (!hasDatabase()) throw new Error("Database is required for billing events.");
  const result = await transaction((client) => client.query(
    `INSERT INTO billing_events (provider, event_id, organization_id, payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, event_id) DO NOTHING
     RETURNING event_id`,
    [input.provider, input.eventId, input.organizationId ?? null, input.payload ?? {}],
  ));
  return { duplicate: !result.rowCount };
}
