import pool from "../Db/db.mjs";
import { jwtDecode } from "jwt-decode";

async function check_mem_exp(req,res){
    const token = req.cookies.authToken;
    if(!token){
        return res.status(401).json({message : 'unauthorized user'})
    }
    let decodedToken
    try {
        decodedToken = jwtDecode(token);
        const userid = decodedToken.id;

        const result = await pool.query(
            'UPDATE subscription SET status = $1 WHERE userid = $2',
            ['deactive',userid]
        );
        if (result.rowCount > 0) {
            return res.status(207).json({message : 'status changed'});
        } else {
            return res.status(400).json({message : 'status could not changed'});
        }
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : "server error" })
    }
}
export default  check_mem_exp;