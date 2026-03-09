---
description: Draft a tailored cover letter for a specific job. Uses your resume and the job description, flags any claims that can't be sourced from your resume, and requires approval before finalizing.
---

# Cover Letter

Draft a tailored cover letter for a specific job. Only invoke this when the user explicitly asks for a cover letter.

## Step 1: Gather Inputs

If not already in context from a `/customize-resume` session, ask for:
1. **Job Description**: URL preferred; paste or PDF if URL is inaccessible
2. **Resume**: Read `resume-base.md` from the project folder. Confirm with user which version to use (base or a specific tailored copy from `resumes/`)

Also ask:
3. **Tone preference**: Professional/formal, conversational, or hybrid?
4. **Any specific points to emphasize?** (optional)

## Step 2: Draft

Write a tailored cover letter based on the JD and resume. Guidelines:
- Opening: connect a specific aspect of the role or company to the candidate's background
- Body: highlight 2–3 most relevant accomplishments from the resume that map to JD requirements
- Closing: express genuine interest and clear call to action

**No invented content rule**: Every specific claim (skills, accomplishments, metrics) must be traceable to the resume. If a strong point would require information not in the resume, flag it:
```
[FLAG: This claim requires confirmation — do you have experience with X? If so, I'll include it.]
```

## Step 3: Review

Present the full draft. Ask the user to:
- Approve, or
- Mark sections to revise (user can quote the section and describe what to change)

Do not finalize until the user explicitly approves the draft.

## Step 4: Final Output

Produce the approved cover letter, cleanly formatted and ready to copy or save.
