const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const Table = require('../models/Table');
const MenuSection = require('../models/MenuSection');
const PrintJob = require('../models/PrintJob');
const { renderBill, renderTicket, tableTotal, PAPER } = require('../utils/receipts');
const { enqueueTicket, enqueueBill, paperForRole } = require('../utils/printQueue');

const BILLS_DIR = path.join(__dirname, '..', 'bills');
const LANGS = ['RU', 'EN', 'HE'];
const STATIONS = ['kitchen', 'bar'];
const STATION_BY_TYPE = { food: 'kitchen', dessert: 'kitchen', bar: 'bar' };

// Естественная сортировка: "1" < "1/1" < "2 терраса" < "10".
const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const sortTables = (tables) => tables.sort((a, b) => collator.compare(a.name, b.name));

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (err) {
        if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
        if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
            return res.status(400).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

const paperOf = (value, fallback = '58') => (PAPER[value] ? String(value) : fallback);
const billPath = (table) => path.join(BILLS_DIR, `${table._id}.html`);

const removeBillFile = async (table) => {
    try {
        await fs.unlink(billPath(table));
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
};

const writeBillFile = async (table) => {
    await fs.mkdir(BILLS_DIR, { recursive: true });
    await fs.writeFile(billPath(table), renderBill(table, table.lang, table.billPaper), 'utf8');
    return path.basename(billPath(table));
};

// Загрузить стол, изменить и сохранить. Схема с optimisticConcurrency: если
// параллельно кто-то сохранил тот же стол, повторяем изменение на свежей копии.
const mutate = async (id, fn, { requireOpen = true } = {}) => {
    for (let attempt = 0; attempt < 3; attempt++) {
        const table = await Table.findById(id);
        if (!table) throw new HttpError(404, 'Стол не найден');
        if (requireOpen && table.status !== 'open') throw new HttpError(409, 'Стол закрыт — сначала откройте его снова');
        const result = await fn(table);
        try {
            await table.save();
            return { table, result };
        } catch (err) {
            if (err instanceof mongoose.Error.VersionError) continue;
            throw err;
        }
    }
    throw new HttpError(409, 'Стол одновременно изменили с другого устройства — обновите страницу');
};

const parseQty = (value) => {
    const qty = Number(value);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new HttpError(400, 'Количество должно быть целым числом от 1');
    return qty;
};

const cleanText = (value, max = 300) => String(value ?? '').trim().slice(0, max);

const ensureUniqueName = async (name, exceptId) => {
    const existing = await Table.find({}, 'name');
    const clash = existing.find(t => String(t._id) !== String(exceptId) && collator.compare(t.name, name) === 0);
    if (clash) throw new HttpError(409, `Стол «${name}» уже есть`);
};

// ------------------------------------------------------------------ столы

// GET / — все столы, отсортированные по названию
router.get('/', handle(async (req, res) => {
    const tables = await Table.find().lean();
    res.json(sortTables(tables));
}));

// GET /tickets?station=kitchen|bar — невыполненные заказы для экрана кухни/бара
router.get('/tickets', handle(async (req, res) => {
    const { station } = req.query;
    if (!STATIONS.includes(station)) throw new HttpError(400, 'station должен быть kitchen или bar');
    const tables = await Table.find({ tickets: { $elemMatch: { station, done: false } } }, 'name tickets').lean();
    const tickets = tables.flatMap(t => t.tickets
        .filter(tk => tk.station === station && !tk.done)
        .map(tk => ({ ...tk, tableId: t._id, tableName: t.name })));
    tickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(tickets);
}));

// POST / — создать стол { name }
router.post('/', handle(async (req, res) => {
    const name = cleanText(req.body.name, 60);
    if (!name) throw new HttpError(400, 'Введите название стола');
    await ensureUniqueName(name);
    const table = await Table.create({ name });
    res.status(201).json(table);
}));

// GET /:id
router.get('/:id', handle(async (req, res) => {
    const table = await Table.findById(req.params.id);
    if (!table) throw new HttpError(404, 'Стол не найден');
    res.json(table);
}));

// PATCH /:id — переименовать стол / сменить язык счёта { name?, lang? }
router.patch('/:id', handle(async (req, res) => {
    const { name, lang } = req.body;
    const newName = name !== undefined ? cleanText(name, 60) : undefined;
    if (newName !== undefined) {
        if (!newName) throw new HttpError(400, 'Введите название стола');
        await ensureUniqueName(newName, req.params.id);
    }
    if (lang !== undefined && !LANGS.includes(lang)) throw new HttpError(400, 'Неизвестный язык');

    const { table } = await mutate(req.params.id, (t) => {
        if (newName !== undefined) t.name = newName;
        if (lang !== undefined) t.lang = lang;
    }, { requireOpen: false });

    // Если счёт уже выставлен — перевыпускаем файл с новым языком/названием.
    if (table.status === 'closed') await writeBillFile(table);
    res.json(table);
}));

// DELETE /:id — удалить стол (счёт оплачен) вместе с файлом счёта
router.delete('/:id', handle(async (req, res) => {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) throw new HttpError(404, 'Стол не найден');
    await removeBillFile(table);
    await PrintJob.deleteMany({ tableId: table._id });
    res.json({ success: true });
}));

// ------------------------------------------------------------------ позиции

// POST /:id/items — добавить позицию.
// Из меню: { menuItemId, variant: 1|2|3, qty, ice, comment }
// Не из меню: { custom: true, title, price, qty, comment } — всегда отправляется на бар
router.post('/:id/items', handle(async (req, res) => {
    const body = req.body;
    const qty = parseQty(body.qty ?? 1);
    let line;

    if (body.custom) {
        const title = cleanText(body.title, 100);
        const price = Number(body.price);
        if (!title) throw new HttpError(400, 'Введите название позиции');
        if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'Введите цену');
        line = {
            menuItemId: null, sectionType: 'custom',
            station: 'bar', // позиции не из меню всегда идут на бар
            titleRu: title, titleEn: title, titleHe: title,
            cap: '', price: Math.round(price * 100) / 100, qty,
            ice: false, comment: cleanText(body.comment),
        };
    } else {
        if (!mongoose.isValidObjectId(body.menuItemId)) throw new HttpError(400, 'Не выбрана позиция меню');
        // Цену берём из меню на сервере, а не из запроса.
        const section = await MenuSection.findOne({ 'items._id': body.menuItemId });
        const item = section?.items.id(body.menuItemId);
        if (!item) throw new HttpError(404, 'Позиция меню не найдена');
        const variant = [1, 2, 3].includes(Number(body.variant)) ? Number(body.variant) : 1;
        const price = item[`cost${variant}`];
        if (price === null || price === undefined) throw new HttpError(400, 'У позиции нет такого варианта');
        line = {
            menuItemId: item._id, sectionType: section.type, station: STATION_BY_TYPE[section.type],
            titleRu: item.titleRu, titleEn: item.titleEn, titleHe: item.titleHe,
            cap: item[`cap${variant}`] || '', price, qty,
            ice: section.type === 'bar' && Boolean(body.ice),
            comment: cleanText(body.comment),
        };
    }

    const { table } = await mutate(req.params.id, (t) => { t.items.push(line); });
    res.status(201).json(table);
}));

