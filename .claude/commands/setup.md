---
description: First-time onboarding for the Claude Job Search Toolkit. Checks setup status, helps create resume-base.md from your existing resume, and registers your formatting template.
---

# Setup

First-time onboarding for the Claude Job Search Toolkit. Guides the user through creating their base resume and configuring the project.

---

## Step 1 — Check Current State

Silently check:
- Does `resume-base.md` exist?
- Does it still contain placeholder text (e.g., `[Your Full Name]`)?
- Does a `.docx` formatting template exist in the project folder?

Report what's already done and what still needs to be set up. Example:
```
Setup status:
✓ resume-base.md exists and appears populated
✗ No .docx formatting template found

Let's get that sorted.
```

---

## Step 2 — Base Resume Setup (if needed)

If `resume-base.md` is missing or still contains placeholders:

Say:
> "Let's build your base resume. This is the file Claude will read at the start of every session and use as the source for all tailored versions."
>
> "You have two options:"
> - **A)** "Paste your resume content here (any format — I'll structure it into the correct Markdown format)"
> - **B)** "Share a link to your resume (Google Doc, LinkedIn, etc.) and I'll read and structure it"
> - **C)** "Open `resume-base.example.md` in an editor, fill it in yourself, save it as `resume-base.md`, then come back and re-run `/setup`"

If the user chooses A or B:
- Read or receive the resume content
- Reformat it into the structure defined in `resume-base.example.md`
- Present the full formatted result for review
- Ask: "Does this look correct? I'll save it as `resume-base.md` once you approve."
- On approval, write the file

**Never save `resume-base.md` without explicit user approval of the content.**

---

## Step 3 — Formatting Template (if needed)

If no `.docx` file exists in the project folder:

Say:
> "For the formatted `.docx` output, I need a copy of your current resume as a `.docx` file to use as a visual template. This tells me how your resume should look (fonts, spacing, layout)."
>
> "Add your `.docx` resume file to this project folder, then let me know the filename."

Once the user confirms the filename, update the reference in `CLAUDE.md`:
- Find the line: `Formatting template for .docx output: the .docx file in this folder`
- Replace with: `Formatting template for .docx output: [filename].docx`

---

## Step 4 — Verify and Wrap Up

Re-run the checks from Step 1. If all pass:

```
Setup complete! Here's what's ready:

✓ Base resume: resume-base.md
✓ Formatting template: [filename].docx
✓ Application tracker: applications.json (empty, ready to use)

Commands available:
  /customize-resume — tailor your resume to a job description
  /cover-letter     — draft a cover letter for a role

When you're ready, share a job description and run /customize-resume to get started.
```
