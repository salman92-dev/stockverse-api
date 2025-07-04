import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.POLYGON_API_KEY;

async function get_historical_data(symbols, dates) {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
        throw new Error('Symbols must be a non-empty array.');
    }

    try {
        const promises = symbols.map((symbol, index) => {
            const date = dates[index];
            if (!date) {
                throw new Error(`No corresponding date for symbol: ${symbol}`);
            }
            return axios.get(`https://api.polygon.io/v1/open-close/${symbol.toUpperCase()}/${date}?adjusted=true&apiKey=${apiKey}`)
                .then(response => {
                    const details = response.data;
                    if (!details) {
                        throw new Error(`Data not available for ${symbol}`);
                    }
                    return { Stock_Historical_details: details };
                })
                .catch(error => {
                    console.error(`Error fetching data for ${symbol}:`, error.message);
                    return {
                        symbol: symbol.toLowerCase(),
                        error: `Failed to fetch data for ${symbol}: ${error.message}`,
                    };
                });
        });

        const results = await Promise.all(promises);
        console.log(results);
        return results;
    } catch (error) {
        console.error('Error fetching stock data:', error.message || error);
        throw new Error('Failed to fetch stock data.');
    }
}

export default get_historical_data;