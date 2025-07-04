import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.POLYGON_API_KEY;

async function get_related_companies(symbols) {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
        throw new Error('Symbols must be a non-empty array.');
    }

    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const companyDetails = await axios.get(`https://api.polygon.io/v1/related-companies/${symbol.toUpperCase()}?apiKey=${apiKey}`);

                const details = companyDetails.data;

                if (!details) {
                    throw new Error(`Global Quote data not available for ${symbol}`);
                }

                return {
                    symbol: `${symbol} Details`,
                    Stock_News_details: details,
                };
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
                return {
                    symbol: symbol,
                    error: `Failed to fetch data for ${symbol}: ${error.message}`,
                };
            }
        });

        const results = await Promise.all(promises);
        console.log(results);
        return results;
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw new Error('Failed to fetch data from Alpha Vantage');
    }
}

export default get_related_companies;
