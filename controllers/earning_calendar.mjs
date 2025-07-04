import fetch from 'node-fetch';
import dotenv from 'dotenv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

dotenv.config();

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY; // Use 'demo' for public API key or your environment variable

// Function to fetch earnings data in CSV format
async function fetchEarningsData(req, res) {
  const { symbol, horizon } = req.query;

  // Check if required query parameters are provided
  if (!symbol || !horizon) {
    return res.status(400).json({ message: 'Both symbol and horizon query parameters are required' });
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&symbol=${symbol}&horizon=${horizon}&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch earnings data from Alpha Vantage');
    }

    // Convert the response to text (CSV data)
    const csvData = await response.text();

    // Convert CSV data into a stream
    const stream = Readable.from(csvData);

    const results = [];

    // Parse the CSV data using csv-parser
    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          res.status(200).json(results); // Send parsed results to the client
          resolve();
        })
        .on('error', (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        });
    });

  } catch (error) {
    console.error(`Error fetching earnings data: ${error.message}`);
    res.status(500).json({ error: `Error fetching earnings data: ${error.message}` });
  }
}

export default fetchEarningsData;
