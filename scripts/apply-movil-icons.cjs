const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourceIcon = path.join(rootDir, 'assets', 'icon.png');

if (!fs.existsSync(sourceIcon)) {
  console.error('ERROR: assets/icon.png no existe en ' + sourceIcon);
  process.exit(1);
}

console.log('=== Generando y sincronizando íconos móviles desde assets/icon.png ===');

// 1. Asegurar copia en la raíz y en assets complementarios
const rootIcon = path.join(rootDir, 'icon.png');
fs.copyFileSync(sourceIcon, rootIcon);

const assetFiles = [
  path.join(rootDir, 'assets', 'icon-only.png'),
  path.join(rootDir, 'assets', 'icon-foreground.png'),
  path.join(rootDir, 'assets', 'icon-background.png'),
  path.join(rootDir, 'assets', 'logo.png'),
  path.join(rootDir, 'public', 'icon.png'),
  path.join(rootDir, 'public', 'assets', 'icon.png'),
  path.join(rootDir, 'public', 'app-icon.png')
];

assetFiles.forEach(file => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(sourceIcon, file);
});

// Helper para ejecutar ffmpeg de forma segura
function resizeImage(src, dest, width, height, padSafeZone = false) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let filter = `scale=${width}:${height}:flags=lanczos`;
  if (padSafeZone) {
    // Para adaptive icon foreground en Android: el área segura es ~66.7%
    // Redimensionamos al 68% y rellenamos hasta width x height con blanco (#FFFFFF)
    const innerW = Math.round(width * 0.68);
    const innerH = Math.round(height * 0.68);
    filter = `scale=${innerW}:${innerH}:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=white`;
  }

  const cmd = `ffmpeg -y -i "${src}" -vf "${filter}" "${dest}"`;
  execSync(cmd, { stdio: 'pipe' });
}

// 2. Generar iconos de web/PWA en public/
console.log('Generando tamaños PWA y web...');
resizeImage(sourceIcon, path.join(rootDir, 'public', 'icon-192.png'), 192, 192);
resizeImage(sourceIcon, path.join(rootDir, 'public', 'icon-192.jpg'), 192, 192);
resizeImage(sourceIcon, path.join(rootDir, 'public', 'icon-512.png'), 512, 512);
resizeImage(sourceIcon, path.join(rootDir, 'public', 'icon-512.jpg'), 512, 512);
resizeImage(sourceIcon, path.join(rootDir, 'public', 'app-icon.jpg'), 512, 512);
resizeImage(sourceIcon, path.join(rootDir, 'public', 'apple-touch-icon.png'), 180, 180);

const mallAppIconJpg = path.join(rootDir, 'src', 'assets', 'images', 'mall_app_icon_1787670053112.jpg');
if (fs.existsSync(path.dirname(mallAppIconJpg))) {
  resizeImage(sourceIcon, mallAppIconJpg, 512, 512);
}

// 3. Generar la estructura completa de Android mipmaps en src/app/movil/res
const movilResDir = path.join(rootDir, 'src', 'app', 'movil', 'res');

const androidDensities = [
  { name: 'mipmap-mdpi', launcherSize: 48, foregroundSize: 108 },
  { name: 'mipmap-hdpi', launcherSize: 72, foregroundSize: 162 },
  { name: 'mipmap-xhdpi', launcherSize: 96, foregroundSize: 216 },
  { name: 'mipmap-xxhdpi', launcherSize: 144, foregroundSize: 324 },
  { name: 'mipmap-xxxhdpi', launcherSize: 192, foregroundSize: 432 },
];

console.log('Generando mipmaps nativos de Android en src/app/movil/res...');

androidDensities.forEach(d => {
  const targetDir = path.join(movilResDir, d.name);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  // Icono estándar de la app
  resizeImage(sourceIcon, path.join(targetDir, 'ic_launcher.png'), d.launcherSize, d.launcherSize);
  // Icono circular de la app
  resizeImage(sourceIcon, path.join(targetDir, 'ic_launcher_round.png'), d.launcherSize, d.launcherSize);
  // Icono de primer plano adaptable para Android 8.0+
  resizeImage(sourceIcon, path.join(targetDir, 'ic_launcher_foreground.png'), d.foregroundSize, d.foregroundSize, true);
});

// Generar configuración adaptive-icon para Android 8.0+ (API 26+)
const anydpiDir = path.join(movilResDir, 'mipmap-anydpi-v26');
if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

const adaptiveLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveLauncherXml);
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveLauncherXml);

// Background color (#FFFFFF coincide exactamente con el fondo de assets/icon.png)
const valuesDir = path.join(movilResDir, 'values');
if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });

const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
`;
fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), backgroundXml);

// 4. Si el directorio android/app/src/main/res existe, sobreescribir TODO de inmediato
const androidMainRes = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
if (fs.existsSync(androidMainRes)) {
  console.log('Sobrescribiendo recursos en android/app/src/main/res...');
  copyDirRecursive(movilResDir, androidMainRes);
}

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('✓ ÉXITO: Ícono assets/icon.png aplicado exclusivamente a src/app/movil y preparado para Capacitor Android.');
