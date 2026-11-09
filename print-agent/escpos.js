// Перевод картинки чека в команды ESC/POS для термопринтера.
// Печатаем растром (GS v 0), поэтому принтеру не нужны кириллица и иврит
// в его кодовых страницах: всё уже нарисовано браузером.
const { PNG } = require('pngjs');

const ESC = 0x1b;
const GS = 0x1d;

// Ширина печати в точках при 203 dpi
const PAPER_DOTS = { '58': 384, '80': 576 };

const THRESHOLD = 160; // светлее — белое; чуть выше середины, чтобы тонкий текст не пропадал
const CHUNK_ROWS = 128; // растр отправляем полосами — у дешёвых принтеров маленький буфер

// PNG -> монохромные строки ровно нужной ширины (лишнее обрезается, недостающее — белое)
const pngToMono = (pngBuffer, dots) => {
    const png = PNG.sync.read(pngBuffer);
    const bytesPerRow = dots / 8;
    const bits = Buffer.alloc(bytesPerRow * png.height);
    const offsetX = Math.max(0, Math.floor((png.width - dots) / 2));

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < dots; x++) {
            const sx = x + offsetX;
            if (sx >= png.width) continue;
            const i = (y * png.width + sx) * 4;
            const a = png.data[i + 3] / 255;
            // прозрачное — на белом фоне
            const lum = (0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2]) * a + 255 * (1 - a);
            if (lum < THRESHOLD) bits[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
        }
    }
    return { bits, width: dots, height: png.height, bytesPerRow };
};

const buildJob = (pngBuffer, { paper = '58', cut = true, feedLines = 4 } = {}) => {
    const dots = PAPER_DOTS[paper] || PAPER_DOTS['58'];
    const { bits, height, bytesPerRow } = pngToMono(pngBuffer, dots);
    const parts = [Buffer.from([ESC, 0x40])]; // инициализация

    for (let y = 0; y < height; y += CHUNK_ROWS) {
        const rows = Math.min(CHUNK_ROWS, height - y);
        parts.push(Buffer.from([GS, 0x76, 0x30, 0x00,
            bytesPerRow & 0xff, bytesPerRow >> 8, rows & 0xff, rows >> 8]));
        parts.push(bits.subarray(y * bytesPerRow, (y + rows) * bytesPerRow));
    }

    parts.push(Buffer.from([ESC, 0x64, feedLines])); // прогон бумаги, чтобы чек вышел из-под ножа
    if (cut) parts.push(Buffer.from([GS, 0x56, 0x42, 0x00])); // отрезка (без ножа принтер просто проигнорирует)
    return Buffer.concat(parts);
};

module.exports = { buildJob, pngToMono, PAPER_DOTS };
