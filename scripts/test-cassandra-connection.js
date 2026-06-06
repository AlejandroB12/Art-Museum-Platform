const path = require('path');
const fs = require('fs');
const https = require('https');
const tls = require('tls');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const SKIP = '\x1b[33m-\x1b[0m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function testSecureBundle() {
    console.log(`\n${BOLD}[1/5] Secure Bundle${RESET}`);
    const bundlePath = path.resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH || './secure-connect-museo-db.zip');
    if (!fs.existsSync(bundlePath)) {
        console.log(`  ${FAIL} Archivo no encontrado: ${bundlePath}`);
        return null;
    }
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(bundlePath);
        const entry = zip.getEntry('config.json');
        if (!entry) {
            console.log(`  ${FAIL} config.json no encontrado dentro del bundle`);
            return null;
        }
        const config = JSON.parse(entry.getData().toString('utf8'));
        console.log(`  ${PASS} Bundle OK`);
        console.log(`     Host          : ${config.host}`);
        console.log(`     Puerto Meta   : ${config.port || 'N/A'}`);
        console.log(`     Puerto CQL    : ${config.cql_port || 'N/A'}`);
        console.log(`     Local DC      : ${config.localDC || 'N/A'}`);
        console.log(`     Keyspace      : ${config.keyspace || 'N/A'}`);
        return config;
    } catch (err) {
        console.log(`  ${FAIL} Error leyendo bundle: ${err.message}`);
        return null;
    }
}

function testMetadataService(config) {
    return new Promise(async (resolve) => {
        console.log(`\n${BOLD}[2/5] Metadata Service (HTTPS)${RESET}`);
        if (!config) { console.log(`  ${SKIP} Saltado (bundle inválido)`); return resolve(false); }
        const bundlePath = path.resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH || './secure-connect-museo-db.zip');
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(bundlePath);
            const entries = new Map(zip.getEntries().map(e => [e.entryName, e.getData()]));
            const ssl = {
                ca: entries.get('ca.crt'),
                cert: entries.get('cert'),
                key: entries.get('key'),
                rejectUnauthorized: true
            };
            const host = config.host;
            const port = config.port || 29080;
            const url = `${host}:${port}/metadata`;
            console.log(`  Solicitando https://${url} ...`);
            const req = https.get(`https://${url}`, { ...ssl, timeout: 10000 }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const json = JSON.parse(data);
                            const ci = json.contact_info;
                            console.log(`  ${PASS} Metadata Service respondió (HTTP 200)`);
                            console.log(`     Contact Points : ${(ci.contact_points || []).join(', ')}`);
                            console.log(`     Local DC      : ${ci.local_dc}`);
                            console.log(`     SNI Proxy     : ${ci.sni_proxy_address}`);
                            resolve(true);
                        } catch {
                            console.log(`  ${FAIL} Respuesta inválida: ${data.substring(0, 200)}`);
                            resolve(false);
                        }
                    } else {
                        console.log(`  ${FAIL} HTTP ${res.statusCode} ${res.statusMessage}`);
                        resolve(false);
                    }
                });
            });
            req.on('timeout', () => { req.destroy(); console.log(`  ${FAIL} Timeout (>10s) - La DB podría estar pausada o el endpoint no responde`); resolve(false); });
            req.on('error', err => { console.log(`  ${FAIL} ${err.message}`); resolve(false); });
        } catch (err) {
            console.log(`  ${FAIL} ${err.message}`);
            resolve(false);
        }
    });
}

