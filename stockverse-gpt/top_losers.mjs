import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.POLYGON_API_KEY;

async function get_top_losers() {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    try {
        // Fetch IPO data
        const response = await axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${apiKey}`);
        
        const topLosers = response.data;
        console.log(topLosers);

        if (!topLosers) {
            throw new Error('IPO data not available.');
        }

        // Return IPO details
        return { TOP_LOSERS: topLosers };
    } catch (error) {
        console.error('Error fetching IPO data:', error.message);
        return { error: `Failed to fetch IPO data: ${error.message}` };
    }
}

export default get_top_losers;
