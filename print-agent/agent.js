// Программа-посредник печати Stalkers Social Club.
// Каждые несколько секунд спрашивает у сервера новые задания для каждого
// принтера из config.json, рисует чек и отправляет его на принтер.
//
//   node agent.js                 — работать
//   node agent.js --test          — напечатать пробный чек на всех принтерах
//   node agent.js --test Кухня    — пробный чек только на одном принтере
//   node agent.js --config other.json
const fs = require('fs');
const path = require('path');
const { renderPng, closeBrowser } = require('./render');
const { buildJob } = require('./escpos');
const { send, TRANSPORTS } = require('./transports');

const ROLES = ['kitchen', 'bar', 'bills'];
const ROLE_LABEL = { kitchen: 'кухня', bar: 'бар', bills: 'счета' };

const args = process.argv.slice(2);
const argValue = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
};

const log = (...msg) => console.log(new Date().toLocaleTimeString('ru-RU'), ...msg);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------------ настройки

const loadConfig = () => {
    const file = path.resolve(argValue('--config') || path.join(__dirname, 'config.json'));
    if (!fs.existsSync(file)) {
        console.error(`Нет файла настроек ${file}.\nСкопируйте config.example.json в config.json и заполните его.`);
        process.exit(1);
    }
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
    const errors = [];
    if (!cfg.server) errors.push('server — адрес сервера, например https://api.example.com');
    if (!cfg.token) errors.push('token — тот же, что PRINT_AGENT_TOKEN на сервере');
    if (!Array.isArray(cfg.printers) || !cfg.printers.length) errors.push('printers — список принтеров');
    (cfg.printers || []).forEach((p, i) => {
        const where = `printers[${i}] (${p.name || 'без имени'})`;
        if (!p.name) errors.push(`${where}: name`);
        if (!Array.isArray(p.roles) || !p.roles.length || p.roles.some(r => !ROLES.includes(r))) {
            errors.push(`${where}: roles — из ${ROLES.join(', ')}`);
        }
        if (!TRANSPORTS[p.connection?.type]) errors.push(`${where}: connection.type — из ${Object.keys(TRANSPORTS).join(', ')}`);
        if (p.paper && !['58', '80'].includes(String(p.paper))) errors.push(`${where}: paper — "58" или "80"`);
    });
    const taken = cfg.printers?.flatMap(p => p.roles || []) || [];
    ROLES.filter(r => !taken.includes(r)).forEach(r => log(`Внимание: ни один принтер не печатает «${ROLE_LABEL[r]}»`));
    if (errors.length) {
        console.error(`Ошибки в ${file}:\n  - ${errors.join('\n  - ')}`);
        process.exit(1);
    }
    cfg.server = cfg.server.replace(/\/+$/, '');
    cfg.pollSeconds = Number(cfg.pollSeconds) > 0 ? Number(cfg.pollSeconds) : 3;
    cfg.printers.forEach(p => { p.paper = String(p.paper || '58'); });
    return cfg;
};

// ------------------------------------------------------------------ печать

const printHtml = async (cfg, printer, html, name) => {
    const png = await renderPng(html, printer.paper, cfg.chromePath);
    const data = buildJob(png, { paper: printer.paper, cut: printer.cut !== false });
    await send(printer.connection, data, { png, name });
};

const api = async (cfg, urlPath, body) => {
    const res = await fetch(`${cfg.server}/api/print${urlPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Print-Token': cfg.token },
        body: JSON.stringify(body || {}),
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Сервер ответил ${res.status}`);
    return data;
};

// Отдельный цикл на каждый принтер: принтеры работают параллельно,
// а задания одного принтера печатаются строго по очереди.
const printerLoop = async (cfg, printer) => {
    const info = { name: printer.name, roles: printer.roles, paper: printer.paper };
    let offline = false;
    for (;;) {
        let job = null;
        try {
            const claimed = await api(cfg, '/agent/claim', { printer: info });
            if (offline) { log('Связь с сервером восстановлена'); offline = false; }
            if (!claimed) { await sleep(cfg.pollSeconds * 1000); continue; }
            job = claimed.job;
            await printHtml(cfg, printer, claimed.html, job.kind);
            await api(cfg, `/agent/jobs/${job._id}/done`);
            log(`[${printer.name}] напечатано: ${job.label}`);
        } catch (err) {
            if (job) {
                log(`[${printer.name}] ошибка печати «${job.label}»: ${err.message}`);
                await api(cfg, `/agent/jobs/${job._id}/fail`, { error: err.message }).catch(() => {});
            } else if (!offline) {
                log(`Нет связи с сервером: ${err.message}`);
                offline = true;
            }
            await sleep(Math.max(cfg.pollSeconds, 5) * 1000);
        }
    }
};

// ------------------------------------------------------------------ пробная печать

const testHtml = (printer) => `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
  body { width: ${printer.paper === '80' ? '72mm' : '48mm'}; margin: 0 auto; padding: 2mm 0 4mm;
         font: ${printer.paper === '80' ? '13px' : '12px'}/1.35 Arial, sans-serif; color: #000; background: #fff; }
  h1 { font-size: 1.5em; text-align: center; margin: 0 0 2mm; } hr { border: 0; border-top: 1px dashed #000; }
  .bar { height: 4mm; background: repeating-linear-gradient(90deg, #000 0 2mm, #fff 2mm 4mm); }
</style></head><body>
  <h1>Пробная печать</h1>
  <div>Принтер: <b>${printer.name}</b></div>
  <div>Печатает: ${printer.roles.map(r => ROLE_LABEL[r]).join(', ')}</div>
  <div>Лента: ${printer.paper} мм</div>
  <div>${new Date().toLocaleString('ru-RU')}</div>
  <hr><div>English: Stalkers Social Club</div><div dir="rtl">עברית: תודה רבה!</div>
  <div>Кириллица: Ёжик съел щи ₪</div><hr><div class="bar"></div>
</body></html>`;

const runTest = async (cfg, only) => {
    const printers = cfg.printers.filter(p => !only || p.name === only);
    if (!printers.length) {
        console.error(`Принтер «${only}» не найден в config.json`);
        process.exitCode = 1;
        return;
    }
    for (const p of printers) {
        try {
            await printHtml(cfg, p, testHtml(p), 'test');
            log(`[${p.name}] пробный чек отправлен`);
        } catch (err) {
            log(`[${p.name}] ошибка: ${err.message}`);
            process.exitCode = 1;
        }
    }
    await closeBrowser();
};

// ------------------------------------------------------------------ запуск

const main = async () => {
    const cfg = loadConfig();
    if (args.includes('--test')) {
        const only = argValue('--test');
        return runTest(cfg, only && !only.startsWith('--') ? only : undefined);
    }
    log(`Сервер: ${cfg.server}`);
    cfg.printers.forEach(p => log(`Принтер «${p.name}»: ${p.roles.map(r => ROLE_LABEL[r]).join(', ')}, ${p.paper} мм, ${p.connection.type}`));
    log('Жду заданий… (Ctrl+C — выход)');
    await Promise.all(cfg.printers.map(p => printerLoop(cfg, p)));
};

const shutdown = async () => {
    await closeBrowser();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(err => {
    console.error(err);
    process.exit(1);
});