async function testTlsHandshake(config) {
    return new Promise(async (resolve) => {
        console.log(`\n${BOLD}[3/5] TLS Handshake (CQL port ${config?.cql_port || 29042})${RESET}`);
        if (!config) { console.log(`  ${SKIP} Saltado (sin configuración)`); return resolve(false); }
        const bundlePath = path.resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH || './secure-connect-museo-db.zip');
        try {
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(bundlePath);
            const entries = new Map(zip.getEntries().map(e => [e.entryName, e.getData()]));
            const ssl = {
                ca: entries.get('ca.crt'),
                cert: entries.get('cert'),
                key: entries.get('key'),
                rejectUnauthorized: true
            };
            const host = config.host;
            const port = config.cql_port || 29042;
            console.log(`  Conectando a ${host}:${port} ...`);
            const socket = tls.connect(port, host, { ...ssl, timeout: 10000 }, () => {
                console.log(`  ${PASS} Handshake TLS exitoso (protocolo: ${socket.getProtocol()})`);
                socket.end();
                resolve(true);
            });
            socket.on('timeout', () => { socket.destroy(); console.log(`  ${FAIL} Timeout (>10s)`); resolve(false); });
            socket.on('error', err => { console.log(`  ${FAIL} ${err.message}`); resolve(false); });
        } catch (err) {
            console.log(`  ${FAIL} ${err.message}`);
            resolve(false);
        }
    });
}

function testDns() {
    return new Promise((resolve) => {
        console.log(`\n${BOLD}[4/5] Resolución DNS${RESET}`);
        const host = process.env.CASSANDRA_HOST || 'bfaebd13-2865-4838-a619-833b49a054b1-us-east-2.db.astra.datastax.com';
        dns.resolve4(host, (err, addresses) => {
            if (err) {
                console.log(`  ${FAIL} DNS lookup falló: ${err.message}`);
                return resolve(false);
            }
            console.log(`  ${PASS} ${host} → ${addresses.join(', ')}`);
            resolve(true);
        });
    });
}

async function testFullDriver(config) {
    console.log(`\n${BOLD}[5/5] Conexión completa con cassandra-driver${RESET}`);
    if (!config) { console.log(`  ${SKIP} Saltado (sin configuración)`); return; }
    try {
        const { client, connectCassandra } = require('../config/cassandra');
        client.options.socketOptions = { ...client.options.socketOptions, connectTimeout: 30000, readTimeout: 30000 };
        console.log('  Conectando (timeout: 30s)...');
        await connectCassandra();
        console.log(`  ${PASS} Conexión exitosa a Cassandra`);
        await client.shutdown();
    } catch (err) {
        console.log(`  ${FAIL} ${err.message}`);
        if (err.innerErrors) {
            for (const [host, inner] of Object.entries(err.innerErrors)) {
                console.log(`     ${host}: ${inner.message}`);
            }
        }
    }
}

async function run() {
    console.log(`${BOLD}=== Diagnóstico de conexión Cassandra (DataStax Astra) ===${RESET}\n`);
    console.log(`CLIENT_ID     : ${process.env.CASSANDRA_CLIENT_ID ? process.env.CASSANDRA_CLIENT_ID.substring(0, 12) + '...' : 'NO CONFIGURADO'}`);
    console.log(`KEYSPACE      : ${process.env.CASSANDRA_KEYSPACE || 'NO CONFIGURADO'}`);
    console.log(`BUNDLE        : ${process.env.CASSANDRA_SECURE_BUNDLE_PATH || 'NO CONFIGURADO'}`);
    const config = await testSecureBundle();
    if (config) await testDns();
    const metaOk = await testMetadataService(config);
    await sleep(300);
    const tlsOk = await testTlsHandshake(config);
    await sleep(300);
    await testFullDriver(config);
    console.log(`\n${BOLD}=== Resumen ===${RESET}`);
    console.log(`  Bundle       : ${config ? PASS : FAIL}`);
    console.log(`  DNS          : ${config ? '(se probó arriba)' : SKIP}`);
    console.log(`  Metadata     : ${metaOk ? PASS : FAIL}`);
    console.log(`  TLS Handshake: ${tlsOk ? PASS : FAIL}`);
    if (metaOk && tlsOk) {
        console.log(`\n  Recomendación: Revisar las credenciales (CLIENT_ID/SECRET) en .env`);
    } else if (metaOk && !tlsOk) {
        console.log(`\n  Recomendación: El puerto CQL (${config?.cql_port || 29042}) podría estar bloqueado`);
    } else {
        console.log(`\n  Recomendación: Revisar el estado de la DB en astra.datastax.com`);
        console.log(`  - Si está "Hibernated", reanúdala desde la consola`);
        console.log(`  - Si está "Active", regenera el Secure Bundle y el Token`);
    }
    process.exit(0);
}

run();
