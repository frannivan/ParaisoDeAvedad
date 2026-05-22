const fs = require('fs');
const path = require('path');

try {
  const srcPortada = '/Users/franivan/.gemini/antigravity/brain/c428647f-2c9a-48ea-93f8-335ed866a10b/portada_1779244301618.png';
  const destPortada = '/Users/franivan/Documents/ProyectosWeb/ParaisoDeAvedad/client/src/assets/portada.png';

  const srcPool = '/Users/franivan/.gemini/antigravity/brain/c428647f-2c9a-48ea-93f8-335ed866a10b/pool_1779244330114.png';
  const destPool = '/Users/franivan/Documents/ProyectosWeb/ParaisoDeAvedad/client/src/assets/pool.png';

  fs.copyFileSync(srcPortada, destPortada);
  console.log('✅ Copied portada.png');

  fs.copyFileSync(srcPool, destPool);
  console.log('✅ Copied pool.png');
} catch (err) {
  console.error('❌ Copy failed:', err);
}
