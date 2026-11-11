# CAE-style R2 publication. No native build is triggered by this command.
param(
  [int]$Version = 0,
  [switch]$DryRun,
  [string]$Python = 'python',
  [string]$Gh = '',
  [string]$AudioUpdates = '',
  [switch]$MirrorOnly
)
$ErrorActionPreference = 'Stop'
$publishArguments = @('-X', 'utf8', '-B', (Join-Path $PSScriptRoot 'publish_content_r2.py'))
if ($Version -gt 0) { $publishArguments += @('--version', $Version) }
if ($DryRun) { $publishArguments += '--dry-run' }
if ($Gh) { $publishArguments += @('--gh', $Gh) }
if ($AudioUpdates) { $publishArguments += @('--audio-updates', $AudioUpdates) }
if ($MirrorOnly) { $publishArguments += '--mirror-only' }
& $Python @publishArguments
if ($LASTEXITCODE -ne 0) { throw 'Content publication failed. Verified assets are kept for a safe retry.' }
