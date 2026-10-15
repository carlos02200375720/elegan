const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceIcon = path.join(rootDir, 'assets', 'icon.png');

if (!fs.existsSync(sourceIcon)) {
  console.error('ERROR: assets/icon.png no existe en ' + sourceIcon);
  process.exit(1);
}

console.log('=== Sincronizando ícono exclusivo de src/app/movil desde assets/icon.png ===');

// 1. Asegurar copia de assets/icon.png en la raíz y en assets clave
try {
  fs.copyFileSync(sourceIcon, path.join(rootDir, 'icon.png'));
} catch (e) {
  console.warn('Aviso copia icon.png:', e.message);
}

const directCopies = [
  path.join(rootDir, 'assets', 'icon-only.png'),
  path.join(rootDir, 'assets', 'icon-foreground.png'),
  path.join(rootDir, 'assets', 'icon-background.png'),
  path.join(rootDir, 'assets', 'logo.png')
];

directCopies.forEach(file => {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(sourceIcon, file);
  } catch (e) {
    console.warn('Aviso copia:', file, e.message);
  }
});

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
const movilResDir = path.join(rootDir, 'src', 'app', 'movil', 'res');
const androidMainRes = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

if (fs.existsSync(movilResDir) && fs.existsSync(androidMainRes)) {
  console.log('Sobrescribiendo recursos nativos en android/app/src/main/res...');
  copyDirRecursive(movilResDir, androidMainRes);
  console.log('✓ Se han reemplazado los íconos por defecto de Capacitor en android/app/src/main/res con assets/icon.png');
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
