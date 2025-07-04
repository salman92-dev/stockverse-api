import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.POLYGON_API_KEY;

async function get_market_status() {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    try {
        // Fetch IPO data
        const response = await axios.get(`https://api.polygon.io/v1/marketstatus/now?apiKey=${apiKey}`);
        
        const ipoData = response.data;
        console.log(ipoData);

        if (!ipoData) {
            throw new Error('IPO data not available.');
        }

        // Return IPO details
        return { IPO_details: ipoData };
    } catch (error) {
        console.error('Error fetching IPO data:', error.message);
        return { error: `Failed to fetch IPO data: ${error.message}` };
    }
}

export default get_market_status;
