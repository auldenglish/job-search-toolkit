---
description: Tailor your resume to a specific job description. Creates a job-specific copy, reorders bullets by relevance, suggests revisions, identifies gaps, and produces formatted or Workday-friendly output — all with explicit approval at every step.
---

# Customize Resume

Tailor a job-specific copy of the base resume to a job description, with full approval gates at every step. No content changes without explicit user approval.

---

## Step 1 — Gather Inputs

1. **Job Description**: Ask for the JD URL. If inaccessible (behind login/paywall), ask user to paste the text or provide a PDF.
2. **Base resume**: Read `resume-base.md` from the current project folder. Confirm with the user: "I'll be working from `resume-base.md` — is that correct, or do you want to use a different version?"

Do not proceed until both are available.

---

## Step 2 — Create Working Copy

Create a job-specific copy of the base resume:
- Path: `resumes/[company-slug]-[role-slug]-[YYYY-MM-DD].md`
- Example: `resumes/acme-senior-pm-2026-03-09.md`
- Copy all content verbatim from `resume-base.md`

All edits during this session go into the working copy. **`resume-base.md` is never modified during a customization session.**

Confirm the working copy filename with the user before proceeding.

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

For each role with bullets, propose reordering bullets to surface the most JD-relevant accomplishments first. No wording changes.

Present each role:
```
[Title] | [Company]
Proposed bullet order (verbatim, no wording changes):
1. [most relevant bullet]
2. [next]
...
```

Ask if the user wants to approve role-by-role or all at once. Wait for approval before proceeding.

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

Ask which output(s) to produce:

**A) Formatted .docx** — Styled to match the formatting template.

**B) Workday-friendly .docx** — Plain, ATS-optimized format.

**C) Both**

### Generating .docx output

**Check for `docx-template.js`** in the project root before generating.

- If it exists: use it directly — `require('./docx-template')` in the generation script.
- If it does not exist: say "Run `/init-docx-template` first — it unpacks your formatting template and generates the `docx-template.js` module (one-time setup, takes under a minute)." Stop until user runs it.

### Generation script

Write a temp script `generate_resume.js` to the project folder (not `/tmp`). Structure:

```javascript
const {
  nameBlock, titleBlock, contactBlock, sectionHeader,
  companyLine, roleLine, italicNote, bullet, subBullet,
  summaryBlock, educationBlock,
  wSection, wHeader, wRole, wNote, wBullet, wPlain,
  generateDocs,
} = require('./docx-template');

const formattedChildren = [ /* ...paragraphs for styled output */ ];
const workdayChildren   = [ /* ...paragraphs for Workday output */ ];

generateDocs(formattedChildren, workdayChildren, 'resumes/[working-copy-base]', {
  formatted: true,  // set false if only B was selected
  workday:   true,  // set false if only A was selected
}).then(r => console.log('Written:', r));
```

Run with:
```bash
export NODE_PATH="$(npm root -g)"
NODE_EXE="$(which node 2>/dev/null || echo '/c/Program Files/nodejs/node.exe')"
"$NODE_EXE" generate_resume.js
```

Delete `generate_resume.js` after successful output.

Validate each output file:
```bash
python -c "import zipfile; zipfile.ZipFile('resumes/[file].docx').namelist()" && echo "Valid ZIP"
```

**Workday sub-bullets:** Flatten to top-level bullets with a leading dash — do not use nested lists.

---

## Step 9 — Update Base Resume (Optional)

After output is produced, ask:
> "Would you like to incorporate any of the approved changes back into `resume-base.md`?"

If yes:
- Show exactly which lines would change (before/after for each)
- Wait for explicit approval
- Apply only approved changes to `resume-base.md`
