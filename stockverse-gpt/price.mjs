import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

async function get_stock_price(symbols) {
    if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
    }

    if (!Array.isArray(symbols) || symbols.length === 0) {
        throw new Error('Symbols must be a non-empty array.');
    }

    try {
        const promises = symbols.map(async (symbol) => {
            try {
                const globalQuoteResponse = await axios.get('https://www.alphavantage.co/query', {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol,
                        entitlement: 'realtime',
                        apikey: apiKey,
                    },
                });

                const globalQuote = globalQuoteResponse.data['Global Quote'];

                if (!globalQuote) {
                    throw new Error(`Global Quote data not available for ${symbol}`);
                }

                return {
                    // symbol: symbol.toLowerCase(),
                    Stock_Price_details: {
                        '01. symbol': globalQuote['01. symbol'] || 'N/A',
                        '02. open': globalQuote['02. open'] || 'N/A',
                        '03. high': globalQuote['03. high'] || 'N/A',
                        '04. low': globalQuote['04. low'] || 'N/A',
                        '05. price': globalQuote['05. price'] || 'N/A',
                        '06. volume': globalQuote['06. volume'] || 'N/A',
                        '07. latest trading day': globalQuote['07. latest trading day'] || 'N/A',
                        '08. previous close': globalQuote['08. previous close'] || 'N/A',
                        '09. change': globalQuote['09. change'] || 'N/A',
                        '10. change percent': globalQuote['10. change percent'] || 'N/A',
                    },
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

export default get_stock_price;
