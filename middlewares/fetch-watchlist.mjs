import pool from "../Db/db.mjs";
import { jwtDecode } from "jwt-decode";

async function fetch_watchlist(req,res){
    try {
        const token = req.cookies.authToken; // Access the token from cookies
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decodedToken = jwtDecode(token);

    
        const result = await pool.query(
            'SELECT * FROM watchlist where userid = $1',
            [decodedToken.id],
            );
        if(result.rowCount > 0){
                res.status(200).json(result.rows);
        }
        else{
            res.status(404).json({message: 'watchlist does not exist right now'});
        }
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(400).json({ message: "Error fetching watchlist data" });
    }
}

export default fetch_watchlist;