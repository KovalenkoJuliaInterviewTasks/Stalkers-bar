// Способы доставки готовых байтов ESC/POS до принтера.
const net = require('net');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const run = (cmd, args) => new Promise((resolve, reject) => {
    execFile(cmd, args, { windowsHide: true, timeout: 30000 }, (err, stdout, stderr) => {
        if (err) reject(new Error((stderr || stdout || err.message).toString().trim()));
        else resolve();
    });
});

const withTempFile = async (data, fn) => {
    const file = path.join(os.tmpdir(), `stalkers-print-${process.pid}-${Date.now()}.bin`);
    await fs.writeFile(file, data);
    try {
        await fn(file);
    } finally {
        await fs.unlink(file).catch(() => {});
    }
};

// Сетевой принтер (LAN / Wi-Fi), стандартный порт RAW-печати 9100
const sendTcp = ({ host, port = 9100 }, data) => new Promise((resolve, reject) => {
    if (!host) return reject(new Error('Не указан host принтера'));
    const socket = net.createConnection({ host, port });
    socket.setTimeout(10000);
    socket.on('connect', () => socket.end(data));
    socket.on('timeout', () => socket.destroy(new Error(`Принтер ${host}:${port} не отвечает`)));
    socket.on('error', (err) => {
        const unreachable = ['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT', 'EHOSTDOWN'];
        reject(unreachable.includes(err.code)
            ? new Error(`Принтер ${host}:${port} недоступен — выключен или не в сети (${err.code})`)
            : err);
    });
    socket.on('close', (hadError) => { if (!hadError) resolve(); });
});

// macOS / Linux: принтер, установленный в системе (USB или Bluetooth), печать «как есть»
const sendCups = ({ name }, data) => {
    if (!name) throw new Error('Не указано имя принтера (name)');
    return withTempFile(data, file => run('lp', ['-d', name, '-o', 'raw', file]));
};

// Windows: принтер установлен в системе и открыт для общего доступа под именем share.
// Байты копируются напрямую в очередь принтера, драйвер их не меняет.
const sendWindowsShare = ({ share, host = 'localhost' }, data) => {
    if (!share) throw new Error('Не указано сетевое имя принтера (share)');
    const target = share.startsWith('\\\\') ? share : `\\\\${host}\\${share}`;
    return withTempFile(data, file => run('cmd.exe', ['/c', 'copy', '/b', file, target]));
};

// Для проверки без принтера: сохранить .bin и .png в папку
const sendFile = async ({ dir = './printed' }, data, { png, name }) => {
    await fs.mkdir(dir, { recursive: true });
    const base = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${name}`);
    await fs.writeFile(`${base}.bin`, data);
    if (png) await fs.writeFile(`${base}.png`, png);
};

const TRANSPORTS = { tcp: sendTcp, cups: sendCups, 'windows-share': sendWindowsShare, file: sendFile };

const send = (connection, data, extra) => {
    const fn = TRANSPORTS[connection?.type];
    if (!fn) throw new Error(`Неизвестный тип подключения: ${connection?.type}`);
    return fn(connection, data, extra);
};

module.exports = { send, TRANSPORTS };
