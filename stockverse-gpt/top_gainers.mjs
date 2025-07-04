import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.POLYGON_API_KEY;

async function get_top_gainers() {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    try {
        // Fetch IPO data
        const response = await axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${apiKey}`);
        
        const topGainers = response.data;
        console.log(topGainers);

        if (!topGainers) {
            throw new Error('IPO data not available.');
        }

        // Return IPO details
        return { TOP_GAINERS: topGainers };
    } catch (error) {
        console.error('Error fetching IPO data:', error.message);
        return { error: `Failed to fetch IPO data: ${error.message}` };
    }
}

export default get_top_gainers;
