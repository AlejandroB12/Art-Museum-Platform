const fs = require('fs');
const path = require('path');

// ========== DATOS BASE ==========
const generos = [
  { nombre: 'Pintura', peso: 0.30 },
  { nombre: 'Escultura', peso: 0.25 },
  { nombre: 'Fotografía', peso: 0.20 },
  { nombre: 'Ceramica', peso: 0.15 },
  { nombre: 'Orfebreria', peso: 0.10 }
];

const estados = ['Disponible', 'Reservado', 'Vendida'];
const estadoPesos = [0.7, 0.2, 0.1];

const estilosPintura = ['Acrílico', 'Óleo', 'Acuarela', 'Mixta', 'Temple', 'Pastel', 'Gouache', 'Fresco'];
const soportesPintura = ['Lienzo', 'Tabla/Madera', 'Papel', 'Metal', 'Otro'];

const materialesEscultura = ['Bronce', 'Mármol', 'Acero Inoxidable', 'Madera', 'Piedra', 'Resina', 'Hierro', 'Múltiples Materiales', 'Aluminio', 'Granito'];
const clasifEspacio = ['Interior', 'Exterior', 'Ambivalente'];

const formatosFoto = ['Digital', 'Analógica', 'Película de 35mm', 'Medio Formato'];
const tiposImpresion = ['Inyección de tinta', 'Gelatina de plata', 'Digital', 'C-print', 'Lambda'];

const metalesOrfebreria = ['Oro', 'Plata', 'Platino', 'Titanio', 'Cobre', 'Bronce'];
const kilatajes = ['18K', '22K', '24K', 'No Aplica'];

const acabadosCeramica = ['Esmaltado', 'Vidriado', 'Terracota', 'Bizcocho', 'Bruñido', 'Raku'];
const arcillasCeramica = ['Porcelana', 'Gres', 'Barro común', 'Refractario', 'Arcilla de alta temperatura'];

const terminosArte = [
  'Composición', 'Armonía', 'Sinfonía', 'Cromática', 'Metamorfosis', 'Ecos', 'Reflejos',
  'Fragmentos', 'Utopía', 'Distopía', 'Horizonte', 'Abismo', 'Sueño', 'Vigilia',
  'Memoria', 'Olvido', 'Efeméride', 'Cátedra', 'Vórtice', 'Nexo', 'Límite',
  'Umbral', 'Resonancia', 'Latencia', 'Convergencia', 'Paralelismo', 'Dualidad',
  'Trascendencia', 'Inmanencia', 'Éxtasis', 'Caos', 'Cosmos', 'Génesis',
  'Renacimiento', 'Decadencia', 'Amanecer', 'Crepúsculo', 'Infinito', 'Vacío',
  'Plenitud', 'Armonía', 'Disonancia', 'Equilibrio', 'Tensión', 'Movimiento',
  'Reposo', 'Erosión', 'Sedimento', 'Estratificación', 'Fluidez', 'Solidez',
  'Transparencia', 'Opacidad', 'Luminiscencia', 'Penumbra', 'Sombra', 'Luz'
];

const adjetivos = [
  'etéreo', 'sublime', 'abstracto', 'líquido', 'sólido', 'cromático', 'monocromático',
  'bicéfalo', 'trascendental', 'horizontal', 'vertical', 'concéntrico', 'periférico',
  'esencial', 'fenomenal', 'orgánico', 'geométrico', 'simétrico', 'asimétrico',
  'radial', 'secuencial', 'simultáneo', 'perpetuo', 'fugaz', 'inmutable', 'volátil'
];

// ========== GENERAR AUTORES ==========
const nombresH = [
  'Alejandro', 'Carlos', 'Diego', 'Eduardo', 'Fernando', 'Gustavo', 'Hugo', 'Ignacio',
  'Javier', 'Leonardo', 'Manuel', 'Nicolás', 'Pablo', 'Raúl', 'Santiago', 'Tomás',
  'Vicente', 'Andrés', 'Bruno', 'César', 'Daniel', 'Emilio', 'Felipe', 'Gonzalo',
  'Héctor', 'Iván', 'Jorge', 'Luis', 'Marco', 'Óscar', 'Pedro', 'Ricardo',
  'Salvador', 'Ulises', 'Víctor', 'Xavier', 'Yago', 'Adrián', 'Benjamín', 'Cristóbal',
  'David', 'Ernesto', 'Francisco', 'Guillermo', 'Humberto', 'Ismael', 'Joaquín', 'Lorenzo',
  'Mario', 'Norberto', 'Octavio', 'Patricio', 'Ramiro', 'Sergio', 'Teodoro', 'Valentín',
  'William', 'Alberto', 'Bartolomé', 'Claudio', 'Damián', 'Enrique', 'Fabián', 'Gerardo',
  'Heriberto', 'Indalecio', 'Jerónimo', 'Kurt', 'Leandro', 'Máximo', 'Néstor', 'Orlando',
  'Plácido', 'Rafael', 'Silvestre', 'Tadeo', 'Urbano', 'Valerio', 'Xabier', 'Zacarías',
  'Amadeo', 'Bernardo', 'Celestino', 'Dario', 'Efraín', 'Florentino', 'Gaspar', 'Honorio',
  'Isaías', 'Jonás', 'Lázaro', 'Melchor', 'Natanael', 'Omar', 'Primo', 'Remigio',
  'Samuel', 'Timoteo', 'Uriel', 'Vito', 'Wilfredo', 'Yuri', 'Zenón', 'Abelardo'
];

