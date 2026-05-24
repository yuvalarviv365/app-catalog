/**
 * Redash API client
 *
 * Executes parameterized queries via the Jobs API:
 *   POST /api/queries/{id}/results  → inline result OR job id
 *   Poll GET /api/jobs/{jobId}      → wait if async
 */

const REDASH_BASE_URL = process.env.REDASH_BASE_URL ?? ""
const REDASH_API_KEY  = process.env.REDASH_API_KEY  ?? ""

// ── Types ─────────────────────────────────────────────────────────────────────

interface RedashJob {
  id: string
  status: number        // 1=pending 2=started 3=done 4=error 5=cancelled
  query_result_id: number | null
  error: string
}

interface RedashQueryResult<T> {
  id: number
  data: {
    columns: { name: string; type: string }[]
    rows: T[]
  }
}

// JSON response rows have typed values (numbers, ISO date strings)
export interface BPRow {
  application: string
  mergeduatype: string | null   // "Organic" | "UA" | null
  version: string
  date_trunc: string            // ISO datetime e.g. "2026-05-23T00:00:00"
  first_opened: number
  first_bp: number
  perc: number
  af_coverage: number | null
  median_af_params_load: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function apiUrl(path: string, apiKey = REDASH_API_KEY) {
  return `${REDASH_BASE_URL}${path}?api_key=${apiKey}`
}

async function pollJob(jobId: string, apiKey: string, timeoutMs = 90_000): Promise<number> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(apiUrl(`/api/jobs/${jobId}`, apiKey), { cache: "no-store" })
    if (!res.ok) throw new Error(`Job poll error: ${res.status}`)
    const { job } = await res.json() as { job: RedashJob }
    if (job.status === 3 && job.query_result_id) return job.query_result_id
    if (job.status === 4) throw new Error(`Redash query failed: ${job.error}`)
    if (job.status === 5) throw new Error("Redash job was cancelled")
  }
  throw new Error("Redash query timed out after 90s")
}

async function fetchResultById<T>(resultId: number, apiKey: string): Promise<T[]> {
  const res = await fetch(apiUrl(`/api/query_results/${resultId}`, apiKey), { cache: "no-store" })
  if (!res.ok) throw new Error(`Result fetch error: ${res.status}`)
  const body = await res.json() as { query_result: RedashQueryResult<T> }
  return body.query_result.data.rows
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Execute a parameterized Redash query and return typed row objects.
 * Uses max_age=3600 — reuses cached result if less than 1 hour old.
 */
export async function executeRedashQuery<T = Record<string, unknown>>(
  queryId: string | number,
  parameters: Record<string, unknown>,
  apiKey = REDASH_API_KEY,
): Promise<{ rows: T[] }> {
  const res = await fetch(apiUrl(`/api/queries/${queryId}/results`, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parameters, max_age: 3600 }),
    cache: "no-store",
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Redash error: ${res.status} — ${body}`)
  }

  const body = await res.json() as {
    query_result?: RedashQueryResult<T>
    job?: { id: string }
  }

  // Case 1: data returned inline (cached result)
  if (body.query_result?.data?.rows) {
    return { rows: body.query_result.data.rows }
  }

  // Case 2: async job — poll then fetch
  if (body.job?.id) {
    const resultId = await pollJob(body.job.id, apiKey)
    const rows = await fetchResultById<T>(resultId, apiKey)
    return { rows }
  }

  throw new Error(`Unexpected Redash response shape: ${JSON.stringify(body).slice(0, 200)}`)
}
