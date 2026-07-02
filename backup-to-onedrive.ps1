# Claude_Sessions / job_search backup to OneDrive
# Backs up the data git does NOT track:
#   1. Personal resume files (resume-base.md, resumes/, _personal/)
#   2. A timestamped pg_dump of the job-search Postgres DB (the live application tracker)
# GitHub already covers tracked code. OneDrive provides 30-day version history for recovery.
#
# Run manually:  double-click backup-to-onedrive.bat, or:
#   powershell -NoProfile -ExecutionPolicy Bypass -File backup-to-onedrive.ps1
# Scheduled daily via Task Scheduler task "Claude_Sessions Daily Backup".

$src = 'C:\Users\engli\Claude_Sessions\job_search'
$dst = 'C:\Users\engli\OneDrive\Claude_Sessions_Backup\job_search'
$filesDir = Join-Path $dst 'files'
$dbDir    = Join-Path $dst 'db'
$stamp    = Get-Date -Format 'yyyy-MM-dd'
$log      = Join-Path $dst 'backup.log'

New-Item -ItemType Directory -Force -Path $dst, $filesDir, $dbDir | Out-Null

function Log($m) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m"
    Add-Content -Path $log -Value $line
    Write-Host $line
}

Log '=== Backup start ==='

# --- 1. Personal resume files ---
if (Test-Path "$src\resume-base.md") {
    Copy-Item "$src\resume-base.md" "$filesDir\resume-base.md" -Force
}
# /MIR mirrors current state (adds new, removes deleted). /NFL /NDL /NJH /NJS = quiet.
robocopy "$src\resumes"   "$filesDir\resumes"   /MIR /NFL /NDL /NJH /NJS /R:2 /W:2 | Out-Null
robocopy "$src\_personal" "$filesDir\_personal" /MIR /NFL /NDL /NJH /NJS /R:2 /W:2 | Out-Null
Log 'Personal files copied (resume-base.md, resumes/, _personal/).'

# --- 2. Postgres DB dump ---
$dumpFile = Join-Path $dbDir "job_search_$stamp.sql"
$errFile  = Join-Path $dbDir 'dump_err.txt'
cmd /c "docker exec job-search-db pg_dump -U jobsearch -d job_search 1>`"$dumpFile`" 2>`"$errFile`""
if ((Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
    Log "DB dumped: job_search_$stamp.sql ($((Get-Item $dumpFile).Length) bytes)."
    Remove-Item $errFile -Force -ErrorAction SilentlyContinue
} else {
    $why = if (Test-Path $errFile) { (Get-Content $errFile -Raw) } else { 'no error output' }
    Log "WARNING: DB dump empty or failed. Is Docker running? Detail: $why"
}

# --- 3. Prune DB dumps older than 30 days (OneDrive keeps version history anyway) ---
Get-ChildItem "$dbDir\job_search_*.sql" -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

Log '=== Backup done ==='
