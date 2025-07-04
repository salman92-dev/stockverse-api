import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function symbol_search(req, res) {
    const { symbol } = req.query;
    const entitlement = req.body;

    if (!symbol) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        // Execute both fetch requests concurrently
        const [quoteResponse, overviewResponse] = await Promise.all([
            await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&entitlement=${entitlement ? 'realtime' : 'delayed'}&apikey=${API_KEY}`
            ),
            await fetch(
                `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&entitlement=${entitlement ? 'realtime' : 'delayed'}&apikey=${API_KEY}`
            )
        ]);

        if (!quoteResponse.ok) {
            throw new Error(`Error fetching global quote: ${quoteResponse.status}`);
        }

        if (!overviewResponse.ok) {
            throw new Error(`Error fetching symbol overview: ${overviewResponse.status}`);
        }

        const [quoteData, overviewData] = await Promise.all([
            quoteResponse.json(),
            overviewResponse.json()
        ]);

        // Combine both responses into a single object
        const combinedData = {
            quote: quoteData,
            overview: overviewData
        };

        // Send the combined data back as the response
        res.json(combinedData);
    } catch (error) {
        console.error('Failed to fetch the data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage' });
    }
}
