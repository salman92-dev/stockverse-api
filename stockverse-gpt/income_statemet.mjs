import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

async function get_income_statement(symbols) {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
        throw new Error('Symbols must be a non-empty array.');
    }

    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const symbolData = await axios.get(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol.toUpperCase()}&apikey=${apiKey}`);

                const data = symbolData.data;

                if (!data) {
                    throw new Error(`Income Statement data not available for ${symbol}`);
                }

                return {
                    Stock_Income_Statement: data,
                };
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
                return {
                    symbol: symbol.toLowerCase(),
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

export default get_income_statement;
