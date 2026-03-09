# Job Search Project

## Initialization Check — Run on Every Session Start

Before doing anything else, silently check the following:

1. Does `resume-base.md` exist in this folder?
2. Does `resume-base.md` still contain placeholder text (e.g., `[Your Full Name]` or `[Your Professional Title]`)?
3. Does a `.docx` formatting template exist in this folder (any `.docx` file)?

If any check fails, do not proceed with other tasks. Instead, say:
> "It looks like this project isn't fully set up yet. Run `/setup` and I'll walk you through it — it only takes a few minutes."

If all checks pass, proceed normally without mentioning the check.

---

## Base Resume
Stored locally at `resume-base.md` in this project folder. This is the source-of-truth resume Claude reads and maintains.

- **Formatting template** for `.docx` output: the `.docx` file in this folder (user-provided; see setup)
- **Per-job working copies** are stored in `resumes/` — named `[company]-[role]-[YYYY-MM-DD].md`
- The base resume is **never modified during a customization session** — only at the end, with explicit approval

## Available Commands
- `/setup` — First-time onboarding: creates resume and configures the project
- `/customize-resume` — Tailor the base resume to a specific job description
- `/cover-letter` — Draft a cover letter for a specific role (invoke only when requested)

## Application Tracking
All job applications are tracked in `applications.json` in this directory.
- Always read `applications.json` before adding a new entry to avoid duplicates
- Use incremental integer IDs (check the highest existing ID and increment by 1)

## General Rules
- Never reword resume or cover letter content without explicit user approval
- Present all suggested changes as before/after comparisons
- If a job description URL is inaccessible (behind login, etc.), ask the user for a PDF or copied text
