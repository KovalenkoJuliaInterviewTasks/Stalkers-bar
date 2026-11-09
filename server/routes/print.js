const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const PrintJob = require('../models/PrintJob');
const Table = require('../models/Table');
const { renderBill, renderTicket } = require('../utils/receipts');
const { agentState, touchAgent, onlinePrinters, AGENT_ONLINE_MS } = require('../utils/printQueue');

const ROLES = ['kitchen', 'bar', 'bills'];
const JOB_TTL_MS = 30 * 60 * 1000;   // старше 30 минут не печатаем — заказ уже неактуален
const STALE_CLAIM_MS = 2 * 60 * 1000; // агент взял задание и пропал — отдать снова
const MAX_ATTEMPTS = 5;

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ------------------------------------------------------------------ для программы-посредника

// Доступ только с токеном PRINT_AGENT_TOKEN из .env (заголовок X-Print-Token).
const requireAgent = (req, res, next) => {
    const expected = process.env.PRINT_AGENT_TOKEN;
    if (!expected) return res.status(503).json({ error: 'PRINT_AGENT_TOKEN не задан на сервере' });
    const given = String(req.get('X-Print-Token') || '');
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: 'Неверный токен' });
    }
    next();
};

const parsePrinter = (body) => {
    const p = body?.printer || {};
    const roles = (Array.isArray(p.roles) ? p.roles : []).filter(r => ROLES.includes(r));
    return { name: String(p.name || 'printer').slice(0, 60), roles, paper: p.paper === '80' ? '80' : '58' };
};

// Подготовить HTML для задания. null — задание больше не нужно (стол удалён, счёт снят).
const renderJob = async (job, paper) => {
    const table = await Table.findById(job.tableId);
    if (!table) return null;
    if (job.kind === 'bill') {
        if (table.status !== 'closed') return null;
        return renderBill(table, table.lang, paper);
    }
    const ticket = table.tickets.id(job.ticketId);
    return ticket ? renderTicket(table, ticket, paper) : null;
};

// POST /agent/claim { printer: { name, roles, paper } } — взять следующее задание для принтера.
// Ответ: { job, html } или 204, если печатать нечего.
router.post('/agent/claim', requireAgent, handle(async (req, res) => {
    const printer = parsePrinter(req.body);
    touchAgent(printer);
    if (!printer.roles.length) return res.status(204).end();

    const now = new Date();
    await PrintJob.updateMany(
        { status: 'pending', queuedAt: { $lt: new Date(now - JOB_TTL_MS) } },
        { $set: { status: 'expired' } },
    );
    await PrintJob.updateMany(
        { status: 'printing', claimedAt: { $lt: new Date(now - STALE_CLAIM_MS) } },
        { $set: { status: 'pending', nextTryAt: now } },
    );

    for (let i = 0; i < 5; i++) {
        // Атомарно: одно задание достанется только одному агенту/принтеру.
        const job = await PrintJob.findOneAndUpdate(
            { role: { $in: printer.roles }, status: 'pending', nextTryAt: { $lte: now } },
            { $set: { status: 'printing', claimedAt: now, printerName: printer.name }, $inc: { attempts: 1 } },
            { sort: { queuedAt: 1 }, new: true },
        );
        if (!job) return res.status(204).end();

        const html = await renderJob(job, printer.paper);
        if (html) return res.json({ job: { _id: job._id, label: job.label, kind: job.kind }, html });

        job.status = 'cancelled';
        await job.save();
    }
    res.status(204).end();
}));

// POST /agent/jobs/:id/done
router.post('/agent/jobs/:id/done', requireAgent, handle(async (req, res) => {
    touchAgent();
    await PrintJob.updateOne(
        { _id: req.params.id, status: 'printing' },
        { $set: { status: 'done', printedAt: new Date(), error: null } },
    );
    res.json({ ok: true });
}));

// POST /agent/jobs/:id/fail { error } — повторяем с паузой, после MAX_ATTEMPTS — ошибка
router.post('/agent/jobs/:id/fail', requireAgent, handle(async (req, res) => {
    touchAgent();
    const job = await PrintJob.findOne({ _id: req.params.id, status: 'printing' });
    if (job) {
        job.error = String(req.body?.error || 'Ошибка печати').slice(0, 300);
        if (job.attempts >= MAX_ATTEMPTS) {
            job.status = 'error';
        } else {
            job.status = 'pending';
            job.nextTryAt = new Date(Date.now() + 10000 * job.attempts);
        }
        await job.save();
    }
    res.json({ ok: true });
}));

// ------------------------------------------------------------------ для страницы заказов

// GET /status — на связи ли принтеры и какие задания застряли
router.get('/status', handle(async (req, res) => {
    const since = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const problems = await PrintJob.find({
        updatedAt: { $gte: since },
        $or: [
            { status: { $in: ['error', 'expired'] } },
            { status: { $in: ['pending', 'printing'] }, queuedAt: { $lt: new Date(Date.now() - 60 * 1000) } },
        ],
    }).sort({ queuedAt: -1 }).limit(30).lean();

    const lastSeen = agentState.lastSeen;
    res.json({
        configured: Boolean(process.env.PRINT_AGENT_TOKEN),
        online: Boolean(lastSeen && Date.now() - lastSeen < AGENT_ONLINE_MS),
        lastSeen,
        printers: onlinePrinters().map(({ name, roles, paper }) => ({ name, roles, paper })),
        problems: problems.map(j => ({
            _id: j._id, label: j.label, status: j.status, error: j.error, attempts: j.attempts, queuedAt: j.queuedAt,
        })),
    });
}));

// POST /jobs/:id/retry — поставить задание в очередь заново
router.post('/jobs/:id/retry', handle(async (req, res) => {
    const now = new Date();
    const job = await PrintJob.findByIdAndUpdate(req.params.id, {
        $set: { status: 'pending', attempts: 0, queuedAt: now, nextTryAt: now, error: null },
    }, { new: true });
    if (!job) return res.status(404).json({ error: 'Задание не найдено' });
    res.json({ ok: true });
}));

// DELETE /jobs/:id — убрать задание из списка проблем
router.delete('/jobs/:id', handle(async (req, res) => {
    await PrintJob.updateOne({ _id: req.params.id }, { $set: { status: 'cancelled' } });
    res.json({ ok: true });
}));

module.exports = router;
