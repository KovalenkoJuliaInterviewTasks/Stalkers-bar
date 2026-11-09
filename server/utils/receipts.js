// HTML-шаблоны для термопринтера чеков (58 мм или 80 мм лента).
// Печать идёт из браузера: страница открывается с ?print=1 и сама вызывает
// window.print(). В диалоге печати нужно выбрать термопринтер и поля «Нет».

const fs = require('fs');
const path = require('path');

// Эмблема для шапки счёта: уменьшенная ч/б копия public/images/logo.png,
// встраивается в файл счёта, чтобы он открывался и печатался без внешних ссылок.
const LOGO_SRC = (() => {
    try {
        const file = fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo-receipt.png'));
        return `data:image/png;base64,${file.toString('base64')}`;
    } catch {
        return null; // нет файла — счёт печатается без эмблемы
    }
})();

const PAPER = {
    '58': { page: '58mm', body: '48mm', font: '12px' },
    '80': { page: '80mm', body: '72mm', font: '13px' },
};

const TEXT = {
    RU: {
        bill: 'Счёт', table: 'Стол', date: 'Дата', qty: 'Кол-во', total: 'Итого',
        thanks: 'Спасибо! Ждём вас снова', address: 'г. Беэр-Шева, ул. Бейт Эшель 17',
    },
    EN: {
        bill: 'Bill', table: 'Table', date: 'Date', qty: 'Qty', total: 'Total',
        thanks: 'Thank you! See you again', address: 'Beer-Sheva, Beit Eshel 17',
    },
    HE: {
        bill: 'חשבון', table: 'שולחן', date: 'תאריך', qty: 'כמות', total: 'סה"כ',
        thanks: 'תודה רבה! נשמח לראותכם שוב', address: 'באר שבע, רח\' בית אשל 17',
    },
};

const LOCALE = { RU: 'ru-RU', EN: 'en-GB', HE: 'he-IL' };
const STATION_TITLE = { kitchen: 'КУХНЯ', bar: 'БАР' };

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (date, lang) => new Date(date).toLocaleString(LOCALE[lang] || 'ru-RU', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const money = (n) => `${Math.round(n * 100) / 100} ₪`;

const lineTitle = (line, lang) => {
    const suffix = { RU: 'Ru', EN: 'En', HE: 'He' }[lang] || 'Ru';
    return line[`title${suffix}`] || line.titleRu || line.titleEn || line.titleHe || '';
};

const lineTotal = (line) => line.price * line.qty;
const tableTotal = (table) => table.items.reduce((sum, line) => sum + lineTotal(line), 0);

const page = ({ title, lang, paper, body }) => {
    const p = PAPER[paper] || PAPER['58'];
    const dir = lang === 'HE' ? 'rtl' : 'ltr';
    return `<!doctype html>
<html lang="${(lang || 'RU').toLowerCase()}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: ${p.page} auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: ${p.body}; margin: 0 auto; padding: 2mm 0 6mm;
         font: ${p.font}/1.3 Arial, "Helvetica Neue", sans-serif; }
  h1 { font-size: 1.35em; margin: 0 0 1mm; text-align: center; }
  .logo { display: block; width: 60%; height: auto; margin: 0 auto 1.5mm; }
  .center { text-align: center; }
  .nw { white-space: nowrap; }
  .muted { font-size: .9em; }
  .big { font-size: 1.6em; font-weight: bold; }
  hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: .6mm 0; }
  td.num { text-align: end; white-space: nowrap; padding-inline-start: 2mm; }
  .total td { font-weight: bold; font-size: 1.25em; padding-top: 1.5mm; }
  .note { font-size: .9em; font-style: italic; }
  @media screen { body { margin: 8px auto; box-shadow: 0 0 0 1px #ccc; padding: 3mm; } }
</style>
<script>
  if (new URLSearchParams(location.search).has('print')) {
    window.addEventListener('load', function () { window.print(); });
  }
</script>
</head>
<body>
${body}
</body>
</html>
`;
};

// Одинаковые позиции (то же название, вариант и цена) на счёте сливаются в одну строку.
const groupForBill = (items, lang) => {
    const groups = new Map();
    for (const line of items) {
        const title = lineTitle(line, lang);
        const key = `${title}\u0000${line.cap || ''}\u0000${line.price}`;
        const g = groups.get(key);
        if (g) g.qty += line.qty;
        else groups.set(key, { title, cap: line.cap || '', price: line.price, qty: line.qty });
    }
    return [...groups.values()];
};

const renderBill = (table, lang = 'RU', paper = '58') => {
    const t = TEXT[lang] || TEXT.RU;
    const rows = groupForBill(table.items, lang).map(g => `
<tr>
  <td><bdi>${escapeHtml(g.title)}</bdi>${g.cap ? ` <bdi class="muted nw">${escapeHtml(g.cap)}</bdi>` : ''}<br>
      <bdi class="muted">${g.qty} × ${money(g.price)}</bdi></td>
  <td class="num"><bdi>${money(g.qty * g.price)}</bdi></td>
</tr>`).join('');

    const body = `${LOGO_SRC ? `
<img class="logo" src="${LOGO_SRC}" alt="Stalkers Social Club">` : ''}
<h1>Stalkers Social Club</h1>
<div class="center muted">${escapeHtml(t.address)}<br>054-557-4713</div>
<hr>
<div class="center"><b>${escapeHtml(t.bill)}</b></div>
<div>${escapeHtml(t.table)}: <b><bdi>${escapeHtml(table.name)}</bdi></b></div>
<div class="muted">${escapeHtml(t.date)}: <bdi>${escapeHtml(formatDate(table.closedAt || new Date(), lang))}</bdi></div>
<hr>
<table>${rows}
  <tr><td colspan="2"><hr></td></tr>
  <tr class="total"><td>${escapeHtml(t.total)}</td><td class="num"><bdi>${money(tableTotal(table))}</bdi></td></tr>
</table>
<hr>
<div class="center">${escapeHtml(t.thanks)}</div>`;

    return page({ title: `${t.bill} — ${table.name}`, lang, paper, body });
};

// Тикеты на кухню/бар всегда на русском — это внутренний документ персонала.
const renderTicket = (table, ticket, paper = '58') => {
    const rows = ticket.items.map(i => `
<tr>
  <td><b>${escapeHtml(i.title)}</b>${i.cap ? ` <span class="nw">${escapeHtml(i.cap)}</span>` : ''}
      ${i.ice ? '<br>+ ЛЁД' : ''}
      ${i.comment ? `<br><span class="note">${escapeHtml(i.comment)}</span>` : ''}</td>
  <td class="num big">× ${i.qty}</td>
</tr>`).join('');

    const body = `
<div class="center big">${STATION_TITLE[ticket.station]}</div>
<div class="center">Заказ №${ticket.number}</div>
<hr>
<div class="big">Стол: ${escapeHtml(table.name)}</div>
<div class="muted">${escapeHtml(formatDate(ticket.createdAt || new Date(), 'RU'))}</div>
<hr>
<table>${rows}</table>
<hr>`;

    return page({ title: `${STATION_TITLE[ticket.station]} — ${table.name}`, lang: 'RU', paper, body });
};

module.exports = { renderBill, renderTicket, tableTotal, PAPER };
