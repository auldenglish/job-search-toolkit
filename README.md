# Claude Job Search Toolkit

A Claude Code project that streamlines resume tailoring, cover letter writing, and job application tracking — using Claude as an active collaborator with strict approval gates to ensure nothing changes without your sign-off.

---

## What This Does

### `/customize-resume`
Takes a job description and your base resume, then walks you through:
1. Reordering your Skills bullets by relevance to the role
2. Reordering work history bullets per role to lead with the most relevant accomplishments
3. Suggesting revised wording on existing bullets — with before/after comparisons for each
4. Gap analysis: identifying JD requirements not covered by your resume, and prompting you for examples
5. Producing output in your choice of formats:
   - **Formatted `.docx`** — styled to match your personal resume template
   - **Workday-friendly `.docx`** — plain, ATS-optimized for Workday's notoriously bad import parser
6. Optionally writing approved changes back to your base resume

Every change requires your explicit approval. Nothing is silently reworded.

### `/cover-letter`
Drafts a tailored cover letter from your resume and a job description. Flags any claim it can't source directly from your resume before including it.

### Application Tracking
All applications are logged to `applications.json` with status, dates, notes, and follow-up dates. Structured for easy use in a future GUI or dashboard.

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and configured
- A Claude account with access to the model you want to use
- [Node.js](https://nodejs.org/) (for `.docx` generation)
- [Python 3](https://python.org/) (for `.docx` generation)

After cloning, install the required packages:
```bash
bash install-deps.sh
```

This installs:
- `docx` (npm) — used to generate `.docx` files
- `defusedxml` (pip) — required by the docx skill's XML tools

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/job-search-toolkit.git
cd job-search-toolkit
```

### 2. Open in Claude Code

```bash
claude .
```

Claude will detect that setup is incomplete and walk you through the remaining steps automatically.

### 3. Manual setup (if preferred)

**a) Create your base resume**

Copy the example file and fill it in with your own content:
```bash
cp resume-base.example.md resume-base.md
```
Edit `resume-base.md` with your actual resume content. This file is gitignored — it stays local.

**b) Add your formatting template**

Add a `.docx` copy of your current resume to the project folder. This is used as the visual template for formatted output. Also gitignored.

Update the reference in `CLAUDE.md` to match your filename:
```
Formatting template: your-resume-template.docx
```

**c) Initialize the application tracker**

`applications.json` is already initialized as an empty array. No action needed.

---

## File Structure

```
job_search/
├── README.md                          # This file
├── CLAUDE.md                          # Project instructions loaded by Claude
├── resume-base.example.md             # Template — copy to resume-base.md and fill in
├── resume-base.md                     # Your actual resume (gitignored)
├── resumes/                           # Per-job tailored copies (gitignored)
├── applications.json                  # Application tracker (gitignored)
└── .claude/
    └── commands/
        ├── setup.md                   # /setup — first-time onboarding
        ├── customize-resume.md        # /customize-resume — tailor resume to a JD
        └── cover-letter.md            # /cover-letter — draft a cover letter
```

---

## Application Tracker Schema

Each entry in `applications.json` follows this structure:

```json
{
  "id": 1,
  "company": "Acme Corp",
  "role": "Senior Product Manager",
  "jd_url": "https://...",
  "date_applied": "2026-03-09",
  "status": "applied",
  "resume_version": "resumes/acme-senior-pm-2026-03-09.md",
  "cover_letter": false,
  "notes": "",
  "follow_up_date": ""
}
```

Status values: `applied` | `interviewing` | `offer` | `rejected` | `withdrawn`

---

## Notes on Workday Format

Workday's resume import parser is notoriously unreliable with standard resume formatting. The Workday output option produces a plain `.docx` specifically structured to maximize correct parsing: single column, all-caps section headers, spelled-out dates, no tables or text boxes, no special characters.

Results may vary. If you find specific formatting that works better with a particular Workday instance, update the Workday format spec in `.claude/commands/customize-resume.md` (Step 8).

---

## Contributing

PRs welcome. The skill files (`.claude/commands/`) are the core of this project — improvements to the workflows, better Workday format handling, and additional output formats are all good candidates.
