param(
    [switch]$Dev,
    [switch]$Status
)

if ($Status) {
    Get-Job | Select-Object Id, Name, State, @{N='Output';E={($_ | Receive-Job -Keep) -join "`n"}} | Format-List
    return
}

Write-Host "=== Verificando conexion a bases de datos ===" -ForegroundColor Cyan
$dbCheck = node -e "
require('dotenv').config({path:'./.env'});
const dns = require('dns');
dns.setServers(['1.1.1.1','8.8.8.8']);
const results = [];

(async () => {
    // MySQL
    try {
        const mysql = require('mysql2');
        const db = mysql.createConnection({host:'localhost',user:'root',password:process.env.DB_PASSWORD_MYSQL,database:process.env.DB_NAME_MYSQL});
        await new Promise((resolve,reject) => db.connect(err=>err?reject(err):resolve()));
        db.end();
        results.push('  [MySQL]     OK');
    } catch(e) { results.push('  [MySQL]     FAIL - ' + (e.sqlMessage||e.code)); }

    // MongoDB
    try {
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:5000});
        results.push('  [MongoDB]   OK');
        await mongoose.disconnect();
    } catch(e) { results.push('  [MongoDB]   FAIL - ' + e.message.split('.')[0]); }

    // Cassandra
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

    // Neo4j
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
" 2>&1

$dbLines = $dbCheck -split "`n"
$allOk = $true
foreach ($line in $dbLines) {
    if ($line -match 'FAIL') { Write-Host $line -ForegroundColor Red; $allOk = $false }
    elseif ($line -match 'OK') { Write-Host $line -ForegroundColor Green }
    elseif ($line -match '\[MySQL\]|\[MongoDB\]|\[Cassandra\]|\[Neo4j\]') { Write-Host $line -ForegroundColor Yellow }
}

if (-not $allOk) {
    Write-Host "`n[ADVERTENCIA] Algunas bases de datos no estan accesibles." -ForegroundColor Yellow
    Write-Host "Los servicios que dependan de ellas pueden fallar.`n" -ForegroundColor Yellow
}

$watch = if ($Dev) { "--watch" } else { "" }

Write-Host "=== Iniciando Microservicios ===" -ForegroundColor Cyan

$services = @(
    @{Name="Auth";        Port=3001; Dir="modules/auth/src"; File="index.js"},
    @{Name="Catalog";     Port=3002; Dir="modules/catalog/src"; File="index.js"},
    @{Name="User";        Port=3003; Dir="modules/user/src"; File="index.js"},
    @{Name="Checkout";    Port=3004; Dir="modules/checkout/src"; File="index.js"},
    @{Name="Recommend";   Port=3005; Dir="modules/recommendations/src"; File="index.js"},
    @{Name="Admin";       Port=3007; Dir="modules/admin/src"; File="index.js"}
)

$jobs = @()
$ok = $true

foreach ($svc in $services) {
    $svcFile = Join-Path $PWD "$($svc.Dir)/$($svc.File)"
    $argList = if ($watch) { @($watch, $svcFile) } else { @($svcFile) }
    $job = Start-Job -Name $svc.Name -ScriptBlock {
        param($f, $wl, $wd)
        Set-Location $wd
        if ($wl) { node --watch $f } else { node $f }
    } -ArgumentList $svcFile, ($watch -ne ""), $PWD
    $jobs += $job
    Start-Sleep -Milliseconds 300
    Write-Host "  [$($svc.Name)] Job $($job.Id) -> puerto $($svc.Port)" -ForegroundColor Green
}

$chatDir = "$PWD/modules/chatbot/src"
$pyJob = Start-Job -Name "Chatbot" -ScriptBlock {
    param($d)
    Set-Location $d
    pip install -r requirements.txt -q 2>$null
    uvicorn main:app --host 0.0.0.0 --port 3006
} -ArgumentList $chatDir
$jobs += $pyJob
Start-Sleep -Milliseconds 300
Write-Host "  [Chatbot] Job $($pyJob.Id) -> puerto 3006" -ForegroundColor Green

Start-Sleep -Seconds 2
$failed = Get-Job | Where-Object State -eq Failed
if ($failed) {
    Write-Host "`n[ERROR] Servicios fallaron al iniciar:" -ForegroundColor Red
    $failed | ForEach-Object {
        $err = $_ | Receive-Job -Keep
        Write-Host "  $($_.Name): $err" -ForegroundColor Red
        Remove-Job $_ -Force
    }
    $ok = $false
}

if ($ok) {
    Write-Host "`n=== Iniciando Gateway (puerto 3000) ===" -ForegroundColor Cyan
    Write-Host "Para ver salida de servicios: .\start.ps1 -Status" -ForegroundColor Yellow
    Write-Host "Presiona Ctrl+C para detener todo`n" -ForegroundColor Yellow
} else {
    Write-Host "`nCorrige los errores antes de iniciar el gateway" -ForegroundColor Red
    $jobs | Stop-Job -PassThru | Remove-Job -Force
    exit 1
}

try {
    if ($watch) {
        node --watch api/src/index.js
    } else {
        node api/src/index.js
    }
} finally {
    Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
    $jobs | Stop-Job -PassThru | Remove-Job -Force
    Write-Host "Listo." -ForegroundColor Green
}
