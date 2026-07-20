const PROJECT_TYPES = new Set([
  "website-design",
  "website-redesign",
  "brand-identity",
  "landing-page",
  "other",
]);

const PRIMARY_GOALS = new Set([
  "generate-leads",
  "increase-credibility",
  "launch-new-business",
  "improve-user-experience",
  "other",
]);

const TIMELINES = new Set([
  "asap",
  "within-one-month",
  "one-to-three-months",
  "flexible",
]);

const LABELS = {
  project_type: {
    "website-design": "Website Design",
    "website-redesign": "Website Redesign",
    "brand-identity": "Brand Identity",
    "landing-page": "Landing Page",
    other: "Other",
  },
  primary_goal: {
    "generate-leads": "Generate Leads",
    "increase-credibility": "Increase Credibility",
    "launch-new-business": "Launch a New Business",
    "improve-user-experience": "Improve User Experience",
    other: "Other",
  },
  timeline: {
    asap: "ASAP",
    "within-one-month": "Within 1 Month",
    "one-to-three-months": "1–3 Months",
    flexible: "Flexible",
  },
};

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

const clean = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const escapeHtml = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

function validateSubmission(payload) {
  const submission = {
    full_name: clean(payload.full_name, 120),
    email: clean(payload.email, 254).toLowerCase(),
    business_name: clean(payload.business_name, 160),
    project_type: clean(payload.project_type, 50),
    primary_goal: clean(payload.primary_goal, 50),
    timeline: clean(payload.timeline, 50),
    project_details: clean(payload.project_details, 5000),
    bot_field: clean(payload["bot-field"] ?? payload.bot_field, 200),
  };

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email);
  const isValid =
    submission.full_name.length >= 2 &&
    emailIsValid &&
    submission.business_name.length >= 2 &&
    PROJECT_TYPES.has(submission.project_type) &&
    PRIMARY_GOALS.has(submission.primary_goal) &&
    TIMELINES.has(submission.timeline) &&
    submission.project_details.length >= 10;

  return { isValid, submission };
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed." }, 405);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ message: "Please check the form and try again." }, 400);
  }

  const { isValid, submission } = validateSubmission(payload ?? {});

  // Give bots a normal-looking response without sending an email.
  if (submission.bot_field) {
    return json({ ok: true });
  }

  if (!isValid) {
    return json({ message: "Please complete every field and try again." }, 422);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.INQUIRY_TO_EMAIL;
  const fromEmail = process.env.INQUIRY_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    console.error("Inquiry email environment variables are not configured.");
    return json({ message: "Inquiry delivery is temporarily unavailable." }, 503);
  }

  const rows = [
    ["Full Name", submission.full_name],
    ["Email", submission.email],
    ["Business", submission.business_name],
    ["Project Type", LABELS.project_type[submission.project_type]],
    ["Primary Goal", LABELS.primary_goal[submission.primary_goal]],
    ["Timeline", LABELS.timeline[submission.timeline]],
    ["Project Details", submission.project_details],
  ];
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n\n");
  const html = rows
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const suppliedIdempotencyKey = request.headers.get("Idempotency-Key") ?? "";
  const idempotencyKey = /^[a-zA-Z0-9._-]{8,200}$/.test(suppliedIdempotencyKey)
    ? `noirweb-${suppliedIdempotencyKey}`
    : `noirweb-${crypto.randomUUID()}`;

  let emailResponse;

  try {
    emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": "NoirWeb-Studio-Inquiry/1.0",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: submission.email,
        subject: `New project inquiry from ${submission.full_name}`,
        text,
        html,
      }),
    });
  } catch (error) {
    console.error("Inquiry email request failed.", error);
    return json({ message: "We couldn't send your inquiry right now." }, 502);
  }

  if (!emailResponse.ok) {
    console.error("Inquiry email provider rejected the request.", emailResponse.status);
    return json({ message: "We couldn't send your inquiry right now." }, 502);
  }

  return json({ ok: true });
};

export const config = {
  path: "/api/inquiry",
  method: "POST",
};
