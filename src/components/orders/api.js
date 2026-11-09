const API_URL = process.env.REACT_APP_API_URL || '';
const BASE = `${API_URL}/api/orders`;

const request = async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
    return data;
};

export const ordersApi = {
    list: () => request(''),
    get: (id) => request(`/${id}`),
    create: (name) => request('', { method: 'POST', body: { name } }),
    update: (id, patch) => request(`/${id}`, { method: 'PATCH', body: patch }),
    remove: (id) => request(`/${id}`, { method: 'DELETE' }),
    addItem: (id, item) => request(`/${id}/items`, { method: 'POST', body: item }),
    updateItem: (id, lineId, patch) => request(`/${id}/items/${lineId}`, { method: 'PATCH', body: patch }),
    removeItem: (id, lineId) => request(`/${id}/items/${lineId}`, { method: 'DELETE' }),
    send: (id, station) => request(`/${id}/send`, { method: 'POST', body: { station } }),
    tickets: (station) => request(`/tickets?station=${station}`),
    setTicketDone: (id, ticketId, done = true) =>
        request(`/${id}/tickets/${ticketId}`, { method: 'PATCH', body: { done } }),
    close: (id, lang) => request(`/${id}/close`, { method: 'POST', body: { lang } }),
    // Напечатать ещё раз — задание уходит на принтер через программу-посредник
    printTicket: (id, ticketId) => request(`/${id}/tickets/${ticketId}/print`, { method: 'POST' }),
    printBill: (id) => request(`/${id}/bill/print`, { method: 'POST' }),
    reopen: (id) => request(`/${id}/reopen`, { method: 'POST' }),
};

export const billUrl = (id) => `${BASE}/${id}/bill?print=1`;
export const ticketUrl = (id, ticketId) => `${BASE}/${id}/tickets/${ticketId}?print=1`;

const PRINT_BASE = `${API_URL}/api/print`;
const printRequest = async (path, method = 'GET') => {
    const res = await fetch(`${PRINT_BASE}${path}`, { method });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
    return data;
};

export const printApi = {
    status: () => printRequest('/status'),
    retry: (jobId) => printRequest(`/jobs/${jobId}/retry`, 'POST'),
    dismiss: (jobId) => printRequest(`/jobs/${jobId}`, 'DELETE'),
};

export const fetchMenu = async () => {
    const types = ['bar', 'food', 'dessert'];
    const results = await Promise.all(types.map(type =>
        fetch(`${API_URL}/api/menu/${type}`).then(r => {
            if (!r.ok) throw new Error('Не удалось загрузить меню');
            return r.json();
        })));
    return Object.fromEntries(types.map((type, i) => [type, results[i]]));
};

// Открыть страницу печати. Вызывать прямо из обработчика клика, иначе
// браузер может заблокировать новое окно.
export const openPrint = (url) => window.open(url, '_blank');

export const lineTotal = (line) => line.price * line.qty;
export const tableTotal = (table) => (table.items || []).reduce((s, l) => s + lineTotal(l), 0);
export const money = (n) => `${Math.round(n * 100) / 100} ₪`;

// Сколько штук ещё не отправлено на станцию
export const pendingCount = (table, station) => (table.items || [])
    .filter(l => l.station === station)
    .reduce((s, l) => s + Math.max(0, l.qty - l.sentQty), 0);
