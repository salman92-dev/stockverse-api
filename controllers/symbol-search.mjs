import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;


export async function symbol_search(req,res){
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

   try {
    const response =await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&entitlement=realtime&symbol=${symbol}&apikey=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    res.json(data);
   } catch (error) {
    console.error('Failed to fetch the data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage' });
   }
}