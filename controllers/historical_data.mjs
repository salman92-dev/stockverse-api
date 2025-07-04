import fetch from "node-fetch";
import dotenv from 'dotenv';
dotenv.config();

const apikey = process.env.ALPHA_VANTAGE_API_KEY;


async function historical_data(req,res){


    const {symbol} = req.query;
    const {filter} = req.query;
    const {interval} = req.query;
    if(!symbol){
      return res.status(400).json({message: 'query parameter is required'})
    }
    if(!filter){
      return res.status(400).json({message: 'query parameter is required'})
    }
    try {
       const response =  await fetch(`https://www.alphavantage.co/query?function=${filter}&symbol=${symbol}&interval=${interval}&apikey=${apikey}`);
       const data = await response.json();

       if (!response.ok) {
        // Handle non-OK responses here
        return res.status(response.status).json({ message: 'Error fetching data from Alpha Vantage' });
      }
       res.json(data);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).json({ error: 'Failed fetching data' });
    }
}

export default historical_data;