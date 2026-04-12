$ErrorActionPreference = "SilentlyContinue"

# =========================
# AI Command Console Report
# =========================

$ProjectRoot = Get-Location
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportFile = Join-Path $ProjectRoot "ai-command-console-report-$Timestamp.txt"

function Add-Section {
    param([string]$Title)
    Add-Content -Path $ReportFile -Value ""
    Add-Content -Path $ReportFile -Value ("=" * 80)
    Add-Content -Path $ReportFile -Value $Title
    Add-Content -Path $ReportFile -Value ("=" * 80)
}

function Add-Line {
    param([string]$Text)
    Add-Content -Path $ReportFile -Value $Text
}

function Add-CommandOutput {
    param(
        [string]$Label,
        [scriptblock]$Command
    )
    Add-Line ""
    Add-Line ("--- " + $Label + " ---")
    try {
        $output = & $Command 2>&1 | Out-String
        if ([string]::IsNullOrWhiteSpace($output)) {
            Add-Line "[no output]"
        } else {
            Add-Line $output.TrimEnd()
        }
    } catch {
        Add-Line ("[error] " + $_.Exception.Message)
    }
}

function Test-ProjectFile {
    param([string]$RelativePath)
    $full = Join-Path $ProjectRoot $RelativePath
    return Test-Path $full
}

function Get-FilePreview {
    param(
        [string]$RelativePath,
        [int]$MaxLines = 120
    )
    $full = Join-Path $ProjectRoot $RelativePath
    Add-Line ""
    Add-Line ("--- Preview: " + $RelativePath + " ---")
    if (Test-Path $full) {
        try {
            Get-Content $full -First $MaxLines | Add-Content -Path $ReportFile
        } catch {
            Add-Line ("[error reading file] " + $_.Exception.Message)
        }
    } else {
        Add-Line "[missing]"
    }
}

function Add-JsonSummary {
    param(
        [string]$RelativePath,
        [string[]]$Keys
    )
    $full = Join-Path $ProjectRoot $RelativePath
    Add-Line ""
    Add-Line ("--- JSON Summary: " + $RelativePath + " ---")
    if (!(Test-Path $full)) {
        Add-Line "[missing]"
        return
    }

    try {
        $json = Get-Content $full -Raw | ConvertFrom-Json
        foreach ($key in $Keys) {
            if ($null -ne $json.$key) {
                $value = $json.$key | Out-String
                Add-Line ($key + ": " + $value.Trim())
            } else {
                Add-Line ($key + ": [not found]")
            }
        }
    } catch {
        Add-Line ("[invalid json or unreadable] " + $_.Exception.Message)
    }
}

# Start report
"AI Command Console Diagnostic Report" | Set-Content -Path $ReportFile
Add-Line ("Generated: " + (Get-Date))
Add-Line ("Project Root: " + $ProjectRoot.Path)

# Basic environment
Add-Section "1. Environment"
Add-CommandOutput "Windows Version" { cmd /c ver }
Add-CommandOutput "PowerShell Version" { $PSVersionTable | Out-String }
Add-CommandOutput "Node Version" { node -v }
Add-CommandOutput "NPM Version" { npm -v }
Add-CommandOutput "Git Version" { git --version }
Add-CommandOutput "Python Version" { python --version }

# Project root contents
Add-Section "2. Project Root Summary"
Add-CommandOutput "Top-Level Files/Folders" { Get-ChildItem -Force | Select-Object Mode, Length, LastWriteTime, Name | Format-Table -AutoSize }
Add-CommandOutput "Directory Tree (first 500 lines)" { tree /F | Select-Object -First 500 }

# Git status
Add-Section "3. Git Status"
Add-CommandOutput "Git Status" { git status }
Add-CommandOutput "Git Branches" { git branch -a }
Add-CommandOutput "Latest Commits" { git log --oneline -n 15 }

# Package info
Add-Section "4. Package and Dependencies"
if (Test-ProjectFile "package.json") {
    Add-JsonSummary -RelativePath "package.json" -Keys @("name","version","description","main","scripts","dependencies","devDependencies")
    Get-FilePreview -RelativePath "package.json" -MaxLines 200
} else {
    Add-Line "package.json: [missing]"
}
Add-CommandOutput "Installed Top-Level Packages" { npm list --depth=0 }

# Backend package info
Add-Section "5. Backend Package Check"
if (Test-ProjectFile "backend\package.json") {
    Add-JsonSummary -RelativePath "backend\package.json" -Keys @("name","version","description","main","scripts","dependencies","devDependencies")
    Get-FilePreview -RelativePath "backend\package.json" -MaxLines 200
    Add-CommandOutput "Backend Installed Top-Level Packages" { npm --prefix backend list --depth=0 }
} else {
    Add-Line "backend\\package.json: [missing]"
}

