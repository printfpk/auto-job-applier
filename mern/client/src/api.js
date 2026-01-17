const API_URL = 'http://localhost:5000/api';

export const getSettings = async () => {
    const res = await fetch(`${API_URL}/settings`);
    return await res.json();
};

export const updateSettings = async (settings) => {
    const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    return await res.json();
};

export const startBot = async () => {
    const res = await fetch(`${API_URL}/bot/start`, { method: 'POST' });
    return await res.json();
};

export const stopBot = async () => {
    const res = await fetch(`${API_URL}/bot/stop`, { method: 'POST' });
    return await res.json();
};
