import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({});

const MAIL_FROM = process.env.MAIL_FROM;
const MAIL_TO = process.env.MAIL_TO;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const HONEYPOT = "company";

const FORMS = {
    contact: {
        subject: "Kontaktformular",
        required: ["name", "email", "message"],
        optional: [],
        labels: { name: "Name", email: "E-Mail", message: "Nachricht" },
    },
    newsletter: {
        subject: "Newsletter-Anmeldung",
        required: ["email"],
        optional: [],
        labels: { email: "E-Mail" },
    },
    "event-booking": {
        subject: "Event-Anfrage",
        required: ["first-name", "last-name", "email", "message"],
        optional: ["phone"],
        labels: {
            "first-name": "Vorname",
            "last-name": "Nachname",
            email: "E-Mail",
            phone: "Telefon",
            message: "Nachricht",
        },
    },
};

const LIMITS = { field: 200, message: 5000, body: 20000 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const escapeHtml = (value) =>
    value.replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );

const singleLine = (value) => value.replace(/[\r\n]+/g, " ").trim();

const corsHeaders = (origin) =>
    origin && ALLOWED_ORIGINS.includes(origin)
        ? {
              "Access-Control-Allow-Origin": origin,
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Max-Age": "86400",
              Vary: "Origin",
          }
        : {};

const reply = (statusCode, body, origin) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders(origin),
    },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const origin = event.headers?.origin ?? event.headers?.Origin;
    const method = event.requestContext?.http?.method ?? "POST";

    if (method === "OPTIONS") return reply(204, {}, origin);
    if (method !== "POST")
        return reply(405, { error: "method not allowed" }, origin);

    if (ALLOWED_ORIGINS.length && origin && !ALLOWED_ORIGINS.includes(origin)) {
        return reply(403, { error: "forbidden origin" }, origin);
    }

    const raw = event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString("utf8")
        : (event.body ?? "");

    if (raw.length > LIMITS.body)
        return reply(413, { error: "payload too large" }, origin);

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        return reply(400, { error: "invalid json" }, origin);
    }

    if (!payload || typeof payload !== "object") {
        return reply(400, { error: "invalid payload" }, origin);
    }
    if (typeof payload[HONEYPOT] === "string" && payload[HONEYPOT].trim()) {
        return reply(200, { ok: true }, origin);
    }

    const form = Object.hasOwn(FORMS, payload.form) ? FORMS[payload.form] : null;
    if (!form) return reply(400, { error: "unknown form" }, origin);

    const fields = {};
    for (const name of [...form.required, ...form.optional]) {
        const value =
            typeof payload[name] === "string" ? payload[name].trim() : "";

        if (!value) {
            if (form.required.includes(name)) {
                return reply(422, { error: `missing field: ${name}` }, origin);
            }
            continue;
        }

        const limit = name === "message" ? LIMITS.message : LIMITS.field;
        if (value.length > limit)
            return reply(422, { error: `field too long: ${name}` }, origin);

        fields[name] = value;
    }

    if (!EMAIL.test(fields.email))
        return reply(422, { error: "invalid email" }, origin);

    const page =
        typeof payload.page === "string"
            ? singleLine(payload.page).slice(0, 300)
            : "";

    const rows = Object.entries(fields).map(([name, value]) => [
        form.labels[name],
        value,
    ]);
    if (page) rows.push(["Seite", page]);

    const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    const html = `<table style="font:14px/1.6 system-ui,sans-serif;border-collapse:collapse">${rows
        .map(
            ([label, value]) =>
                `<tr><td style="padding:4px 16px 4px 0;vertical-align:top;color:#666">${escapeHtml(
                    label,
                )}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}</table>`;

    try {
        await ses.send(
            new SendEmailCommand({
                FromEmailAddress: MAIL_FROM,
                Destination: { ToAddresses: [MAIL_TO] },
                ReplyToAddresses: [singleLine(fields.email)],
                Content: {
                    Simple: {
                        Subject: {
                            Data: `${form.subject} — restaurant-maseltopf.de`,
                            Charset: "UTF-8",
                        },
                        Body: {
                            Text: { Data: text, Charset: "UTF-8" },
                            Html: { Data: html, Charset: "UTF-8" },
                        },
                    },
                },
            }),
        );
    } catch (error) {
        console.error("SES send failed", error);
        return reply(502, { error: "send failed" }, origin);
    }

    return reply(200, { ok: true }, origin);
};
