Add-Type -AssemblyName System.Drawing
foreach ($f in '1stProj.JPG','2ndProj.JPG','3rdProj.png') {
    $path = Join-Path 'public' $f
    if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile((Resolve-Path $path))
        $kb = [math]::Round((Get-Item $path).Length / 1KB, 1)
        Write-Host "$f -> $($img.Width) x $($img.Height)  ($kb KB)"
        $img.Dispose()
    } else {
        Write-Host "$f -> NOT FOUND"
    }
}
