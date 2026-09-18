# Reviewing Isabel’s pressing submissions

The site collects evidence at `/vinyl/identify` or `/vinyl/<album-id>/identify`.
Photos are uploaded individually to the existing `vinyl-covers` bucket under
`pressing/<album-id>/`. Drafts and submission state live separately in
`vinyl_pressing_submissions`, so ordinary album edits cannot erase the evidence.
Typed matrices are now checked automatically on submit using Discogs lookups; photos and uncertain matches remain pending for Baylor. There are no AI calls or paid AI credentials.
The existing Discogs token is used only for Discogs database lookups/prices.

## Isabel’s workflow

1. New albums collect matrix text or photos directly in **Add a record**, using the same cover uploads. Saving creates a pending review when complete, otherwise a draft. Existing albums keep their **Identify this pressing** link.
2. For an opened album, saved front/back covers replace the need to type a catalog number or photograph every center label. If covers are missing, a catalog number or every center label remains an alternative.
   Add complete runout text OR readable close-ups for every side. Both photos and
   text are welcome. Choose the number of discs first. Label photos, back/spine,
   barcode, color, stickers and extras help distinguish close candidates.
3. For a sealed album, keep it sealed: reuse saved album front/back photos (upload only missing views) for exterior review. Barcode/catalog typing is optional. An exact match may remain unresolved.
4. Optionally record separate media/jacket grades, inspection method, condition notes
   and extras. Unknown is a valid choice. These describe her copy, not the release.
5. **Save & identify** first saves the evidence, then runs a bounded automatic lookup (up to 12 releases, about 25 seconds). Only a complete, unique, all-side text match with no unresolved competing release can confirm. Case and whitespace are normalized; symbols, words and digits are preserved. Missing identifiers, ambiguous variant groupings, conflicting details, timeouts and API failures leave a pending manual review with a result note. Matrix variants are never mixed across sides. The existing revision-checked RPC saves confirmations atomically. A database match is not an appraisal or a guarantee that Discogs contains every edition.
6. **Save draft** preserves incomplete work. **Save & identify** requires
   the minimum evidence. Unresolved submissions stay pending for Baylor; no email,
   text, notification, or automatic AI processing is sent.
7. Review notes and requests for more details appear on the same page. Saving new
   evidence reopens the review and invalidates the album’s prior confirmation.

Uploaded photos must still be attached by saving the draft/submission. The form warns
before a browser unload with unsaved changes. Image format support depends on the
browser; use JPG/PNG if a HEIC image cannot be opened. Originals are resized to a
maximum dimension of 2800 pixels at high JPEG quality; check legibility before submission.
Evidence photos share the collection’s existing public image visibility.

## Baylor / Codex workflow

Use Node 22.18+ from the project root with the existing `.env.local` credentials:
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DISCOGS_TOKEN`.
Never copy credentials into review files or chat output.

```bash
npm run vinyl:discogs -- export
```

This reads only ready **pending** submissions, downloads photos, and writes a dated,
gitignored `vinyl-review/` folder with `manifest.json`, `decisions.json`, and `REVIEW.md`.
It does not claim or mark submissions processed. Drafts, completed reviews, and
requests awaiting Isabel’s response are excluded. No paid AI API is called.
The queue requires actual stored submissions; older `discogsVerified` flags do not
count as evidence reviews.

Ask Codex:

> Process the pending vinyl pressing submissions. Run the export, read REVIEW.md,
> inspect each submission’s photos/runouts, compare Discogs releases, and save only
> evidence-supported decisions. Ask Isabel for a specific missing detail when ambiguous.

To fetch a candidate’s full metadata, identifiers, notes and image URLs:

```bash
npm run vinyl:discogs -- release 12345
```

The manifest also includes existing album photos in `record.coverImage` and `record.backCoverImage`. Reuse these for packaging review; do not ask for duplicate uploads. Inspect them as supporting evidence, not proof of an edition on their own.

Candidate search results are a convenience, not exhaustive. Broaden searches on
Discogs if the initial catalog/artist/title/barcode query misses. Inspect release
images and all side identifiers. Do not trust cover/title similarity, search rank,
catalog number alone, a copyright date, or old imported record metadata as proof.
Runout variants may belong to the same release. Never invent a year or select a
closest match when the physical edition cannot be established.

Each reviewed decision needs `recordId`, the exported `revision`, `status`, and
meaningful `notes`. A `confirmed` decision also needs the exact numeric `releaseId`
and `physicalEvidenceConfirmed: true`. Record which markings/labels/packaging support
that match and how alternatives were excluded. Use `needs_info` with a specific
question, or `no_match` if no exact database entry can be found. Unreviewed rows must
be removed from the decisions file before applying.

```bash
npm run vinyl:discogs -- apply vinyl-review/<timestamp>/decisions.json
npm run vinyl:discogs -- apply vinyl-review/<timestamp>/decisions.json --write
```

The first command is a dry run. The second applies reviewed decisions. Metadata is
fetched from the chosen Discogs release, never invented in the decisions file. It
updates pressing year, label, catalog number, country, vinyl format/count and pressing
notes, while preserving personal information and original album year. Unknown Discogs
values clear previous guesses. The physical evidence remains available separately.
A revision check rejects stale exports. Each album update and its review outcome
commit atomically through a service-role-only database function. Results are read back.
If a multi-record run stops after some successful saves, re-export the remaining queue;
completed rows cannot be applied twice.

A confirmed pressing is **not a completed appraisal**. Discogs price suggestions use
media grade; they do not automatically account for jacket condition, missing extras,
or comparable recent sales. Blank/new/sealed condition is not silently treated as
VG+ or Mint. Current asking prices remain separate and are not fallback collection values.

## After a confirm: curate the facts

The album page shows an "Interesting facts about this pressing" card. By default it's
built automatically from the confirmed release's raw Discogs notes, run through a
denylist of boring-line patterns in `src/lib/vinylRecordUtils.ts` (copyright/phonogram
lines, publishing-rights boilerplate, pure matrix-engraving mechanics, purely cosmetic
printing trivia). That denylist is a floor, not a finish line -- Discogs' notes are
free-form prose from thousands of different contributors, so no fixed pattern list will
catch everything or add real color on its own.

Whenever a decision applies with `status: "confirmed"`, the apply command prints a
reminder to also set that record's `curatedFacts` (an array of strings on the record,
which the facts card prefers over the auto-filtered notes whenever it's present). Do
this as part of the same review, not a separate pass:

1. Read through the confirmed release's actual notes and pick only what's genuinely
   interesting -- skip anything that's just describing packaging/printing mechanics
   with no story to it.
2. Add 1-2 real facts about the album or artist (chart history, production trivia,
   a notable quote, cultural context) -- only things you're confident are factually
   accurate. Skip a record entirely rather than pad it with a guess.
3. Add one fact about this *specific pressing* when you have one available -- the
   matrix/runout detail, plant symbol, or label variation that's literally why this
   release (and not a lookalike) was the confirmed match is usually the most
   collector-interesting fact of all, and it's sitting right there in your own
   decision notes even when Discogs' own release notes don't mention it.
4. Update the record with a direct Supabase write (`record.curatedFacts = [...]`,
   merge onto the existing record, update by id) -- there's no UI for this field yet.

## Setup and checks

Migration: `20260917025017_vinyl_pressing_submissions.sql`.
The queue table has RLS and no anon/authenticated grants. Its public-facing Next.js
routes use the same server-managed access model as the existing collection editor;
there is no new login system. Terminal review writes use the service role only.

```bash
npm run test:pressings
npx tsc --noEmit
npm run build
```