const nombresM = [
  'Ana', 'Beatriz', 'Carmen', 'Diana', 'Elena', 'Florencia', 'Gabriela', 'Helena',
  'Isabel', 'Julia', 'Laura', 'María', 'Natalia', 'Olivia', 'Patricia', 'Queralt',
  'Rosa', 'Sofía', 'Teresa', 'Úrsula', 'Valeria', 'Ximena', 'Yolanda', 'Zulema',
  'Adriana', 'Berta', 'Camila', 'Daniela', 'Emilia', 'Fernanda', 'Gloria', 'Hilda',
  'Inés', 'Jimena', 'Leticia', 'Marina', 'Noelia', 'Ofelia', 'Paloma', 'Rebeca',
  'Silvia', 'Tamara', 'Verónica', 'Alicia', 'Bárbara', 'Cecilia', 'Dolores', 'Esther',
  'Fabiola', 'Graciela', 'Herminia', 'Irene', 'Josefina', 'Liliana', 'Matilde', 'Nora',
  'Pilar', 'Rocío', 'Susana', 'Tatiana', 'Violeta', 'Adela', 'Blanca', 'Clara',
  'Elisa', 'Francisca', 'Guadalupe', 'Honoria', 'Jacinta', 'Leonor', 'Mercedes', 'Nieves',
  'Paulina', 'Rita', 'Sara', 'Teodora', 'Vanesa', 'Adelaida', 'Brígida', 'Carolina',
  'Elvira', 'Fátima', 'Genoveva', 'Hortensia', 'Jovita', 'Lucía', 'Micaela', 'Nuria',
  'Petra', 'Ramona', 'Soledad', 'Tulia', 'Vicenta', 'Agustina', 'Benita', 'Catalina',
  'Eulalia', 'Fidela', 'Gertrudis', 'Honorina', 'Justina', 'Luciana', 'Milagros'
];

const apellidos = [
  'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Morales', 'Castillo', 'Ortiz', 'Vargas',
  'Mendoza', 'Jiménez', 'Reyes', 'Silva', 'Cruz', 'Romero', 'Moreno', 'Álvarez',
  'Gutiérrez', 'Delgado', 'Gil', 'Serrano', 'Blanco', 'Molina', 'Cabrera', 'Peña',
  'Soto', 'Vega', 'Rojas', 'Campos', 'Núñez', 'Cortés', 'Herrera', 'Medina',
  'Aguilar', 'Acosta', 'Salazar', 'Chávez', 'Fuentes', 'Guerrero', 'Paredes', 'León',
  'Espinoza', 'Carrillo', 'Vera', 'Miranda', 'Méndez', 'Rivas', 'Castro', 'Ponce',
  'Zambrano', 'Valdez', 'Zavala', 'Rosas', 'Tapia', 'Padilla', 'Arce', 'Marín',
  'Montero', 'Valenzuela', 'Santana', 'Alvarado', 'Sandoval', 'Ibarra', 'Orozco', 'Ríos',
  'Pacheco', 'Gallegos', 'Mejía', 'Cárdenas', 'Ferrer', 'Villa', 'Escobar', 'Rangel',
  'Navarro', 'Salinas', 'Montoya', 'Lara', 'Cuevas', 'Zúñiga', 'Cano', 'Bautista',
  'Mora', 'Palacios', 'Valle', 'Ayala', 'Godoy', 'Solís', 'Arenas', 'Trujillo',
  'Quintana', 'Coronado', 'Angulo', 'Cordero', 'Barrios', 'Olivera', 'Perdomo',
  'Saavedra', 'Muñoz', 'Paz', 'Arias', 'Calderón', 'Bermúdez', 'Cáceres', 'Duarte',
  'Montenegro', 'Barrera', 'Villalobos', 'Santos', 'Palma', 'Roque', 'Centeno',
  'Peralta', 'Carballo', 'Ocampo', 'Zelaya', 'Escalante', 'Ventura', 'Plaza',
  'Barahona', 'Meléndez', 'Colmenares', 'Mascareñas', 'Arellano', 'Garmendia',
  'Ureña', 'Becerra', 'Canales', 'Alarcón', 'Covarrubias', 'Lemus', 'Abarca',
  'Linares', 'Betancourt', 'Cepeda', 'Guillén', 'Lozano', 'Ballesteros', 'Ontiveros',
  'Lorenzana', 'Escudero', 'Valdivia', 'Landa', 'Portillo', 'Escamilla', 'Toro',
  'Apodaca', 'Estrada', 'Contreras', 'Fonseca', 'Quintero', 'Luján', 'Aguirre',
  'Franco', 'Briseño', 'Robledo', 'Villarreal', 'Gavilán', 'Téllez', 'Osorio',
  'Magallanes', 'Anaya', 'Grijalva', 'Zepeda', 'Beltrán', 'Arriaga', 'Madrigal',
  'Burgos', 'Borja', 'Palomo', 'Coronilla', 'Carranza', 'Puente', 'Zamora',
  'Covarrubias', 'Magaña', 'Balderas', 'Villanueva', 'Ceballos', 'Garza', 'Casillas',
  'Sepúlveda', 'Treviño', 'Maldonado', 'Abrego', 'Badillo', 'Valladares', 'Moncada',
  'Saucedo', 'Ojeda', 'Corona', 'Alanís', 'Cervantes', 'Valdés', 'Salcedo',
  'Caraballo', 'Longoria', 'Oliver', 'Farías', 'Arredondo', 'Rosales', 'Hidalgo',
  'Enríquez', 'Villegas', 'Valdivieso', 'Pedraza', 'Lerma', 'Longa', 'Pinto',
  'Macedo', 'Pereira', 'Agosto', 'Lago', 'Crespo', 'Lamas', 'Taboada', 'Pazos',
  'Villares', 'Cores', 'Fontán', 'Lage', 'Teijeiro', 'Souto', 'Grela', 'Díaz'
];

