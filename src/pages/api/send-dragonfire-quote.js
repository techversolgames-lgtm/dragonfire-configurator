import sgMail from "@sendgrid/mail";

/**
 * Required env (Vercel + .env.local):
 * - SENDGRID_API_KEY
 * - SENDGRID_FROM_EMAIL (verified sender)
 * - SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID (or SENDGRID_TEMPLATE_ID_DRAGONFIRE_QUOTE)
 * Optional: SENDGRID_DRAGONFIRE_QUOTE_BCC (comma-separated, merged with internal team BCC)
 *
 * Dynamic template should use the same handlebar keys as dynamicTemplateData below
 * (e.g. firstName, FirstName, Date — match your SendGrid template casing).
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

/** Team BCC on every quote (customer remains sole `to`). */
const INTERNAL_QUOTE_BCC = [
  "mac@spokbee.com",
  "karina@spokbee.com",
  "braedon@dragonfiretools.com",
  "nathanael@dragonfiretools.com",
];

function normalizeEmail(e) {
  return String(e).trim().toLowerCase();
}

/** Trim and strip one pair of wrapping quotes (common .env mistakes). */
function envString(value) {
  if (value == null) return "";
  let s = String(value).trim();
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

function firstNameFromFullName(name) {
  const s = String(name ?? "").trim();
  if (!s) return "Customer";
  return s.split(/\s+/)[0] || "Customer";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const apiKey = envString(process.env.SENDGRID_API_KEY);
  const templateId = envString(
    process.env.SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID ||
      process.env.SENDGRID_TEMPLATE_ID_DRAGONFIRE_QUOTE,
  );
  const fromEmail = envString(process.env.SENDGRID_FROM_EMAIL);

  if (!apiKey || !templateId || !fromEmail) {
    const missingEnv = [];
    if (!apiKey) missingEnv.push("SENDGRID_API_KEY");
    if (!templateId) {
      missingEnv.push(
        "SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID (or SENDGRID_TEMPLATE_ID_DRAGONFIRE_QUOTE)",
      );
    }
    if (!fromEmail) missingEnv.push("SENDGRID_FROM_EMAIL");
    return res.status(503).json({
      success: false,
      message:
        "Email is not configured. Set SENDGRID_API_KEY, SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID, and SENDGRID_FROM_EMAIL.",
      missingEnv,
      hint:
        "If you already added these in Vercel: redeploy the project (env is baked in at deploy), confirm each value is non-empty, and that this site’s deployment uses that same Vercel project.",
    });
  }

  try {
    const { form, pdfBase64 } = req.body ?? {};

    if (!form?.name || !form?.email) {
      return res.status(400).json({
        success: false,
        message: "Missing name or email",
      });
    }

    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing PDF attachment",
      });
    }

    const email = String(form.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const rawBase64 = pdfBase64.includes(",")
      ? pdfBase64.split(",").pop()
      : pdfBase64;

    const first = firstNameFromFullName(form.name);
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    sgMail.setApiKey(apiKey);

    const dynamicTemplateData = {
      firstName: first,
      FirstName: first,
      Date: dateStr,
      customerName: String(form.name).trim(),
      customerEmail: email,
      notes: String(form.notes ?? "").slice(0, 2000),
    };

    const msg = {
      to: email,
      from: fromEmail,
      templateId,
      dynamicTemplateData,
      attachments: [
        {
          content: rawBase64,
          filename: "dragonfire-quote.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    const bccSet = new Set(INTERNAL_QUOTE_BCC.map(normalizeEmail));
    const extraBcc = envString(process.env.SENDGRID_DRAGONFIRE_QUOTE_BCC);
    if (extraBcc) {
      extraBcc
        .split(",")
        .map((s) => normalizeEmail(s))
        .filter(Boolean)
        .forEach((addr) => bccSet.add(addr));
    }
    bccSet.delete(normalizeEmail(email));
    if (bccSet.size > 0) {
      msg.bcc = Array.from(bccSet);
    }

    await sgMail.send(msg);

    return res.status(200).json({ success: true, message: "Quote email sent" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("send-dragonfire-quote:", err);
    const message =
      err?.response?.body?.errors?.[0]?.message ||
      err?.message ||
      "Failed to send email";
    if (process.env.NODE_ENV === "development") {
      if (/authorization grant|invalid|expired|revoked/i.test(String(message))) {
        // eslint-disable-next-line no-console
        console.error(
          "[send-dragonfire-quote] Check SENDGRID_API_KEY: length=%s startsWithSG=%s. Restart yarn dev after .env.local changes; create a new key in SendGrid if needed.",
          apiKey.length,
          apiKey.startsWith("SG."),
        );
      }
      if (/verified Sender Identity|from address does not match/i.test(String(message))) {
        // eslint-disable-next-line no-console
        console.error(
          "[send-dragonfire-quote] SENDGRID_FROM_EMAIL must exactly match a verified sender in SendGrid (Settings → Sender Authentication). Current from=%s",
          fromEmail,
        );
      }
    }
    return res.status(500).json({ success: false, message });
  }
}
