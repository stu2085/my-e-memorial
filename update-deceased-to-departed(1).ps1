# MyEMemorial: customer-facing Deceased -> Departed terminology update
# Run from: C:\Projects\my-e-memorial
#
# This script edits only Git-tracked text files containing Deceased/deceased.
# It deliberately avoids generic replacements of standalone deceased/deceased
# so internal comments, identifiers, routes, and technical values stay unchanged.
# In particular, it does NOT change mode === "deceased".

$ErrorActionPreference = "Stop"

$files = git grep -Il -E "\bDeceased\b|\bdeceased\b"

if (-not $files) {
    Write-Host "No Deceased/deceased occurrences found."
    exit 0
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changedFiles = @()

foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file)

    $updated = $text
    $updated = $updated.Replace("Deceased MyEMemorial", "Departed MyEMemorial")
    $updated = $updated.Replace("DeceasedMyEMemorial", "Departed MyEMemorial")
    $updated = $updated.Replace("DECEASED MYEMEMORIAL", "DEPARTED MYEMEMORIAL")

    # Clean up two spacing defects already present in the gift-page wording.
    $updated = $updated.Replace("Gifta Departed MyEMemorial", "Gift a Departed MyEMemorial")
    $updated = $updated.Replace("someone you careabout.", "someone you care about.")
    $updated = $updated.Replace("invitation toclaim", "invitation to claim")
    $updated = $updated.Replace("claimthe gift", "claim the gift")

    if ($updated -ne $text) {
        [System.IO.File]::WriteAllText($file, $updated, $utf8NoBom)
        $changedFiles += $file
        Write-Host "Updated: $file"
    }
}

Write-Host ""
Write-Host "Updated $($changedFiles.Count) file(s)."
Write-Host ""
Write-Host 'Remaining Deceased/deceased occurrences:'
git grep -ni -E "\bDeceased\b|\bdeceased\b"

Write-Host ""
Write-Host "Expected remaining technical occurrence:"
Write-Host 'app/create/CreateClient.tsx ... mode === "memorial" || mode === "deceased";'
