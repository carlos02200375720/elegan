const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourceIcon = path.join(rootDir, 'public', 'icon.png');

if (!fs.existsSync(sourceIcon)) {
  console.error('ERROR: public/icon.png no existe en ' + sourceIcon);
  process.exit(1);
}

console.log('=== Sincronizando ícono exclusivo de src/app/movil desde public/icon.png ===');

const movilResDir = path.join(rootDir, 'src', 'app', 'movil', 'res');
const androidMainRes = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
const imageGenerator = path.join(__dirname, 'generate-movil-icons.ps1');
const powershell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
try {
  const generation = spawnSync(
    powershell,
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', imageGenerator, sourceIcon, movilResDir, androidMainRes],
    { stdio: 'inherit' }
  );
  if (generation.error || generation.status !== 0) {
    if (process.platform === 'win32') {
      console.warn('Aviso: no se pudo ejecutar el generador powershell:', generation.error?.message || generation.status);
    }
  }
} catch (e) {
  console.warn('Aviso ejecutando generador de íconos:', e.message);
}

// Función de copia recursiva robusta
function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
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

// 2. Si android/app/src/main/res existe, sobreescribir inmediatamente todos los mipmaps
if (fs.existsSync(movilResDir) && fs.existsSync(androidMainRes)) {
  console.log('Sobrescribiendo recursos nativos en android/app/src/main/res...');
  copyDirRecursive(movilResDir, androidMainRes);
  console.log('✓ Se han reemplazado los íconos por defecto de Capacitor en android/app/src/main/res con public/icon.png');
}

// 3. Si existe AndroidManifest en movil y en android/app, sincronizarlo
const movilManifest = path.join(rootDir, 'src', 'app', 'movil', 'AndroidManifest.xml');
const androidManifest = path.join(rootDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(movilManifest) && fs.existsSync(path.dirname(androidManifest))) {
  try {
    fs.copyFileSync(movilManifest, androidManifest);
    console.log('✓ AndroidManifest.xml sincronizado en android/app/src/main/AndroidManifest.xml');
  } catch (e) {
    console.warn('Aviso sincronizando manifest:', e.message);
  }
}

console.log('✓ Sincronización de ícono de app/movil completada exitosamente.');
process.exit(0);
