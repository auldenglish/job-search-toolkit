#!/usr/bin/env node
/**
 * generate.js
 *
 * Persistent .docx generator for resume working copies.
 * Parses a markdown working copy and produces formatted and/or Workday .docx output.
 *
 * Usage:
 *   node generate.js <path/to/working-copy.md> [--formatted-only | --workday-only]
 *
 * Requires: docx-template.js in the project root (run /init-docx-template first).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Paragraph, TextRun, TabStopType } = require('docx');

const {
  FONT, SZ, DATE_TAB, W_FONT, W_SZ,
  nameBlock, titleBlock, contactBlock, sectionHeader,
  companyLine, roleLine, italicNote, bullet, subBullet,
  summaryBlock, educationBlock,
  wSection, wHeader, wRole, wNote, wBullet, wPlain,
  generateDocs,
} = require('./docx-template');

// ---------------------------------------------------------------------------
// Inline markdown parser — converts **bold** segments to TextRun arrays
// ---------------------------------------------------------------------------

function inlineRuns(text, font, size) {
  const runs = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), font, size }));
    runs.push(new TextRun({ text: m[1], font, size, bold: true }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), font, size }));
  return runs;
}

function fmtRuns(text)  { return text.includes('**') ? inlineRuns(text, FONT,   SZ.body) : text; }
function wdRuns(text)   { return text.includes('**') ? inlineRuns(text, W_FONT, W_SZ)    : text; }

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args        = process.argv.slice(2);
const mdPath      = args.find(a => !a.startsWith('--'));
const fmtOnly     = args.includes('--formatted-only');
const workdayOnly = args.includes('--workday-only');

if (!mdPath) {
  console.error('Usage: node generate.js <path/to/working-copy.md> [--formatted-only | --workday-only]');
  process.exit(1);
}
if (!fs.existsSync(mdPath)) {
  console.error(`File not found: ${mdPath}`);
  process.exit(1);
}

const outputBase = mdPath.replace(/\.md$/, '');

// ---------------------------------------------------------------------------
// Markdown Parser
// ---------------------------------------------------------------------------

function parseResume(content) {
  // Normalize line endings; strip BOM
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  let i = 0;

  const result = { name: '', title: '', contact: '', sections: [] };

  function skipEmpty() {
    while (i < lines.length && lines[i].trim() === '') i++;
  }

  // Header block: # Name → title → contact
  skipEmpty();
  if (lines[i]?.startsWith('# ')) {
    result.name = lines[i].slice(2).trim();
    i++;  skipEmpty();
    result.title   = lines[i]?.trim() || '';
    i++;  skipEmpty();
    result.contact = lines[i]?.trim() || '';
    i++;
  }

  let currentSection = null;
  let currentJob     = null;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    // ## Section header
    if (line.startsWith('## ')) {
      currentSection = { label: line.slice(3).trim(), items: [] };
      result.sections.push(currentSection);
      currentJob = null;
      i++; continue;
    }

    // ### Job / role heading
    if (line.startsWith('### ') && currentSection) {
      const parts = line.slice(4).trim().split(' | ').map(p => p.trim());
      let job;
      if (parts.length >= 3) {
        // Role | Company | Location
        job = { type: 'job', role: parts[0], company: parts[1], location: parts.slice(2).join(', '), dateRange: '', notes: [], bullets: [] };
      } else {
        // Company | Location  (historical multi-role block — no explicit role)
        job = { type: 'job', role: '', company: parts[0], location: parts[1] || '', dateRange: '', notes: [], bullets: [] };
      }
      currentSection.items.push(job);
      currentJob = job;
      i++; continue;
    }

    // **bold** line — date range in Experience, institution in Education
    const boldMatch = line.match(/^\*\*(.+?)\*\*(.*)$/);
    if (boldMatch && currentSection) {
      const boldText  = boldMatch[1];
      const remainder = boldMatch[2].trim();

      if (currentSection.label === 'Education') {
        // **Institution** | Degree (Year)
        const afterPipe = remainder.startsWith('|') ? remainder.slice(1).trim() : remainder;
        currentSection.items.push({ type: 'education', institution: boldText, degree: afterPipe });
      } else if (currentJob && !currentJob.dateRange && !remainder) {
        // Standalone date line inside a job block
        currentJob.dateRange = boldText;
      } else if (!remainder) {
        currentSection.items.push({ type: 'plain', text: boldText, bold: true });
      }
      i++; continue;
    }

    // *italic* note line
    const italicMatch = line.match(/^\*([^*].+[^*])\*$|^\*([^*])\*$/);
    if (italicMatch && currentJob) {
      currentJob.notes.push((italicMatch[1] || italicMatch[2]).trim());
      i++; continue;
    }

    // Sub-bullet (2+ leading spaces + *)
    if (/^  +\* /.test(line) && currentJob) {
      currentJob.bullets.push({ text: line.replace(/^  +\* /, '').trim(), level: 1 });
      i++; continue;
    }

    // Top-level bullet
    if (line.startsWith('* ') && currentSection) {
      const text = line.slice(2).trim();
      if (currentJob) {
        currentJob.bullets.push({ text, level: 0 });
      } else {
        currentSection.items.push({ type: 'bullet', text });
      }
      i++; continue;
    }

    // Plain text (Summary body)
    if (line.trim() && currentSection && !currentJob) {
      currentSection.items.push({ type: 'text', text: line.trim() });
    }

    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Job grouping helpers
// ---------------------------------------------------------------------------

/**
 * Group consecutive job entries that share the same company + location
 * under a single company header. Returns array of { company, location, roles[] }.
 */
