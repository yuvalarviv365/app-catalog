/**
 * Notification helpers
 * Telegram: set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env
 *
 * Setup Telegram:
 *  1. Message @BotFather on Telegram → /newbot → copy the token
 *  2. Add the bot to your team channel / group
 *  3. Get chat ID: call https://api.telegram.org/bot<TOKEN>/getUpdates after sending a message
 *  4. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 */

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn("[notify] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification")
    return
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[notify] Telegram error:", err)
  }
}

export function formatHealthChangeMessage(
  appName: string,
  marketName: string,
  marketCode: string,
  previousStatus: string,
  newStatus: string,
  appSlug: string,
  appUrl?: string
): string {
  const statusEmoji: Record<string, string> = {
    HEALTHY: "✅",
    DEGRADED: "⚠️",
    OUTAGE: "🔴",
    MAINTENANCE: "🔧",
    UNKNOWN: "❓",
  }

  const emoji = statusEmoji[newStatus] ?? "❓"
  const isRecovery = newStatus === "HEALTHY"
  const header = isRecovery ? `${emoji} *App Recovered*` : `${emoji} *Health Alert*`
  const link = appUrl ? `[View App](${appUrl}/apps/${appSlug})` : `/apps/${appSlug}`

  return [
    header,
    ``,
    `*App:* ${appName}`,
    `*Market:* ${marketName} (${marketCode})`,
    `*Status:* ${previousStatus} → ${newStatus}`,
    `*Source:* Automated health check`,
    `${link}`,
  ].join("\n")
}

export function formatNewReleaseMessage(
  appName: string,
  version: string,
  packageName: string,
  rolloutPercentage?: number
): string {
  const rollout = rolloutPercentage != null && rolloutPercentage < 100
    ? ` (${rolloutPercentage}% rollout)`
    : ""

  return [
    `🚀 *New Release Detected*`,
    ``,
    `*App:* ${appName}`,
    `*Version:* \`${version}\`${rollout}`,
    `*Package:* \`${packageName}\``,
    `*Source:* Google Play Sync`,
  ].join("\n")
}