// PATCH /:id/items/:lineId — изменить { qty?, comment?, ice? }
router.patch('/:id/items/:lineId', handle(async (req, res) => {
    const { qty, comment, ice } = req.body;
    const { table } = await mutate(req.params.id, (t) => {
        const line = t.items.id(req.params.lineId);
        if (!line) throw new HttpError(404, 'Позиция не найдена');
        if (qty !== undefined) line.qty = parseQty(qty);
        if (comment !== undefined) line.comment = cleanText(comment);
        if (ice !== undefined) line.ice = line.sectionType === 'bar' && Boolean(ice);
    });
    res.json(table);
}));

// DELETE /:id/items/:lineId
router.delete('/:id/items/:lineId', handle(async (req, res) => {
    const { table } = await mutate(req.params.id, (t) => {
        const line = t.items.id(req.params.lineId);
        if (!line) throw new HttpError(404, 'Позиция не найдена');
        line.deleteOne();
    });
    res.json(table);
}));

// ------------------------------------------------------------------ кухня / бар

// POST /:id/send { station } — отправить ещё не отправленные позиции станции.
// Каждая отправка создаёт новый тикет, поэтому дозаказ — это новый заказ на кухню/бар.
router.post('/:id/send', handle(async (req, res) => {
    const { station } = req.body;
    if (!STATIONS.includes(station)) throw new HttpError(400, 'station должен быть kitchen или bar');

    const { table, result: ticketId } = await mutate(req.params.id, (t) => {
        const lines = t.items.filter(l => l.station === station && l.qty > l.sentQty);
        if (!lines.length) throw new HttpError(400, 'Нет новых позиций для отправки');
        const number = t.tickets.filter(tk => tk.station === station).length + 1;
        t.tickets.push({
            station, number,
            items: lines.map(l => ({
                title: l.titleRu || l.titleEn || l.titleHe,
                cap: l.cap, qty: l.qty - l.sentQty, ice: l.ice, comment: l.comment,
            })),
        });
        lines.forEach(l => { l.sentQty = l.qty; });
        return t.tickets[t.tickets.length - 1]._id;
    }, { requireOpen: false });

    // Задание для принтера кухни/бара — его заберёт программа-посредник
    await enqueueTicket(table, table.tickets.id(ticketId));
    res.status(201).json({ table, ticketId });
}));

