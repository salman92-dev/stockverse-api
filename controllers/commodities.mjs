import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const UPDATE_INTERVAL = 15 * 60 * 1000; // update every 15 minutes

// Fetch commodity data
async function magnificant7(symbol) {
  try {
    // Create promises for both the Global Quote and Overview data
    const globalQuotePromise = fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&entitlement=realtime&symbol=${symbol}&apikey=${API_KEY}`);
    const overviewPromise = fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`);

    // Wait for both promises to resolve
    const [globalQuoteResponse, overviewResponse] = await Promise.all([globalQuotePromise, overviewPromise]);

    // Handle errors if the requests fail
    if (!globalQuoteResponse.ok) {
      console.error(`Error fetching Global Quote data for ${symbol}: ${globalQuoteResponse.statusText}`);
      return null;
    }
    if (!overviewResponse.ok) {
      console.error(`Error fetching Overview data for ${symbol}: ${overviewResponse.statusText}`);
      return null;
    }

    // Parse the JSON data
    const globalQuoteData = await globalQuoteResponse.json();
    const overviewData = await overviewResponse.json();

    // Combine the Global Quote data and the entire Overview data into one object
    return {
      symbol,
      overview: overviewData,
      globalQuote: globalQuoteData['Global Quote'],
      
    };

  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

let allCommodityData = [];

async function update_m_seven_Data() {
  const commodities = ['aapl', 'msft', 'goog', 'amzn', 'nvda', 'tsla', 'meta']; // Stock symbols

  // Fetch all data concurrently
  const commodityPromises = commodities.map(symbol => magnificant7(symbol));
  const commodityDataArray = await Promise.all(commodityPromises);

  // Clear the array and update with new data
  allCommodityData = commodityDataArray.filter(data => data !== null);
}

// Initial fetch and periodic updates
update_m_seven_Data();
setInterval(update_m_seven_Data, UPDATE_INTERVAL);

// Controller functions
export async function getCommodities(req, res) {
  res.json(allCommodityData);
}
