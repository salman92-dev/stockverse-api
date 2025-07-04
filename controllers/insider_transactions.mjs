import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const apikey = process.env.ALPHA_VANTAGE_API_KEY;

async function insider_transactions(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({
      message: 'Query parameter "symbol" is required'
    });
  }

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol=${symbol}&apikey=${apikey}`);
    
    if (!response.ok) {
      // Extract and log the error message from the response if possible
      const errorData = await response.json();
      throw new Error(errorData.Error_Message || 'Failed to fetch insider transactions from Alpha Vantage');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    res.status(500).json({ error: `Failed fetching data: ${error.message}` });
  }
}

export default insider_transactions;