// GET /:id/tickets/:ticketId?paper=58|80&print=1 — тикет для печати
router.get('/:id/tickets/:ticketId', handle(async (req, res) => {
    const table = await Table.findById(req.params.id);
    const ticket = table?.tickets.id(req.params.ticketId);
    if (!ticket) throw new HttpError(404, 'Заказ не найден');
    res.type('html').send(renderTicket(table, ticket, paperOf(req.query.paper, paperForRole(ticket.station))));
}));

// POST /:id/tickets/:ticketId/print — напечатать заказ ещё раз на принтере станции
router.post('/:id/tickets/:ticketId/print', handle(async (req, res) => {
    const table = await Table.findById(req.params.id);
    const ticket = table?.tickets.id(req.params.ticketId);
    if (!ticket) throw new HttpError(404, 'Заказ не найден');
    await enqueueTicket(table, ticket);
    res.status(201).json({ ok: true });
}));

// PATCH /:id/tickets/:ticketId { done } — отметить заказ выполненным
router.patch('/:id/tickets/:ticketId', handle(async (req, res) => {
    const { table } = await mutate(req.params.id, (t) => {
        const ticket = t.tickets.id(req.params.ticketId);
        if (!ticket) throw new HttpError(404, 'Заказ не найден');
        ticket.done = req.body.done !== false;
    }, { requireOpen: false });
    res.json(table);
}));

// ------------------------------------------------------------------ счёт

// POST /:id/close { lang?, paper? } — закрыть стол: посчитать сумму и сформировать файл счёта.
// Повторный вызов перевыпускает счёт (например, на другом языке).
router.post('/:id/close', handle(async (req, res) => {
    const { lang, paper } = req.body;
    if (lang !== undefined && !LANGS.includes(lang)) throw new HttpError(400, 'Неизвестный язык');

    const { table } = await mutate(req.params.id, (t) => {
        if (!t.items.length) throw new HttpError(400, 'В заказе нет позиций');
        if (lang) t.lang = lang;
        t.billPaper = paperOf(paper, paperForRole('bills'));
        if (t.status !== 'closed') t.closedAt = new Date();
        t.status = 'closed';
        t.total = tableTotal(t);
        t.billFile = `${t._id}.html`;
    }, { requireOpen: false });

    await writeBillFile(table);
    await PrintJob.updateMany(
        { tableId: table._id, kind: 'bill', status: { $in: ['pending', 'error'] } },
        { $set: { status: 'cancelled' } },
    );
    await enqueueBill(table);
    res.json(table);
}));

// POST /:id/bill/print — напечатать счёт ещё раз на принтере счетов
router.post('/:id/bill/print', handle(async (req, res) => {
    const table = await Table.findById(req.params.id);
    if (!table) throw new HttpError(404, 'Стол не найден');
    if (table.status !== 'closed') throw new HttpError(409, 'Счёт ещё не выставлен');
    await enqueueBill(table);
    res.status(201).json({ ok: true });
}));

// POST /:id/reopen — снова открыть стол для правок; файл счёта удаляется
router.post('/:id/reopen', handle(async (req, res) => {
    const { table } = await mutate(req.params.id, (t) => {
        t.status = 'open';
        t.closedAt = undefined;
        t.billFile = null;
    }, { requireOpen: false });
    await removeBillFile(table);
    await PrintJob.updateMany(
        { tableId: table._id, kind: 'bill', status: { $in: ['pending', 'error'] } },
        { $set: { status: 'cancelled' } },
    );
    res.json(table);
}));

// GET /:id/bill?print=1 — файл счёта. Если файла нет на диске (например, после
// перезапуска сервера на хостинге без постоянного диска) — создаётся заново.
router.get('/:id/bill', handle(async (req, res) => {
    const table = await Table.findById(req.params.id);
    if (!table) throw new HttpError(404, 'Стол не найден');
    if (table.status !== 'closed') throw new HttpError(409, 'Счёт ещё не выставлен');
    try {
        await fs.access(billPath(table));
    } catch {
        await writeBillFile(table);
    }
    res.sendFile(billPath(table), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}));

module.exports = router;
