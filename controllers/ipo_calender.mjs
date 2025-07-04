import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync'; // Import the csv-parse library

dotenv.config();
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function fetchIPOCalendar() {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=IPO_CALENDAR&time_to=20300410T0130&apikey=${API_KEY}`);
    
    const responseBody = await response.text(); // Read the response as text

    console.log('Response Body:', responseBody); // Log the response for debugging

    // Parse the CSV data
    const records = parse(responseBody, {
      columns: true,    // Treat the first line as headers
      skip_empty_lines: true, // Skip any empty lines
    });

    return records; // Return the parsed CSV data as an array of objects
    
  } catch (error) {
    console.error(`Error fetching IPO Calendar data:`, error);
    return { error: 'Failed to fetch IPO Calendar data' };
  }
}

async function getIPOCalendar(req, res) {
  const ipoData = await fetchIPOCalendar();
  if (ipoData && !ipoData.error) {
    res.json(ipoData);
  } else {
    res.status(500).json({ error: ipoData.error || 'Failed to fetch IPO Calendar data' });
  }
}
export default getIPOCalendar;