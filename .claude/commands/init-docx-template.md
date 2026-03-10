---
description: One-time setup that unpacks the .docx formatting template, extracts typography and layout values, and writes docx-template.js — the reusable generation module used by /customize-resume. Re-run only if the template changes.
---

# Init Docx Template

Analyze the .docx formatting template once and generate `docx-template.js`.
This file is gitignored — it is specific to this user's template.

---

## Step 1 — Check Preconditions

1. Locate the `.docx` template file in the project folder (any `.docx` that is NOT in `resumes/`).
2. If none found, say: "No .docx template found in the project folder. Add your resume `.docx` file here, then re-run `/init-docx-template`." Stop.
3. If `docx-template.js` already exists, say: "`docx-template.js` already exists. Re-running will overwrite it with fresh values from `[template filename]`. Continue?" Wait for confirmation.

---

## Step 2 — Extract Template Values

Use the docx skill to unpack and analyze the template.

```bash
export SKILL_DIR="$(node -e "require('path')" 2>/dev/null)"
python docx_scripts/unpack.py "[template].docx" template_unpacked/
```

If `docx_scripts/` doesn't exist, copy the skill scripts first:
```bash
SKILL_OFFICE="$(ls -d /Users/$USER/Library/Application\ Support/Claude/local-agent-mode-sessions/skills-plugin/*/*/skills/docx/scripts/office 2>/dev/null || ls -d /c/Users/$USER/AppData/Roaming/Claude/local-agent-mode-sessions/skills-plugin/*/*/skills/docx/scripts/office 2>/dev/null | head -1)"
mkdir -p docx_scripts
cp -r "$SKILL_OFFICE"/* docx_scripts/
PYTHONIOENCODING=utf-8 python docx_scripts/unpack.py "[template].docx" template_unpacked/
```

From `template_unpacked/word/document.xml` and `styles.xml`, extract:

**Page geometry:**
- `w:pgSz` → page width, page height (DXA)
- `w:pgMar` → top, right, bottom, left margins (DXA)
- Compute content width = page width − left − right margin

**Font sizes** (half-points, from named paragraph styles):
- Name/header: largest `w:sz` value
- Contact/body: most common body `w:sz`
- Section headers: `w:sz` for the "SUMMARY" / "EXPERIENCE" paragraphs
- Company name: `w:sz` for employer name runs
- Role/title: `w:sz` for job title runs

**Spacing** (DXA):
- Section header: `w:spacing w:before`, `w:spacing w:after`
- Company: `w:spacing w:before`, `w:spacing w:after`
- Role: `w:spacing w:before`, `w:spacing w:after`
- Bullet: `w:spacing w:before`, `w:spacing w:after`, `w:spacing w:line`

**Bullet indents** (DXA):
- Top-level bullet: `w:ind w:left`, `w:ind w:hanging`
- Sub-bullet: `w:ind w:left`, `w:ind w:hanging`

**Bullet characters:**
- Level 0 from `w:lvlText` in `numbering.xml`
- Level 1 from `w:lvlText`

**Section border:**
- `w:pBdr w:bottom` style, size, color, space

**Tab stops:**
- Right-aligned tab position (for date column) from role/company paragraphs

**Font family:**
- `w:rFonts w:ascii` (most common value)

Do NOT ask the user to confirm extracted values — proceed directly.

---

## Step 3 — Write docx-template.js

Write `docx-template.js` to the project root using the extracted values.

The file must:
- Import from `docx` npm package
- Export all formatting constants: `FONT`, `PAGE`, `CONTENT_WIDTH`, `DATE_TAB`, `SZ`, `NUMBERING_CONFIG`
- Export formatted resume helpers: `nameBlock`, `titleBlock`, `contactBlock`, `sectionHeader`, `companyLine`, `roleLine`, `italicNote`, `bullet`, `subBullet`, `plainLine`, `summaryBlock`, `educationBlock`
- Export Workday ATS helpers: `wSection`, `wHeader`, `wRole`, `wNote`, `wBullet`, `wPlain`
- Export `generateDocs(formattedChildren, workdayChildren, outputBase, opts)` async function

Workday defaults (regardless of template):
- Font: Calibri 11pt (22 half-points)
- Margins: 1" all sides (1440 DXA)
- No styling, no borders, no tabs
- Bullets rendered as plain text with `- ` prefix (no `docx` numbering)

Node.js invocation rules (apply to all scripts using this module):
- Set `NODE_PATH`: `export NODE_PATH="$(npm root -g)"`
- Windows: use `NODE_EXE="$(which node 2>/dev/null || echo '/c/Program Files/nodejs/node.exe')"`
- Write temp generation scripts to project folder, not `/tmp`
- Use `PYTHONIOENCODING=utf-8` for any Python steps on Windows

---

## Step 4 — Clean Up and Confirm

1. Remove `template_unpacked/` and `docx_scripts/` if they were created by this run.
2. Confirm to the user:
```
docx-template.js written with values from [template filename]:
  Font: [font]
  Page: [W]x[H] DXA, margins [top]/[right]/[bottom]/[left]
  Sizes (half-pt): name=[n], body=[n], section=[n], company=[n], role=[n]

/customize-resume will now use this module for .docx output.
Re-run /init-docx-template only if your formatting template changes.
```

No other output or prompts needed.
