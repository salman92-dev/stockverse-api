import fetch from 'node-fetch';
import dotenv from 'dotenv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
dotenv.config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

let cachedData = null;  // Store cached data
let lastFetchTime = null;  // Store last fetch timestamp
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to fetch stock listings from Alpha Vantage
async function fetchStockListings() {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=LISTING_STATUS&state=delisted&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`
    );

    const csvData = await response.text();
    const stream = Readable.from(csvData);

    const results = [];

    return new Promise((resolve, reject) => {
      stream.pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

  } catch (error) {
    throw new Error('Error fetching CSV data from Alpha Vantage');
  }
}

// Route to get active stock listings, with 24-hour cache
async function delisting_stocks(req, res) {
  try {
    const now = Date.now();

    // Check if cached data is available and valid (within 24 hours)
    if (cachedData && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('Returning cached data');
      return res.json(cachedData);  // Return cached data if valid
    }

    // If no cached data or data is expired, fetch new data
    console.log('Fetching new data from Alpha Vantage');
    const newData = await fetchStockListings();

    // Cache the new data and update the last fetch time
    cachedData = newData;
    lastFetchTime = now;

    res.json(cachedData);  // Return the new data

  } catch (error) {
    console.error('Error in active_listing route:', error);
    res.status(500).json({ error: 'Failed to retrieve active stock listings' });
  }
}

export default delisting_stocks;
