<div align="center">
  <img src="assets/images/museo_readme.png" alt="Museo Contemporáneo Banner" width="600" style="border-radius: 100px; border: 15px solid #30363d; max-width: 100%; height: auto; display: block; margin-bottom: 24px;">

  <h1>🏛️ Museo Contemporáneo</h1>
  <p><i>Sistema Integral de Gestión de Obras, Autores y Suscripciones</i></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
    <img src="https://img.shields.io/badge/MySQL-00758F?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  </p>
</div>

Este proyecto es una plataforma web integral diseñada para la administración de un **Museo Contemporáneo**. Permite gestionar el catálogo de obras de arte, organizar la información por autores y manejar un sistema de suscripciones para los usuarios.

## 🚀 Características

- **Gestión de Obras:** Registro detallado de piezas artísticas vinculadas a sus respectivos autores.
- **Módulo de Autores:** Organización y visualización de biografías y colecciones por artista.
- **Sistema de Suscripciones:** Control de membresías para el acceso a contenido o servicios del museo.
- **Base de Datos Relacional:** Estructura robusta en MySQL para garantizar la integridad de la información.
- **Interfaz Moderna:** Diseño limpio y minimalista acorde a la estética de un museo contemporáneo.

## 🛠️ Tecnologías Utilizadas

- **Backend:** [Node.js](https://nodejs.org/) con el framework **Express**.
- **Base de Datos:** [MySQL](https://www.mysql.com/) (diseño relacional).
- **Frontend:** HTML5, CSS3 y JavaScript.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- Node.js (v14 o superior)
- MySQL Server
- Un gestor de paquetes como NPM (incluido con Node.js)
  
## ✒️ Autores

El desarrollo de este proyecto fue realizado por:

 - Alejandro Briceño
 - Kelvys Concepcion
 - Rolanny Sanchez

## 📂 Estructura del Proyecto

```text
Museo-Contemporaneo/
├── 📁 assets/
│   ├── 📁 icons/
│   │   ├── 🖼️ museo.png
│   │   ├── 🖼️ registro.png
│   │   └── 🖼️ usuario.png
│   ├── 📁 images/
│   │   ├── 📁 art_previews/
│   │   └── 📁 authors/
│   └── 📁 styles/
│       ├── 🎨 Estilo-correo-exitoso.css
│       ├── 🎨 Estilo-inicio.css
│       ├── 🎨 Estilo-login.css
│       ├── 🎨 Estilo-obra.css
│       ├── 🎨 Estilo-recuperacion.css
│       └── 🎨 Estilo-registro.css
├── 📁 config/
│   └── 🛢️ database.sql
├── 📁 docs/
│   ├── 🖼️ MERE_1.Jpeg
│   └── 🖼️ MERE_2.jpeg
├── 📁 routes/
│   ├── 🟨 Admin.js
│   ├── 🟨 Catalogo.js
│   └── 🟨 Login.js
├── 📁 server/
│   └── 🟢 serve.js
├── 📁 sql/
│   └── 🛢️ scripts.sql
└── 📁 views/
    ├── 📁 admin/
    │   ├── 🌐 Credenciales-incorrectas-administrador.html
    │   ├── 🌐 Login-administrador.html
    │   ├── 🌐 Mensaje-exitoso.html
    │   ├── 🌐 Panel-administrador.html
    │   └── 🌐 Registrar-administrador.html
    ├── 📁 public/
    │   ├── 🌐 Artista.html
    │   ├── 🌐 Autor.html
    │   ├── 🌐 Obra.html
    │   └── 🌐 inicio.html
    ├── 📁 recovery/
    │   ├── 🌐 Actualizacion-contraseña.html
    │   ├── 🌐 Confirmacion-envio.html
    │   ├── 🌐 Correo-exitoso.html
    │   └── 🌐 Recuperacion-contraseña.html
    └── 📁 user/
        ├── 🌐 Credenciales-incorrectas.html
        ├── 🌐 Cuenta-pendiente.html
        ├── 🌐 Envio-exitoso.html
        ├── 🌐 Login.html
        ├── 🌐 Mensaje-exitoso.html
        ├── 🌐 Panel-usuario.html
        ├── 🌐 Preguntas_codigo.html
        ├── 🌐 Registrar-envio.html
        ├── 🌐 Registro.html
        └── 🌐 pago.html       
