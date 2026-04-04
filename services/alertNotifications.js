function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getWebhookUrl() {
  return readEnv("AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL");
}

function getNotificationSeverities() {
  const configured = readEnv("AI_COMMAND_CONSOLE_ALERT_WEBHOOK_SEVERITIES");
  if (!configured) {
    return ["high", "critical"];
  }

  return configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getThrottleMs() {
  const raw = readEnv("AI_COMMAND_CONSOLE_ALERT_WEBHOOK_THROTTLE_SECONDS");
  const seconds = Number.parseInt(raw || "900", 10);
  if (!Number.isFinite(seconds) || seconds < 1) {
    return 15 * 60 * 1000;
  }
  return seconds * 1000;
}

function shouldNotify(alert) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return false;
  }

  const severities = getNotificationSeverities();
  const severity = String(alert?.severity || "").toLowerCase();
  return severities.includes(severity);
}

async function sendAlertNotification(alert) {
  const webhookUrl = getWebhookUrl();
  if (!shouldNotify(alert)) {
    return { delivered: false, reason: "disabled" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "ai-command-console-alert-notifier",
    },
    body: JSON.stringify({
      source: "ai-command-console",
      category: "runtime-alert",
      sentAt: new Date().toISOString(),
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        details: alert.details || {},
        createdAt: alert.createdAt,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Alert webhook failed with ${response.status}: ${body.slice(0, 200)}`);
  }

  return {
    delivered: true,
    destination: webhookUrl,
    status: response.status,
  };
}

module.exports = {
  getThrottleMs,
  shouldNotify,
  sendAlertNotification,
};
