/**
 * POST /api/v1/sync/bp-webhook
 * Triggers the n8n BP sync webhook and returns the result.
 * Keeps the webhook URL server-side only.
 */

import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_BP_REFRESH_WEBHOOK
  if (!webhookUrl) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 })
  }

  try {
    const res = await fetch(webhookUrl, { method: "GET" })
    const text = await res.text()
    return Response.json({ ok: res.ok, message: text }, { status: res.ok ? 200 : 502 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Webhook call failed" }, { status: 502 })
  }
}
