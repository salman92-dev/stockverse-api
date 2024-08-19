import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { getCommodities } from './controllers/commodities.mjs';
import { getGainers, getLosers, getActiveStocks } from './controllers/gainers_losers.mjs';
import { symbol_search } from './controllers/symbol-search.mjs';
import { searchTickers } from './controllers/ticker_search.mjs';
import os from 'os';

dotenv.config();

const app = express();

// Middleware (if needed)
app.use(express.json());


app.get('/', (req, res) => {
    res.send('<h1>This is the homepage</h1>');
});

app.get('/active-stocks',getActiveStocks);
app.get('/gainer-stocks',getGainers);
app.get('/loser-stocks',getLosers);
app.get('/top7',getCommodities)
app.get('/search', searchTickers);
app.get('/symb-search', symbol_search);
const PORT = process.env.PORT || 4848;
app.listen(PORT, () => {
    const localUrl = `http://localhost:${PORT}`;
    const localNetworkUrl = `http://${getLocalIPAddress()}:${PORT}`;
    console.log(`Server is running on:`);
    console.log(`- Local: ${localUrl}`);
    console.log(`- Local Network: ${localNetworkUrl}`);
});


function getLocalIPAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (let iface in networkInterfaces) {
        for (let alias of networkInterfaces[iface]) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost if no IP is found
}