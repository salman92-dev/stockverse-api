import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

let gainer_stocks = []; // top stocks
let loser_stocks = []; // loser stocks
let active_stocks = []; // active stocks

const new_data_url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&entitlement=realtime&apikey=${API_KEY}`;
const delayed_data_url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;



async function fetchGainerLoserData() {
    let isSignedIn = false;
    try {
        const response = await fetch(!isSignedIn ? delayed_data_url : new_data_url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();

        if (data.top_gainers && data.top_losers && data.most_actively_traded) {
            gainer_stocks = data.top_gainers;
            loser_stocks = data.top_losers;
            active_stocks = data.most_actively_traded;
        }
    } catch (error) {
        console.error('Failed to fetch the data:', error.message);
    }
}

// Automatically fetch data every 10 seconds
setInterval(fetchGainerLoserData, 10000);

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
