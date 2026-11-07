param([int]$Version = 0, [switch]$DryRun, [string]$Python = 'python', [string]$Gh = 'gh')
$ErrorActionPreference = 'Stop'
$repo = 'JinKato2020/safa-language-apps'
$tag = 'packs-appa-ota'
$manifestUrl = "https://github.com/$repo/releases/download/$tag/manifest.json"
$workspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$remote = $null
try { $remote = Invoke-RestMethod -Uri ($manifestUrl + '?t=' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) } catch {
  if ($Version -eq 0 -or [int]$_.Exception.Response.StatusCode -ne 404) { throw 'Could not read current OTA version. Explicit -Version is allowed only when the first manifest does not exist (404).' }
}
if ($Version -eq 0) { $Version = [int]$remote.version + 1 }
if ($remote -and $Version -le [int]$remote.version) { throw 'OTA version must increase.' }
$work = Join-Path $workspace ('.work-ota-publish-' + $Version)
if (Test-Path -LiteralPath $work) { throw 'Temporary publication directory already exists.' }
New-Item -ItemType Directory -Path $work | Out-Null
try {
  & $Python (Join-Path $PSScriptRoot 'build_content_ota.py') --output $work --version $Version
  if ($LASTEXITCODE -ne 0) { throw 'Content generation failed.' }
  & $Python (Join-Path $PSScriptRoot 'verify_content_release.py') $work
  if ($LASTEXITCODE -ne 0) { throw 'Content validation failed.' }
  if ($DryRun) { Write-Output 'Validated; no publication or native build.'; return }
  & $Gh release view $tag --repo $repo *> $null
  if ($LASTEXITCODE -ne 0) {
    & $Gh release create $tag --repo $repo --title 'Nepali content OTA' --notes 'Immutable lesson chunks; manifest is updated last.' --latest=false
    if ($LASTEXITCODE -ne 0) { throw 'Release creation failed.' }
  }
  $existing = (& $Gh release view $tag --repo $repo --json assets | ConvertFrom-Json).assets.name
  # Small pronunciation/practice clips are immutable assets independent of the
  # large legacy voice archives. Verify every clip before publishing its text.
  $audioManifestPath = Join-Path $PSScriptRoot '../文法教材/learning_audio_manifest.json'
  if (Test-Path -LiteralPath $audioManifestPath) {
    $audioManifest = Get-Content -LiteralPath $audioManifestPath -Raw | ConvertFrom-Json
    $clips = $audioManifest.PSObject.Properties.Value | Sort-Object sha256 -Unique
    foreach ($clip in $clips) {
      $name = 'learning-' + $clip.sha256 + '.mp3'
      $local = Join-Path $PSScriptRoot ('../expo-app/assets/learning-audio/' + $name)
      if ((Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash.ToLowerInvariant() -ne $clip.sha256) { throw ('Local audio hash mismatch: ' + $name) }
      if ($existing -notcontains $name) {
        & $Gh release upload $tag $local --repo $repo
        if ($LASTEXITCODE -ne 0) { throw ('Audio upload failed: ' + $name) }
      }
      $check = Join-Path $work 'verify-audio.tmp'
      Invoke-WebRequest -Uri $clip.url -OutFile $check -UseBasicParsing
      if ((Get-FileHash -LiteralPath $check -Algorithm SHA256).Hash.ToLowerInvariant() -ne $clip.sha256 -or (Get-Item -LiteralPath $check).Length -ne $clip.bytes) { throw ('Public audio mismatch: ' + $name) }
    }
    Write-Output ('Verified pronunciation/practice clips: ' + $clips.Count)
  }
  $files = Get-ChildItem -LiteralPath $work -Filter 'content-*.json'
  foreach ($file in $files) {
    if ($existing -notcontains $file.Name) {
      & $Gh release upload $tag $file.FullName --repo $repo
      if ($LASTEXITCODE -ne 0) { throw ('Asset upload failed: ' + $file.Name) }
    }
  }
  Write-Output ('Uploaded immutable chunks: ' + $files.Count + '. Verifying public downloads...')
  # Confirm every referenced chunk is publicly retrievable before switching clients.
  foreach ($file in $files) {
    $url = "https://github.com/$repo/releases/download/$tag/" + $file.Name
    $check = Join-Path $work 'verify.tmp'
    Invoke-WebRequest -Uri $url -OutFile $check -UseBasicParsing
    if ((Get-FileHash -LiteralPath $check -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw ('Public hash mismatch: ' + $file.Name) }
  }
  & $Gh release upload $tag (Join-Path $work 'manifest.json') --repo $repo --clobber
  if ($LASTEXITCODE -ne 0) { throw 'Manifest publication failed.' }
  $check = Join-Path $work 'verify-manifest.tmp'
  Invoke-WebRequest -Uri ($manifestUrl + '?v=' + $Version) -OutFile $check -UseBasicParsing
  if ((Get-FileHash -LiteralPath $check -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath (Join-Path $work 'manifest.json') -Algorithm SHA256).Hash) { throw 'Published manifest mismatch.' }
  Write-Output ('Published OTA ' + $Version + '. Native build was not started.')
} finally {
  $resolved = (Resolve-Path -LiteralPath $work).Path
  if (-not $resolved.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe cleanup target' }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}
