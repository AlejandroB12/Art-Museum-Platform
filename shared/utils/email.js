const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendMail(options) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(options, (error, info) => {
            if (error) reject(error);
            else resolve(info);
        });
    });
}

function createApprovalEmail(usuario, codigo) {
    return {
        from: '"Museo de Arte Contemporáneo" <fg57179@gmail.com>',
        to: usuario.Email,
        subject: 'Tu cuenta ha sido aprobada',
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0; padding:0; background-color:#121212; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121212; padding:40px 20px;">
                <tr><td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="background:#1e1e1e; border:1px solid #00ff00; border-radius:12px; box-shadow:0 10px 40px rgba(0,255,0,0.1); max-width:100%;">
                        <tr><td style="padding:40px 35px; text-align:center;">
                            <div style="font-size:48px; margin-bottom:15px;">&#10003;</div>
                            <h1 style="color:#00ff00; font-size:28px; font-weight:800; text-transform:uppercase; letter-spacing:-1px; margin:0 0 8px;">¡Bienvenido!</h1>
                            <p style="color:#ffffff; font-size:18px; font-weight:600; margin:0 0 15px;">Tu registro ha sido aprobado</p>
                            <p style="color:#888; font-size:14px; line-height:1.7; margin:0 0 10px;">Hola <strong style="color:#00ff00;">${usuario.Nombre} ${usuario.Apellido}</strong>,</p>
                            <p style="color:#888; font-size:14px; line-height:1.7; margin:0 0 25px;">Tu cuenta en el Museo de Arte Contemporáneo ha sido verificada y activada por nuestro equipo administrativo.</p>
                            <div style="background:rgba(0,255,0,0.05); border-left:4px solid #00ff00; border-radius:6px; padding:20px; margin-bottom:25px;">
                                <p style="color:#999; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">Tu código de verificación</p>
                                <p style="color:#00ff00; font-size:32px; font-weight:900; letter-spacing:6px; margin:0; text-shadow:0 0 20px rgba(0,255,0,0.4);">${codigo}</p>
                            </div>
                            <p style="color:#888; font-size:13px; line-height:1.6; margin:0 0 5px;">Utiliza este código en tu panel de usuario para completar la verificación de tu cuenta.</p>
                            <p style="color:#555; font-size:12px; line-height:1.6; margin:0 0 30px;">Ya puedes iniciar sesión y acceder a todas las funciones del museo.</p>
                            <table cellpadding="0" cellspacing="0" align="center">
                                <tr><td align="center" style="background:#00ff00; border-radius:5px; padding:14px 40px;">
                                    <a href="http://localhost:3000/public/login.html" style="color:#121212; font-size:14px; font-weight:700; text-decoration:none; text-transform:uppercase; letter-spacing:1.5px; display:inline-block;">Iniciar Sesión</a>
                                </td></tr>
                            </table>
                            <p style="color:#555; font-size:11px; margin-top:30px; margin-bottom:0;">Museo de Arte Contemporáneo &mdash; Tu Estilo, Tu Obra</p>
                        </td></tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>
        `
    };
}

function createRecoveryEmail(correo, enlace) {
    return {
        from: '"Museo Virtual" <fg57179@gmail.com>',
        to: correo,
        subject: 'Restablecer tu contraseña',
        html: `<div style="text-align: center;"><h2>Recuperación</h2><a href="${enlace}">Click aquí para cambiar contraseña</a></div>`
    };
}

module.exports = { sendMail, createApprovalEmail, createRecoveryEmail };
