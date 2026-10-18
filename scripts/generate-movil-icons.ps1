param(
    [Parameter(Mandatory = $true)][string]$SourceIcon,
    [Parameter(Mandatory = $true)][string]$DestinationRoot,
    [Parameter(Mandatory = $true)][string]$AndroidResourceRoot
)

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($SourceIcon)
if ($source.Width -ne $source.Height) {
    $source.Dispose()
    throw 'assets/icon.png debe ser cuadrado para generar los iconos Android.'
}

$densities = @(
    @{ Folder = 'mipmap-mdpi'; Size = 48; Foreground = 108 },
    @{ Folder = 'mipmap-hdpi'; Size = 72; Foreground = 162 },
    @{ Folder = 'mipmap-xhdpi'; Size = 96; Foreground = 216 },
    @{ Folder = 'mipmap-xxhdpi'; Size = 144; Foreground = 324 },
    @{ Folder = 'mipmap-xxxhdpi'; Size = 192; Foreground = 432 }
)

function Save-ScaledIcon {
    param(
        [System.Drawing.Bitmap]$Image,
        [string]$OutputPath,
        [int]$Size,
        [bool]$Round,
        [double]$Scale = 1
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $drawSize = [Math]::Max(1, [int][Math]::Round($Size * $Scale))
        $offset = [int][Math]::Floor(($Size - $drawSize) / 2)

        if ($Round) {
            $clip = New-Object System.Drawing.Drawing2D.GraphicsPath
            try {
                $clip.AddEllipse(0, 0, $Size, $Size)
                $graphics.SetClip($clip)
                $graphics.DrawImage($Image, $offset, $offset, $drawSize, $drawSize)
            } finally {
                $clip.Dispose()
            }
        } else {
            $graphics.DrawImage($Image, $offset, $offset, $drawSize, $drawSize)
        }

        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    foreach ($density in $densities) {
        $folder = Join-Path $DestinationRoot $density.Folder
        if (-not (Test-Path $folder)) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
        }

        Save-ScaledIcon $source (Join-Path $folder 'ic_launcher.png') $density.Size $false
        Save-ScaledIcon $source (Join-Path $folder 'ic_launcher_round.png') $density.Size $true
        Save-ScaledIcon $source (Join-Path $folder 'ic_launcher_foreground.png') $density.Foreground $false 0.9
    }

    $stylesPath = Join-Path $AndroidResourceRoot 'values\styles.xml'
    if (Test-Path $stylesPath) {
        $styles = New-Object System.Xml.XmlDocument
        $styles.PreserveWhitespace = $true
        $styles.Load($stylesPath)
        $launchTheme = $styles.SelectSingleNode("/resources/style[@name='AppTheme.NoActionBarLaunch']")
        if ($launchTheme) {
            foreach ($itemName in @('android:background', 'android:colorBackground', 'android:windowBackground', 'android:windowSplashScreenBackground')) {
                $item = $launchTheme.SelectSingleNode("item[@name='$itemName']")
                if (-not $item) {
                    $item = $styles.CreateElement('item')
                    $item.SetAttribute('name', $itemName)
                    [void]$launchTheme.AppendChild($item)
                }
                $item.InnerText = '#FFFFFF'
            }
            $styles.Save($stylesPath)
            Write-Output 'Fondo de inicio Android actualizado a negro.'
        } else {
            Write-Warning "No se encontró AppTheme.NoActionBarLaunch en $stylesPath; no se modificó el tema nativo."
        }
    }
} finally {
    $source.Dispose()
}

Write-Output 'Iconos mipmap generados desde assets/icon.png, conservando su fondo original.'
