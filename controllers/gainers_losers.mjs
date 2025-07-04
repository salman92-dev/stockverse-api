import fetch from 'node-fetch';
import dotenv from 'dotenv';



dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

let gainer_stocks = []; // top stocks
let loser_stocks = []; // loser stocks
let active_stocks = []; // active stocks

const api_url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&entitlement=realtime&apikey=${API_KEY}`;

async function fetchGainerLoserData() {
    try {
        const response = await fetch(api_url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        if (data.top_gainers && data.top_losers && data.most_actively_traded) {
            gainer_stocks = data.top_gainers.filter(gainer => !gainer.ticker.endsWith('W'));
            loser_stocks = data.top_losers.filter(loser => !loser.ticker.endsWith('W'));
            active_stocks = data.most_actively_traded;
        }
    } catch (error) {
        console.error('Failed to fetch the data:', error.message);
    }
}

// Automatically fetch data every 15 minutes
setInterval(fetchGainerLoserData, 15*60*1000);

// Initial fetch to ensure data is available immediately
fetchGainerLoserData();

// Separate endpoint handlers
export function getGainers(req, res) {
    res.json(gainer_stocks);
}

export function getLosers(req, res) {
    res.json(loser_stocks);
}

export function getActiveStocks(req, res) {
    res.json(active_stocks);
}