function groupByCompany(jobs) {
  const groups = [];
  for (const job of jobs) {
    const last = groups[groups.length - 1];
    if (last && last.company === job.company && last.location === job.location) {
      last.roles.push(job);
    } else {
      groups.push({ company: job.company, location: job.location, roles: [job] });
    }
  }
  return groups;
}

/**
 * Compute overall date span for a group of roles.
 * Roles are listed newest-first, so roles[0] has the latest end date
 * and roles[last] has the earliest start date.
 * Returns e.g. "Nov 2022 – Feb 2026".
 */
function companyDateSpan(roles) {
  if (roles.length === 0) return '';
  const split = (dr) => dr ? dr.split(/\s*[–\-]\s*/) : [];
  const first = split(roles[0].dateRange);
  const last  = split(roles[roles.length - 1].dateRange);
  const end   = first[1]?.trim() || first[0]?.trim() || '';
  const start = last[0]?.trim() || '';
  if (roles.length === 1) return roles[0].dateRange || '';
  return start && end ? `${start} – ${end}` : roles[0].dateRange || '';
}

// ---------------------------------------------------------------------------
// Build formatted document children
// ---------------------------------------------------------------------------

function buildFormatted(parsed) {
  const children = [];

  children.push(nameBlock(parsed.name));
  if (parsed.title)   children.push(titleBlock(parsed.title));
  if (parsed.contact) children.push(contactBlock(parsed.contact));

  for (const section of parsed.sections) {
    children.push(sectionHeader(section.label));

    if (section.label === 'Summary') {
      for (const item of section.items) {
        if (item.type === 'text') children.push(summaryBlock(item.text));
      }

    } else if (section.label === 'Skills') {
      for (const item of section.items) {
        if (item.type === 'bullet') children.push(bullet(item.text));
      }

    } else if (section.label === 'Education') {
      for (const item of section.items) {
        if (item.type === 'education') children.push(educationBlock(item.institution, item.degree));
      }

    } else {
      // Render standalone bullets first (e.g. Independent Projects), then job groups.
      for (const item of section.items) {
        if (item.type === 'bullet') children.push(bullet(fmtRuns(item.text)));
      }

      // Experience and any other section with job entries.
      // Group consecutive entries that share the same company under one company header.
      const groups = groupByCompany(section.items.filter(i => i.type === 'job'));

      for (const group of groups) {
        // Compute overall date span: earliest start → latest end across all roles in group
        const overallDate = companyDateSpan(group.roles);
        children.push(companyLine(group.company, group.location, overallDate));

        for (const role of group.roles) {
          if (role.role) {
            // Named role: bold + underlined title, date in parens
            children.push(roleLine(role.role, role.dateRange));
          }
          for (const note of role.notes)   children.push(italicNote(note));
          for (const b    of role.bullets) children.push(b.level === 0 ? bullet(fmtRuns(b.text)) : subBullet(b.text));
        }
      }
    }
  }

  return children;
}

// ---------------------------------------------------------------------------
// Build Workday document children
// ---------------------------------------------------------------------------

