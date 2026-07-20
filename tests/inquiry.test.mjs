import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import inquiryHandler from "../netlify/functions/inquiry.mjs";

const PROJECT_VALUES = {
  projectTypes: [
    "website-design",
    "website-redesign",
    "brand-identity",
    "landing-page",
    "other",
  ],
  primaryGoals: [
    "generate-leads",
    "increase-credibility",
    "launch-new-business",
    "improve-user-experience",
    "other",
  ],
  timelines: ["asap", "within-one-month", "one-to-three-months", "flexible"],
};

const validSubmission = {
  full_name: "Ada Lovelace",
  email: "ada@example.com",
  business_name: "Analytical Engines",
  project_type: "website-redesign",
  primary_goal: "increase-credibility",
  timeline: "one-to-three-months",
  project_details: "We need a clearer website for our growing consultancy.",
};

const makeRequest = (body = validSubmission, headers = {}) =>
  new Request("https://example.com/api/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const withEmailEnvironment = async (callback) => {
  const previousValues = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    INQUIRY_TO_EMAIL: process.env.INQUIRY_TO_EMAIL,
    INQUIRY_FROM_EMAIL: process.env.INQUIRY_FROM_EMAIL,
  };

  process.env.RESEND_API_KEY = "test_key";
  process.env.INQUIRY_TO_EMAIL = "noirwebstudio@gmail.com";
  process.env.INQUIRY_FROM_EMAIL = "NoirWeb Studio <inquiries@example.com>";

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previousValues)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

test("the form includes every required field and allowed dropdown value", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const requiredFields = [
    "full_name",
    "email",
    "business_name",
    "project_type",
    "primary_goal",
    "timeline",
    "project_details",
  ];
  const dropdownValues = [
    ...PROJECT_VALUES.projectTypes,
    ...PROJECT_VALUES.primaryGoals,
    ...PROJECT_VALUES.timelines,
  ];

  for (const field of requiredFields) {
    assert.match(html, new RegExp(`name="${field}"[^>]*required`));
  }

  for (const value of dropdownValues) {
    assert.match(html, new RegExp(`value="${value}"`));
  }
});

test("rejects incomplete or invalid submissions", async () => {
  const response = await inquiryHandler(
    makeRequest({ ...validSubmission, timeline: "not-a-real-option" }),
  );

  assert.equal(response.status, 422);
});

test("silently accepts honeypot submissions without sending", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };

  try {
    const response = await inquiryHandler(
      makeRequest({ ...validSubmission, "bot-field": "spam" }),
    );
    assert.equal(response.status, 200);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sends every form value to the configured business email", async () => {
  const originalFetch = globalThis.fetch;
  let outboundRequest;
  globalThis.fetch = async (url, options) => {
    outboundRequest = { url, options };
    return Response.json({ id: "email_123" });
  };

  try {
    const response = await withEmailEnvironment(() =>
      inquiryHandler(makeRequest(validSubmission, { "Idempotency-Key": "inquiry-test-123" })),
    );
    const email = JSON.parse(outboundRequest.options.body);

    assert.equal(response.status, 200);
    assert.equal(outboundRequest.url, "https://api.resend.com/emails");
    assert.ok(outboundRequest.options.signal instanceof AbortSignal);
    assert.deepEqual(email.to, ["noirwebstudio@gmail.com"]);
    assert.equal(email.reply_to, validSubmission.email);
    assert.match(email.text, /Ada Lovelace/);
    assert.match(email.text, /Website Redesign/);
    assert.match(email.text, /Increase Credibility/);
    assert.match(email.text, /1–3 Months/);
    assert.match(email.text, /clearer website/);
    assert.equal(
      outboundRequest.options.headers["Idempotency-Key"],
      "noirweb-inquiry-test-123",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns a safe failure when the email provider rejects delivery", async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  globalThis.fetch = async () => new Response(null, { status: 403 });
  console.error = () => {};

  try {
    const response = await withEmailEnvironment(() =>
      inquiryHandler(makeRequest()),
    );
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.equal(body.message, "We couldn't send your inquiry right now.");
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
