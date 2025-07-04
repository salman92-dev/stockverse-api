import pool from "../Db/db.mjs";
import { jwtDecode } from "jwt-decode";

async function fetch_userhistory(req,res){
    try {
        const token = req.cookies.authToken; // access token from cooies
        const decodedToken = jwtDecode(token);
        let id = decodedToken.id;

    
        const result = await pool.query(
            'SELECT * FROM user_search_history where userid = $1',
            [id],
            );
        if(result.rowCount > 0){
                res.status(200).json(result.rows);
        }
        else{
            return  res.status(201).json({message: "search history does not exist"})
        }
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(400).json({ message: "Error fetching history data" });
    }
}

export default fetch_userhistory;