import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

async function getAlphaVantageData(req, res) {
    const { symbols } = req.query;

    if (!symbols) {
        return res.status(400).json({ error: 'Symbols query parameter is required' });
    }

    const symbolsArray = symbols.split(',');

    try {
        const promises = symbolsArray.map(async (symbol) => {
            try {
                // Fetch overview and global quote data for each symbol
                const [overviewResponse, globalQuoteResponse] = await Promise.all([
                    axios.get('https://www.alphavantage.co/query', {
                        params: {
                            function: 'OVERVIEW',
                            symbol: symbol,
                            apikey: apiKey
                        }
                    }),
                    axios.get('https://www.alphavantage.co/query', {
                        params: {
                            function: 'GLOBAL_QUOTE',
                            symbol: symbol,
                            entitlement :'realtime',
                            apikey: apiKey
                        }
                    })
                ]);

                // Check if overview data exists, if not provide a fallback value
                const overview = Object.keys(overviewResponse.data).length > 0
                    ? overviewResponse.data
                    : {
                        "Symbol": `${symbol}`,
                        "AssetType": "Undefined",
                        "Name": "Undefined",
                        "Description": "Undefined",
                        "CIK": "Undefined",
                        "Exchange": "NASDAQ",
                        "Currency": "USD",
                        "Country": "USA",
                        "Sector": "Undefined",
                        "Industry": "Undefined",
                        "Address": "Undefined",
                        "OfficialSite": `https://www.${symbol}.com`,
                        "FiscalYearEnd": "Undefined",
                        "LatestQuarter": "Undefined",
                        "MarketCapitalization": "Undefined",
                        "EBITDA": "Undefined",
                        "PERatio": "Undefined",
                        "PEGRatio": "Undefined",
                        "BookValue": "Undefined",
                        "DividendPerShare": "Undefined",
                        "DividendYield": "Undefined",
                        "EPS": "Undefined",
                        "RevenuePerShareTTM": "Undefined",
                        "ProfitMargin": "Undefined",
                        "OperatingMarginTTM": "Undefined",
                        "ReturnOnAssetsTTM": "Undefined",
                        "ReturnOnEquityTTM": "Undefined",
                        "RevenueTTM": "Undefined",
                        "GrossProfitTTM": "Undefined",
                        "DilutedEPSTTM": "Undefined",
                        "QuarterlyEarningsGrowthYOY": "Undefined",
                        "QuarterlyRevenueGrowthYOY": "Undefined",
                        "AnalystTargetPrice": "Undefined",
                        "AnalystRatingStrongBuy": "Undefined",
                        "AnalystRatingBuy": "Undefined",
                        "AnalystRatingHold": "Undefined",
                        "AnalystRatingSell": "Undefined",
                        "AnalystRatingStrongSell": "Undefined",
                        "TrailingPE": "Undefined",
                        "ForwardPE": "Undefined",
                        "PriceToSalesRatioTTM": "Undefined",
                        "PriceToBookRatio": "Undefined",
                        "EVToRevenue": "Undefined",
                        "EVToEBITDA": "Undefined",
                        "Beta": "Undefined",
                        "52WeekHigh": "Undefined",
                        "52WeekLow": "Undefined",
                        "50DayMovingAverage": "Undefined",
                        "200DayMovingAverage": "Undefined",
                        "SharesOutstanding": "Undefined",
                        "DividendDate": "Undefined",
                        "ExDividendDate": "Undefined"

                    };

                // Check if global quote data is available
                const globalQuote = globalQuoteResponse.data['Global Quote'];

                if (!globalQuote) {
                    throw new Error(`Global Quote data not available for ${symbol}`);
                }

                // Return the formatted result
                return {
                    symbol: symbol.toLowerCase(), // Format symbol as lowercase
                    overview: overview,
                    globalQuote: {
                        '01. symbol': globalQuote['01. symbol'],
                        '02. open': globalQuote['02. open'],
                        '03. high': globalQuote['03. high'],
                        '04. low': globalQuote['04. low'],
                        '05. price': globalQuote['05. price'],
                        '06. volume': globalQuote['06. volume'],
                        '07. latest trading day': globalQuote['07. latest trading day'],
                        '08. previous close': globalQuote['08. previous close'],
                        '09. change': globalQuote['09. change'],
                        '10. change percent': globalQuote['10. change percent'],
                    }
                };
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error.message);
                return {
                    symbol: symbol.toLowerCase(),
                    error: `Failed to fetch data for ${symbol}: ${error.message}`
                };
            }
        });

        const results = await Promise.all(promises);

        // Send the results back as a response
        res.json(results);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ error: 'Failed to fetch data from Alpha Vantage' });
    }
}

export default getAlphaVantageData;