# Key project files
Add-Section "6. Key File Presence Check"
$keyFiles = @(
    "cli.js",
    "server.js",
    "db.js",
    ".env",
    ".env.example",
    "config\env.js",
    "config\plugins.json",
    "config\startup.json",
    "services\planner.js",
    "services\executionEngine.js",
    "executionEngine.js",
    "services\memoryStore.js",
    "pluginLoader.js",
    "utils\summarize_text.js",
    "utils\read_file.js",
    "backend\server.js",
    "backend\db.js"
)

foreach ($file in $keyFiles) {
    $exists = Test-ProjectFile $file
    Add-Line ("{0} : {1}" -f $file, ($(if ($exists) { "FOUND" } else { "MISSING" })))
}

# Preview important files
Add-Section "7. Important File Previews"
$previewFiles = @(
    "cli.js",
    "server.js",
    "config\env.js",
    "config\plugins.json",
    "config\startup.json",
    "services\planner.js",
    "services\executionEngine.js",
    "executionEngine.js",
    "services\memoryStore.js",
    "pluginLoader.js",
    "backend\server.js",
    "backend\db.js"
)

foreach ($file in $previewFiles) {
    Get-FilePreview -RelativePath $file -MaxLines 120
}

# Search for AI console feature markers
Add-Section "8. Feature Marker Scan"
$patterns = @(
    "dryrun",
    "safe mode",
    "safeMode",
    "whyBlocked",
    "history",
    "planner",
    "executionEngine",
    "memoryStore",
    "plugin",
    "plugins",
    "tool router",
    "suggest",
    "approval",
    "blocked",
    "read_file",
    "summarize_text",
    "netstat",
    "process"
)

foreach ($pattern in $patterns) {
    Add-CommandOutput "Search: $pattern" {
        Get-ChildItem -Recurse -File -Include *.js,*.json,*.ts,*.mjs,*.cjs |
            Select-String -Pattern $pattern |
            Select-Object -First 20 Path, LineNumber, Line |
            Format-Table -Wrap -AutoSize
    }
}

# Plugin and config detection
Add-Section "9. Plugin and Config Analysis"
if (Test-ProjectFile "config\plugins.json") {
    Add-CommandOutput "plugins.json Raw" { Get-Content "config\plugins.json" }
}
if (Test-ProjectFile "config\startup.json") {
    Add-CommandOutput "startup.json Raw" { Get-Content "config\startup.json" }
}
Add-CommandOutput "Possible Plugin Folders" {
    Get-ChildItem -Recurse -Directory |
        Where-Object { $_.Name -match "plugin|plugins" } |
        Select-Object FullName | Format-Table -AutoSize
}

# Env analysis
Add-Section "10. Environment Variable File Analysis"
if (Test-ProjectFile ".env") {
    Add-CommandOutput ".env Keys Only" {
        Get-Content ".env" |
            Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } |
            ForEach-Object { ($_ -split "=")[0].Trim() }
    }
} else {
    Add-Line ".env: [missing]"
}

# Scripts and launch points
Add-Section "11. Launch / Startup Clues"
Add-CommandOutput "Search for npm start/dev scripts" {
    Get-ChildItem -Recurse -File -Include package.json |
        ForEach-Object {
            "`nFILE: $($_.FullName)"
            Get-Content $_.FullName -Raw
        }
}
Add-CommandOutput "Search for process.argv / readline / inquirer" {
    Get-ChildItem -Recurse -File -Include *.js,*.ts |
        Select-String -Pattern "process\.argv|readline|inquirer" |
        Select-Object -First 50 Path, LineNumber, Line |
        Format-Table -Wrap -AutoSize
}

# Recent modified files
Add-Section "12. Recently Modified Files"
Add-CommandOutput "Most Recent 50 Files" {
    Get-ChildItem -Recurse -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 50 FullName, LastWriteTime, Length |
        Format-Table -AutoSize
}

# Basic health checks
Add-Section "13. Basic Health Checks"
Add-CommandOutput "node_modules present?" {
    if (Test-Path "node_modules") { "YES" } else { "NO" }
}
Add-CommandOutput "backend/node_modules present?" {
    if (Test-Path "backend\node_modules") { "YES" } else { "NO" }
}
Add-CommandOutput "Git repo present?" {
    if (Test-Path ".git") { "YES" } else { "NO" }
}

# Optional run hints
Add-Section "14. Quick Diagnosis Summary"
Add-Line "Use this section as a human review aid:"
Add-Line "- Check whether cli.js exists"
Add-Line "- Check whether services\\executionEngine.js or executionEngine.js exists"
Add-Line "- Check whether services\\planner.js exists"
Add-Line "- Check whether services\\memoryStore.js exists"
Add-Line "- Check whether config\\plugins.json and config\\startup.json exist"
Add-Line "- Check scripts in package.json and backend\\package.json"
Add-Line "- Check .env keys are present"
Add-Line "- Check feature markers for dryrun, safeMode, whyBlocked, history, plugins, approval flow"

Add-Section "15. Report Complete"
Add-Line ("Saved report to: " + $ReportFile)

Write-Host ""
Write-Host "Done. Report created at:"
Write-Host $ReportFile
Write-Host ""