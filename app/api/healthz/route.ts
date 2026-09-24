import { NextResponse } from "next/server";

import { hasDatabase, query } from "@/lib/db";

export const runtime = "nodejs";

export async function healthzResponse(
  databaseConfigured = hasDatabase(),
  pingDatabase: () => Promise<unknown> = () => query("SELECT 1"),
) {
  if (databaseConfigured) {
    try {
      await pingDatabase();
    } catch {
      return NextResponse.json(
        {
          status: "error",
          checkedAt: new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET() {
  return healthzResponse();
}
