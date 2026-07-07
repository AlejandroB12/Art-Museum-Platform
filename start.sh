#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

cleanup() {
    echo -e "\nDeteniendo servicios..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null || true
    echo "Listo."
    exit 0
}

trap cleanup SIGINT SIGTERM

show_status() {
    echo "=== Procesos activos ==="
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            name="$(ps -o comm= -p "$pid" 2>/dev/null || echo 'desconocido')"
            echo "  PID $pid ($name) - EN EJECUCION"
        else
            echo "  PID $pid - DETENIDO"
        fi
    done
    exit 0
}

DEV=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--dev) DEV="--watch" ;;
        -s|--status) show_status ;;
        *) echo "Uso: $0 [-d|--dev] [-s|--status]"; exit 1 ;;
    esac
    shift
done

echo "=== Verificando conexion a bases de datos ==="
DB_OUTPUT=$(node -e "
require('dotenv').config({path:'$ROOT_DIR/.env'});
const results = [];

(async () => {
    try {
        const mysql = require('mysql2');
        const db = mysql.createConnection({host:'localhost',user:process.env.DB_USER_MYSQL,password:process.env.DB_PASSWORD_MYSQL,database:process.env.DB_NAME_MYSQL});
        await new Promise((resolve,reject) => db.connect(err=>err?reject(err):resolve()));
        db.end();
        results.push('  [MySQL]     OK');
    } catch(e) { results.push('  [MySQL]     FAIL - ' + (e.sqlMessage||e.code)); }

    try {
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:5000});
        results.push('  [MongoDB]   OK');
        await mongoose.disconnect();
    } catch(e) { results.push('  [MongoDB]   FAIL - ' + e.message.split('.')[0]); }

    try {
        const cassandra = require('cassandra-driver');
        const client = new cassandra.Client({
            cloud:{secureConnectBundle:require('path').resolve(process.env.CASSANDRA_SECURE_BUNDLE_PATH)},
            credentials:{username:process.env.CASSANDRA_CLIENT_ID,password:process.env.CASSANDRA_CLIENT_SECRET},
            keyspace:'museo_db',queryOptions:{prepare:true}
        });
        await client.connect();
        results.push('  [Cassandra] OK');
        await client.shutdown();
    } catch(e) { results.push('  [Cassandra] FAIL - ' + e.message.split('\n')[0]); }

    try {
        const neo4j = require('neo4j-driver');
        const driver = neo4j.driver(process.env.NEO4J_URI,neo4j.auth.basic(process.env.NEO4J_USERNAME,process.env.NEO4J_PASSWORD));
        await driver.verifyConnectivity();
        results.push('  [Neo4j]     OK');
        await driver.close();
    } catch(e) { results.push('  [Neo4j]     FAIL - ' + e.message.split('\n')[0]); }

    console.log(results.join('\n'));
    process.exit(results.every(r=>r.includes('OK')) ? 0 : 1);
})();
" 2>&1 || true)

ALL_OK=true
while IFS= read -r line; do
    if [[ "$line" =~ FAIL ]]; then
        echo -e "\e[31m$line\e[0m"
        ALL_OK=false
    elif [[ "$line" =~ OK ]]; then
        echo -e "\e[32m$line\e[0m"
    elif echo "$line" | grep -qE '\[MySQL\]|\[MongoDB\]|\[Cassandra\]|\[Neo4j\]'; then
        echo -e "\e[33m$line\e[0m"
    fi
done <<< "$DB_OUTPUT"

if ! $ALL_OK; then
    echo -e "\n\e[33m[ADVERTENCIA] Algunas bases de datos no estan accesibles.\e[0m"
    echo -e "\e[33mLos servicios que dependan de ellas pueden fallar.\e[0m"
fi

echo -e "\e[36m=== Iniciando Microservicios ===\e[0m"

declare -A SERVICES
SERVICES[Auth]=3001
SERVICES[Catalog]=3002
SERVICES[User]=3003
SERVICES[Checkout]=3004
SERVICES[Recommend]=3005
SERVICES[Admin]=3007

declare -A DIRS
DIRS[Auth]="modules/auth/src"
DIRS[Catalog]="modules/catalog/src"
DIRS[User]="modules/user/src"
DIRS[Checkout]="modules/checkout/src"
DIRS[Recommend]="modules/recommendations/src"
DIRS[Admin]="modules/admin/src"

for name in Auth Catalog User Checkout Recommend Admin; do
    dir="$ROOT_DIR/${DIRS[$name]}"
    file="$dir/index.js"
    if [ -n "$DEV" ]; then
        node $DEV "$file" &
    else
        node "$file" &
    fi
    pid=$!
    PIDS+=("$pid")
    sleep 0.3
    echo -e "  \e[32m[$name] PID $pid -> puerto ${SERVICES[$name]}\e[0m"
done

# Chatbot (Python)
CHAT_DIR="$ROOT_DIR/modules/chatbot/src"
(cd "$CHAT_DIR" && pip install -r requirements.txt -q 2>/dev/null && uvicorn main:app --host 0.0.0.0 --port 3006) &
py_pid=$!
PIDS+=("$py_pid")
sleep 0.3
echo -e "  \e[32m[Chatbot] PID $py_pid -> puerto 3006\e[0m"

sleep 2

FAILED=false
for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "\e[31m[ERROR] PID $pid fallo al iniciar\e[0m"
        FAILED=true
    fi
done

if $FAILED; then
    echo -e "\n\e[31mCorrige los errores antes de iniciar el gateway\e[0m"
    cleanup
    exit 1
fi

echo -e "\e[36m=== Iniciando Gateway (puerto 3000) ===\e[0m"
echo -e "\e[33mPara ver estado: $0 -s\e[0m"
echo -e "\e[33mPresiona Ctrl+C para detener todo\e[0m"

if [ -n "$DEV" ]; then
    node --watch "$ROOT_DIR/api/src/index.js"
else
    node "$ROOT_DIR/api/src/index.js"
fi

cleanup
