import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function searchTickers(req, res) {
    const { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const response = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch the data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage' });
    }
}
