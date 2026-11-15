const PrintJob = require('../models/PrintJob');

const STATION_LABEL = { kitchen: 'Кухня', bar: 'Бар' };

// What we know about the print-agent. Kept in memory: the agent polls the
// server every few seconds, so the state is restored almost immediately
// after a server restart.
const agentState = {
    lastSeen: null,
    printers: new Map(), // name -> { name, roles, paper, lastSeen }
};

const AGENT_ONLINE_MS = 20 * 1000;

const touchAgent = (printer) => {
    const now = new Date();
    agentState.lastSeen = now;
    if (printer?.name) {
        agentState.printers.set(printer.name, {
            name: printer.name,
            roles: Array.isArray(printer.roles) ? printer.roles : [],
            paper: printer.paper === '80' ? '80' : '58',
            lastSeen: now,
        });
    }
};

const onlinePrinters = () => [...agentState.printers.values()]
    .filter(p => Date.now() - p.lastSeen < AGENT_ONLINE_MS);

// Paper width of the printer serving this role (as reported by the agent); 58 mm otherwise.
const paperForRole = (role) => {
    const p = [...agentState.printers.values()].find(pr => pr.roles.includes(role));
    return p?.paper || '58';
};

const enqueueTicket = (table, ticket) => PrintJob.create({
    role: ticket.station,
    kind: 'ticket',
    tableId: table._id,
    ticketId: ticket._id,
    label: `${ticket.cancel ? 'ОТМЕНА — ' : ''}${STATION_LABEL[ticket.station]} №${ticket.number} — стол ${table.name}`,
});

const enqueueBill = (table) => PrintJob.create({
    role: 'bills',
    kind: 'bill',
    tableId: table._id,
    label: `Счёт — стол ${table.name}`,
});

module.exports = {
    agentState, touchAgent, onlinePrinters, paperForRole, enqueueTicket, enqueueBill, AGENT_ONLINE_MS,
};