function buildWorkday(parsed) {
  const children = [];

  children.push(wPlain(parsed.name, { bold: true }));
  if (parsed.title)   children.push(wPlain(parsed.title));
  if (parsed.contact) children.push(wPlain(parsed.contact));

  for (const section of parsed.sections) {
    children.push(wSection(section.label));

    if (section.label === 'Summary') {
      for (const item of section.items) {
        if (item.type === 'text') children.push(wPlain(item.text));
      }

    } else if (section.label === 'Skills') {
      const skills = section.items.filter(i => i.type === 'bullet').map(i => i.text);
      children.push(wPlain(skills.join(', ')));

    } else if (section.label === 'Education') {
      for (const item of section.items) {
        if (item.type === 'education') children.push(wPlain(`${item.institution} | ${item.degree}`));
      }

    } else {
      for (const item of section.items) {
        if (item.type === 'bullet') {
          children.push(wBullet(wdRuns(item.text)));
          continue;
        }

        if (item.type !== 'job') continue;

        if (item.role && item.company) {
          children.push(wHeader(item.company + (item.location ? '  |  ' + item.location : '')));
          children.push(wRole(item.role, item.dateRange));
        } else {
          // Historical block: everything on one line
          const parts = [item.company, item.location, item.dateRange].filter(Boolean);
          children.push(wHeader(parts.join('  |  ')));
        }

        for (const note of item.notes)    children.push(wNote(note));
        for (const b    of item.bullets)  children.push(wBullet(wdRuns(b.text))); // sub-bullets flattened
      }
    }
  }

  return children;
}

// ---------------------------------------------------------------------------
// Validate: check ZIP magic bytes (all .docx files are ZIP archives)
// ---------------------------------------------------------------------------

function isValidDocx(filePath) {
  try {
    const buf = Buffer.alloc(4);
    const fd  = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// PDF Conversion: attempt multiple methods
// ---------------------------------------------------------------------------

function convertDocxToPdf(docxPath) {
  const pdfPath = docxPath.replace(/\.docx$/, '.pdf');
  const absDocx = path.resolve(docxPath);
  const absDir  = path.dirname(absDocx);

  try {
    // Try libreoffice (cross-platform)
    try {
      execSync(`libreoffice --headless --convert-to pdf --outdir "${absDir}" "${absDocx}"`, {
        stdio: 'pipe',
        timeout: 30000
      });
      if (fs.existsSync(pdfPath)) return pdfPath;
    } catch {
      // libreoffice not available, try next method
    }

    // Try PowerShell + Word COM (Windows only)
    if (process.platform === 'win32') {
      const psScript = `
$doc = [System.IO.Path]::GetFullPath("${absDocx}")
$pdf = [System.IO.Path]::GetFullPath("${pdfPath}")
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc_obj = $word.Documents.Open($doc)
$doc_obj.SaveAs($pdf, 17)  # 17 = wdFormatPDF
$doc_obj.Close()
$word.Quit()
`;
      execSync(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`, {
        stdio: 'pipe',
        timeout: 30000
      });
      if (fs.existsSync(pdfPath)) return pdfPath;
    }
  } catch (err) {
    // Silently fail - PDF generation is a nice-to-have
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const content = fs.readFileSync(mdPath, 'utf8');
  const parsed  = parseResume(content);

  console.log(`\nParsed:  ${parsed.name} — ${parsed.title}`);
  console.log(`Output:  ${outputBase}[.docx / -workday.docx]\n`);

  const result = await generateDocs(
    buildFormatted(parsed),
    buildWorkday(parsed),
    outputBase,
    { formatted: !workdayOnly, workday: !fmtOnly }
  );

  let ok = true;
  for (const [label, filePath] of [['Formatted', result.formatted], ['Workday  ', result.workday]]) {
    if (!filePath) continue;
    const valid = isValidDocx(filePath);
    const size  = fs.statSync(filePath).size;
    console.log(`${label}: ${filePath}  (${(size / 1024).toFixed(1)} KB)  ${valid ? '✓' : '✗ INVALID'}`);
    if (!valid) ok = false;

    // Attempt PDF conversion
    const pdfPath = convertDocxToPdf(filePath);
    if (pdfPath && fs.existsSync(pdfPath)) {
      const pdfSize = fs.statSync(pdfPath).size;
      console.log(`           ${pdfPath}  (${(pdfSize / 1024).toFixed(1)} KB)  ✓`);
    }
  }

  if (!ok) {
    console.error('\nOne or more output files failed validation.');
    process.exit(1);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