const nacionalidades = [
  'España', 'México', 'Argentina', 'Colombia', 'Perú', 'Chile', 'Venezuela', 'Brasil',
  'Estados Unidos', 'Francia', 'Italia', 'Alemania', 'Reino Unido', 'Países Bajos, Holanda',
  'Japón', 'China', 'India', 'Australia', 'Canadá', 'Rusia', 'Corea del Sur', 'Turquía',
  'Egipto', 'Marruecos', 'Nigeria', 'Sudáfrica', 'Cuba', 'Puerto Rico', 'Uruguay',
  'Paraguay', 'Bolivia', 'Ecuador', 'Costa Rica', 'Guatemala', 'Panamá', 'Portugal',
  'Grecia', 'Suiza', 'Suecia', 'Noruega', 'Dinamarca', 'Polonia', 'Hungría', 'Rumanía',
  'Ucrania', 'Israel', 'Irán', 'Líbano', 'Filipinas', 'Tailandia', 'Indonesia'
];

function randomDate(fromYear, toYear) {
  const y = Math.floor(Math.random() * (toYear - fromYear + 1)) + fromYear;
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weightedRandom(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateObraName() {
  const usePattern = Math.random();
  if (usePattern < 0.33) return `${pickRandom(terminosArte)} ${pickRandom(adjetivos)}`;
  if (usePattern < 0.66) return `${pickRomanNumeral()} · ${pickRandom(terminosArte)}`;
  return `${pickRandom(terminosArte)} #${Math.floor(Math.random() * 999) + 1}`;
}

let romanIdx = 0;
const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

function pickRomanNumeral() {
  return romanos[Math.floor(Math.random() * romanos.length)];
}

function generateBiography(nombre, apellido, nacionalidad, fechaNac) {
  const year = parseInt(fechaNac.split('-')[0]);
  const age = 2026 - year;
  const bioPatterns = [
    `${nombre} ${apellido} es un${Math.random() > 0.5 ? 'a' : ''} artista ${nacionalidad.toLowerCase()} contemporáne${Math.random() > 0.5 ? 'o' : 'a'}. Nacid${Math.random() > 0.5 ? 'o' : 'a'} en ${year}, su obra explora las fronteras entre la percepción y la materia, utilizando ${Math.random() > 0.5 ? 'luz y color' : 'texturas y volúmenes'} como lenguaje principal. Ha expuesto en galerías internacionales y su trabajo forma parte de colecciones privadas y públicas alrededor del mundo.`,
    `${nombre} ${apellido} (${fechaNac}) es ${Math.random() > 0.5 ? 'un' : 'una'} referente del arte contemporáne${Math.random() > 0.5 ? 'o' : 'a'} en ${nacionalidad}. Con ${age} años de trayectoria, ha desarrollado un lenguaje visual único que combina ${pickRandom(['técnicas mixtas', 'materiales no convencionales', 'procesos digitales', 'artesanía tradicional'])} con ${pickRandom(['conceptos filosóficos', 'crítica social', 'exploración sensorial', 'abstracción lírica'])}.`,
    `La práctica artística de ${nombre} ${apellido} se centra en la ${pickRandom(['investigación del espacio', 'manipulación de la materia', 'deconstrucción de la imagen', 'exploración cromática'])}. Nacid${Math.random() > 0.5 ? 'o' : 'a'} en ${year}, ${nombre} ha participado en bienales y ferias de arte internacionales, recibiendo ${Math.random() > 0.5 ? 'múltiples reconocimientos' : 'becas de creación artística'} por su contribución al arte ${nacionalidad.toLowerCase()}.`
  ];
  return pickRandom(bioPatterns);
}

// ========== GENERAR AUTORES (IDs 21 a 250) ==========
const autores = [];
const autorIdsUsados = new Set();

let autorId = 21;
while (autores.length < 230) {
  const nombre = Math.random() > 0.48 ? pickRandom(nombresH) : pickRandom(nombresM);
  const apellido = pickRandom(apellidos);
  const nacionalidad = pickRandom(nacionalidades);
  const fechaNac = randomDate(1940, 2000);
  const biografia = generateBiography(nombre, apellido, nacionalidad, fechaNac);

  autores.push({
    _id: autorId,
    nombre,
    apellido,
    fecha_nacimiento: fechaNac,
    fotografia: `/images/authors/author_${autorId}.webp`,
    biografia,
    nacionalidad
  });
  autorId++;
}

// ========== GENERAR OBRAS (IDs 71 a 1070) ==========
const obras = [];

// Distribuir autores para las obras (cada obra tiene 1-2 autores)
const todosLosAutores = [];
for (let i = 1; i <= 20; i++) todosLosAutores.push(i);
for (let i = 21; i <= 250; i++) todosLosAutores.push(i);

// 1000 obras: 70 ya existen, las nuevas son IDs 71-1070
for (let obraId = 71; obraId <= 1070; obraId++) {
  const generoElegido = weightedRandom(generos, generos.map(g => g.peso));
  const nombreObra = generateObraName();
  const estado = weightedRandom(estados, estadoPesos);
  const precio = Math.round((Math.random() * 999000 + 1000) * 100) / 100;

  // Asignar 1 o 2 autores
  const numAutores = Math.random() < 0.15 ? 2 : 1;
  const autoresObra = [];
  const shuffled = [...todosLosAutores].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numAutores; i++) {
    autoresObra.push(shuffled[i]);
  }

  // Fecha de creación entre 1960 y 2025
  const fechaCreacion = randomDate(1960, 2025);

  // Ruta de imagen (usando las imágenes abstractas)
  const imgIndex = obraId - 71; // 0..999
  const fotografia = `/images/art_previews/obra_${obraId}.webp`;

  // Detalles según género
  let detalles = {};
  switch (generoElegido.nombre) {
    case 'Pintura':
      detalles = {
        tecnica_principal: pickRandom(estilosPintura),
        soporte_base: pickRandom(soportesPintura),
        requiere_enmarcado: Math.random() > 0.3
      };
      break;
    case 'Escultura':
      detalles = {
        material_predominante: pickRandom(materialesEscultura),
        requiere_pedestal: Math.random() > 0.5,
        clasificacion_espacio: pickRandom(clasifEspacio)
      };
      break;
    case 'Fotografía':
      detalles = {
        formato_origen: pickRandom(formatosFoto),
        tipo_impresion_estandar: pickRandom(tiposImpresion),
        requiere_revelado_quimico: Math.random() > 0.5
      };
      break;
    case 'Orfebreria':
      detalles = {
        metal_base_dominante: pickRandom(metalesOrfebreria),
        kilataje_estandar: pickRandom(kilatajes),
        requiere_certificado_autenticidad: Math.random() > 0.2
      };
      break;
    case 'Ceramica':
      detalles = {
        tecnica_acabado: pickRandom(acabadosCeramica),
        tipo_arcilla_base: pickRandom(arcillasCeramica),
        temperatura_coccion_promedio_celsius: Math.floor(Math.random() * 600) + 800
      };
      break;
  }

  obras.push({
    _id: obraId,
    nombre: nombreObra,
    fecha_creacion: fechaCreacion,
    precio,
    estado_obra: estado,
    fotografia,
    autores: autoresObra,
    genero: {
      nombre: generoElegido.nombre,
      detalles
    }
  });
}

// ========== GENERAR JSON ==========
const output = {
  autores,
  obras
};

const outputPath = path.join(__dirname, '..', 'data', '1000_obras_seed.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ Generados ${autores.length} autores (IDs 21-250)`);
console.log(`✅ Generadas ${obras.length} obras (IDs 71-${1070})`);
console.log(`📄 Archivo guardado en: ${outputPath}`);
console.log(`📦 Tamaño: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
