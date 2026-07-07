/**
 * SEAM 2 (Echo) — the corpus of resolved tickets.
 *
 * Each ticket carries a `resolutionId` (the root-cause group). Multiple tickets
 * can share one resolution — that's what makes both the product ("here's how we
 * fixed this last time") and the replay eval (two tickets with the same
 * resolutionId are relevant to each other) work. `npm run seed` embeds these.
 */
export const REGISTRY_VERSION = "tickets-2026-07-06";

export interface Resolution {
  id: string;
  summary: string;
}

export interface SeedTicket {
  id: string;
  title: string;
  body: string;
  resolutionId: string;
}

export const RESOLUTIONS: Record<string, Resolution> = {
  "reset-email-spf": {
    id: "reset-email-spf",
    summary:
      "Password-reset emails were landing in spam due to a missing SPF record. Added the provider to the domain's SPF TXT record; deliverability restored within an hour.",
  },
  "oauth-clock-skew": {
    id: "oauth-clock-skew",
    summary:
      "SSO logins failed intermittently because the auth server's clock had drifted. Re-enabled NTP sync on the node; token `iat`/`exp` validation passed again.",
  },
  "csv-export-timeout": {
    id: "csv-export-timeout",
    summary:
      "Large CSV exports timed out at the 30s gateway limit. Moved export to a background job that emails a signed download link when ready.",
  },
  "mobile-upload-heic": {
    id: "mobile-upload-heic",
    summary:
      "iPhone photo uploads failed because HEIC wasn't an accepted MIME type. Added HEIC to the allowlist and server-side conversion to JPEG.",
  },
};

export const SEED_TICKETS: SeedTicket[] = [
  // reset-email-spf
  { id: "t-1001", resolutionId: "reset-email-spf", title: "Didn't get the password reset email", body: "I clicked forgot password three times and nothing shows up in my inbox. Checked spam too." },
  { id: "t-1002", resolutionId: "reset-email-spf", title: "Reset link never arrives", body: "Our whole team says the account recovery email doesn't come through. Gmail users especially." },
  { id: "t-1003", resolutionId: "reset-email-spf", title: "Forgot-password emails going to junk", body: "When they do arrive they're in the spam folder. Can you fix deliverability?" },

  // oauth-clock-skew
  { id: "t-1010", resolutionId: "oauth-clock-skew", title: "SSO login fails randomly", body: "Signing in with Okta works sometimes and fails other times with an invalid token error." },
  { id: "t-1011", resolutionId: "oauth-clock-skew", title: "Intermittent 'token not yet valid'", body: "Single sign-on throws token timestamp errors on and off throughout the day." },

  // csv-export-timeout
  { id: "t-1020", resolutionId: "csv-export-timeout", title: "Export to CSV hangs and then errors", body: "Exporting the full customer list spins for about thirty seconds then shows a gateway error." },
  { id: "t-1021", resolutionId: "csv-export-timeout", title: "Large report download times out", body: "Small exports are fine but the big monthly report never finishes downloading." },

  // mobile-upload-heic
  { id: "t-1030", resolutionId: "mobile-upload-heic", title: "Can't upload photos from my iPhone", body: "Every image I pick from my camera roll fails to upload. Works fine from my laptop." },
  { id: "t-1031", resolutionId: "mobile-upload-heic", title: "Photo upload rejected on mobile", body: "Uploading a picture taken on iOS gives an unsupported file type error." },
];
