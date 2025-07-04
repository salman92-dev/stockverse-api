import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function company_overview(req, res) {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Split the symbols into an array
    const symbols = symbol.split(',');

    try {
        // Fetch the overview data for all symbols concurrently
        const overviewPromises = symbols.map(sym =>
            fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${sym.trim()}&apikey=${API_KEY}`)
        );

        // Wait for all fetches to complete
        const overviewResponses = await Promise.all(overviewPromises);

        // Check for any fetch errors
        const failedResponses = overviewResponses.filter(response => !response.ok);
        if (failedResponses.length) {
            throw new Error(`Error fetching symbol overviews: ${failedResponses.map(resp => resp.status).join(', ')}`);
        }

        // Parse all the responses to JSON
        const overviewData = await Promise.all(overviewResponses.map(response => response.json()));

        // Send the array of overview data as the response
        res.json(overviewData);
    } catch (error) {
        console.error('Failed to fetch the data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage' });
    }
}