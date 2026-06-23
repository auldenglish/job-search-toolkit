---
description: Tailor your resume to a specific job description. Creates a job-specific copy, reorders bullets by relevance, suggests revisions, identifies gaps, and produces formatted or Workday-friendly output — all with explicit approval at every step.
---

# Customize Resume

Tailor a job-specific copy of the base resume to a job description, with full approval gates at every step. No content changes without explicit user approval.

---

## Step 1 — Gather Inputs

1. **Job Description**: Ask for the JD URL. If inaccessible (behind login/paywall), ask user to paste the text or provide a PDF.
2. **Base resume**: Note that you'll be using `resume-base.md` by default. Ask in Step 2 if the user prefers a different version.

Do not proceed until the JD is available.

---

## Step 2 — Create Working Copy

1. **Base resume**: Read `resume-base.md` from the current project folder. If the user wants a different version, ask which one to use instead.

2. **Company-title subfolder**: Parse the company and role from the user's input (or from the JD) to create a logical folder name. Example:
   - Company: Acme, Role: Senior PM → folder: `resumes/acme-senior-pm/`
   - Create this folder if it doesn't exist.

3. **Working copy path**: `resumes/[company-slug]-[role-slug]/[company-slug]-[role-slug]-[YYYY-MM-DD].md`
   - Example: `resumes/acme-senior-pm/acme-senior-pm-2026-03-09.md`
   - Copy all content verbatim from `resume-base.md`

All edits during this session go into the working copy. **The base resume is never modified during a customization session.**

Confirm the working copy path with the user before proceeding.

---

## Step 3 — Analyze

Read the JD thoroughly. Identify:
- Required and preferred skills/tools
- Keywords and themes that repeat
- Seniority signals and scope (team size, budget, scale)
- Requirements not addressed anywhere in the resume (gaps)

Do not surface this analysis to the user yet — use it to inform the steps below.

---

## Step 4 — Skills Reorder

Propose a new ordering of the Skills bullets that places the most JD-relevant skills first. No wording changes.

Present as:
```
SKILLS — Proposed Reorder (no wording changes):
1. [most relevant to JD]
2. [next most relevant]
...
```

Ask: "Approve this reordering, or let me know what to adjust."

Wait for approval before proceeding.

---

## Step 5 — Work History Reorder

For each role with bullets, reorder bullets to surface the most JD-relevant accomplishments first. **No wording changes, no approval needed** — this is purely reordering existing content.

Present the reordered bullets role-by-role:
```
[Title] | [Company]
Reordered bullets (most to least relevant to JD):
1. [most relevant bullet]
2. [next]
...
```

Apply all reordering automatically and proceed to Step 6. Do not wait for approval.

---

## Step 6 — Suggested Revisions

Propose edits to existing bullets that would better align with the JD. Present each as a before/after table:

| | Content |
|---|---|
| **EXISTING** | [exact current text] |
| **SUGGESTED** | [proposed revision] |
| **Why** | [brief rationale tied to JD language] |

For entirely new bullets not in the resume, label them:
> **NEW (suggested):** [proposed bullet]
> **Why:** [rationale]

Rules:
- Never silently change anything
- User may approve, reject, or modify each suggestion
- Apply only approved changes to the working copy

---

## Step 7 — Gap Analysis

List JD requirements or themes not covered by any existing resume content. For each:
```
GAP: [requirement from JD]
→ Do you have relevant experience here? If so, describe it and I'll draft a bullet.
```

Wait for user responses. Draft bullets only after the user provides examples. Apply only approved bullets.

---

## Step 8 — Output Format

**Always generate the formatted `.docx` + `.pdf` (default). Do not ask which output to produce, and do not offer a Workday-friendly version.** The user rarely encounters Workday submissions and will explicitly request one when needed.

Only produce a Workday-friendly `.docx` if the user specifically asks — generate it with `--workday-only`.

### Generating .docx output

**Check for `docx-template.js`** in the project root before generating.

- If it does not exist: say "Run `/init-docx-template` first — it unpacks your formatting template and generates the `docx-template.js` module (one-time setup, takes under a minute)." Stop until user runs it.

### Running the generator

`generate.js` is a persistent script in the project root. It parses the markdown working copy directly — no temp script needed.

```bash
export NODE_PATH="$(npm root -g)"
NODE_EXE="$(which node 2>/dev/null || echo '/c/Program Files/nodejs/node.exe')"
"$NODE_EXE" generate.js resumes/[company-slug]-[role-slug]/[working-copy].md
```

For a single format only:
```bash
"$NODE_EXE" generate.js resumes/[company-slug]-[role-slug]/[working-copy].md --formatted-only
"$NODE_EXE" generate.js resumes/[company-slug]-[role-slug]/[working-copy].md --workday-only
```

The script parses the markdown, builds both document formats, writes the output files to the same company-title subfolder, generates PDF versions automatically, and validates all output. No cleanup needed.

Output files are saved to: `resumes/[company-slug]-[role-slug]/`
- `[name]-formatted.docx` and `.pdf`
- `[name]-workday.docx` and `.pdf`

---

## Step 9 — Update Base Resume (Optional)

After output is produced, ask:
> "Would you like to incorporate any of the approved changes back into `resume-base.md`?"

If yes:
- Show exactly which lines would change (before/after for each)
- Wait for explicit approval
- Apply only approved changes to `resume-base.md`
