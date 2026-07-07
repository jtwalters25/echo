/**
 * Curated demo inputs — one click removes the "go find a ticket" friction.
 *
 * Chosen to exercise the confidence bands against the seeded corpus: a near-
 * paraphrase of a resolved ticket (SEEN_BEFORE), an adjacent issue (SIMILAR),
 * and something unrelated (NOVEL). `scripts/build-fixtures.ts` runs the real
 * search() over these and writes fixtures.json, so the demo serves precomputed
 * results instantly — cold-start-proof, zero API cost — while staying genuine.
 */
import type { Confidence } from "./rank";

export interface Example {
  id: string;
  /** For the chip label / demonstration; actual band comes from live embeddings. */
  expected: Confidence;
  title: string;
  body: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "reset-paraphrase",
    expected: "SEEN_BEFORE",
    title: "Password reset email never shows up",
    body: "I've requested a password reset several times and the email never lands in my inbox — not even in the spam folder. Can't get back into my account.",
  },
  {
    id: "export-adjacent",
    expected: "SIMILAR",
    title: "Downloading the big report is really slow",
    body: "When I try to pull the full monthly customer report it takes forever and sometimes just fails partway through.",
  },
  {
    id: "darkmode-novel",
    expected: "NOVEL",
    title: "Dashboard chart colors look wrong in dark mode",
    body: "On the analytics dashboard the bar chart uses a low-contrast palette in dark mode that's hard to read. Light mode is fine.",
  },
];
