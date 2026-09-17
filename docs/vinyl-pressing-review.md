# Reviewing Isabel’s pressing submissions

The site collects evidence at `/vinyl/identify` or `/vinyl/<album-id>/identify`.
Photos are uploaded individually to the existing `vinyl-covers` bucket under
`pressing/<album-id>/`. Drafts and submission state live separately in
`vinyl_pressing_submissions`, so ordinary album edits cannot erase the evidence.
There are no live AI calls and no paid AI API credentials to configure.
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
5. **Save draft** preserves incomplete work. **Submit for Baylor to review** requires
   the minimum evidence. It saves as pending and asks her to tell Baylor; no email,
   text, notification, or automatic AI processing is sent.
6. Review notes and requests for more details appear on the same page. Saving new
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
