import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const API_KEY =  process.env.ALPHA_VANTAGE_API_KEY;
const UPDATE_INTERVAL = 0.25 * 60 * 1000; //update after every 15 seconds

// Fetch commodity data

async function magnificant7(symbol) {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
    if (!response.ok) {
      console.error(`Error fetching data for ${symbol}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

let allCommodityData = {};

async function updateCommodityData() {
  const commodities = ['AAPL', 'MSFT', 'GOOG', 'AMZN','NVDA','TSLA','META']; // Add more stocks symbols as needed

  // Fetch all data concurrently
  const commodityPromises = commodities.map(symbol => magnificant7(symbol));
  const commodityDataArray = await Promise.all(commodityPromises);

  // Update the commodity data
  commodityDataArray.forEach((data, index) => {
    if (data) {
      allCommodityData[commodities[index]] = data;
    }
  });

  console.log('Commodity data updated');
}

// Initial fetch and periodic updates
updateCommodityData();
setInterval(updateCommodityData, UPDATE_INTERVAL);

// Controller functions
export async function getCommodities(req, res) {
  res.json(allCommodityData);
}
