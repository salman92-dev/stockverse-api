import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function get_stock_news(req, res) {
    const { tickers = '', topics = [], limit = '', sort = '' } = req.query;

    let url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${API_KEY}`;
    
    if (tickers) {
        url += `&tickers=${tickers}`;
    }

    if (topics) {
        url += `&topics=${topics}`;
    }

    if (sort) {
        url += `&sort=${sort}`;
    }
    
    if(limit){
        url += `&limit=${limit}`
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).json({ error: 'Failed fetching data' });
    }
}
