const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const sharp = require('sharp');

const NombresH = new Set([
  'Alejandro','Carlos','Diego','Eduardo','Fernando','Gustavo','Hugo','Ignacio',
  'Javier','Leonardo','Manuel','Nicolás','Pablo','Raúl','Santiago','Tomás',
  'Vicente','Andrés','Bruno','César','Daniel','Emilio','Felipe','Gonzalo',
  'Héctor','Iván','Jorge','Luis','Marco','Óscar','Pedro','Ricardo',
  'Salvador','Ulises','Víctor','Xavier','Yago','Adrián','Benjamín','Cristóbal',
  'David','Ernesto','Francisco','Guillermo','Humberto','Ismael','Joaquín','Lorenzo',
  'Mario','Norberto','Octavio','Patricio','Ramiro','Sergio','Teodoro','Valentín',
  'William','Alberto','Bartolomé','Claudio','Damián','Enrique','Fabián','Gerardo',
  'Heriberto','Indalecio','Jerónimo','Kurt','Leandro','Máximo','Néstor','Orlando',
  'Plácido','Rafael','Silvestre','Tadeo','Urbano','Valerio','Xabier','Zacarías',
  'Amadeo','Bernardo','Celestino','Dario','Efraín','Florentino','Gaspar','Honorio',
  'Isaías','Jonás','Lázaro','Melchor','Natanael','Omar','Primo','Remigio',
  'Samuel','Timoteo','Uriel','Vito','Wilfredo','Yuri','Zenón','Abelardo'
]);

function getGender(nombre) {
  return NombresH.has(nombre) ? 'male' : 'female';
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.slice(0,200))); }
      });
    }).on('error', reject);
  });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const dataFile = path.join(__dirname, '..', 'data', '1000_obras_seed.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const authorsDir = path.join(__dirname, '..', 'assets', 'images', 'authors');

  let success = 0;
  let failed = 0;

  // Filtrar solo autores nuevos (IDs 21-250)
  const newAuthors = data.autores.filter(a => a._id >= 21).sort((a,b) => a._id - b._id);
  console.log(`Descargando fotos para ${newAuthors.length} autores (IDs 21-250)...`);

  for (const autor of newAuthors) {
    const outputFile = path.join(authorsDir, `author_${autor._id}.webp`);

    // Saltar si ya existe
    if (fs.existsSync(outputFile)) {
      console.log(`  [SKIP] author_${autor._id}.webp ya existe`);
      autor.fotografia = `/images/authors/author_${autor._id}.webp`;
      success++;
      continue;
    }

    const gender = getGender(autor.nombre);
    const year = parseInt(autor.fecha_nacimiento.split('-')[0]);
    const edad = 2026 - year;

    try {
      // Obtener datos del usuario random
      const apiUrl = `https://randomuser.me/api/?gender=${gender}&noinfo`;
      const result = await httpGet(apiUrl);

      if (!result.results || !result.results[0]) {
        throw new Error('Respuesta vacía de randomuser.me');
      }

      const pictureUrl = result.results[0].picture.large;
      const imgBuffer = await downloadImage(pictureUrl);

      // Convertir a webp y guardar
      await sharp(imgBuffer)
        .resize(400, 400, { fit: 'cover', position: 'entropy' })
        .webp({ quality: 85 })
        .toFile(outputFile);

      autor.fotografia = `/images/authors/author_${autor._id}.webp`;
      success++;
      console.log(`  [OK] author_${autor._id}.webp (${autor.nombre} ${autor.apellido}, ~${edad}a, ${gender})`);

    } catch (err) {
      failed++;
      console.error(`  [ERR] author_${autor._id} (${autor.nombre} ${autor.apellido}): ${err.message}`);
    }

    // Pequeña pausa entre cada request para no saturar la API
    await sleep(300 + Math.random() * 400);
  }

  // Guardar JSON actualizado
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n✅ Completado: ${success} descargadas, ${failed} fallos`);
  console.log(`📄 JSON actualizado con las nuevas rutas`);

  process.exit(0);
})();
