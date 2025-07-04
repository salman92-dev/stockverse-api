import Stripe from 'stripe';  // Assuming stripe instance is imported
import pool from '../Db/db.mjs';
import dotenv from 'dotenv';
import { jwtDecode } from 'jwt-decode';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyPayment(req, res) {
    const { session_id } = req.query;
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authentication token not found' });
    }
    let decodedToken;
    try {
        decodedToken = jwtDecode(token);
        const userid = decodedToken.id;

        // Fetch the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log(subscription);

        // Access the price_id from the subscription items
        const priceId = subscription.items.data[0].price.id;

        // Check the payment status
        if (session.payment_status === 'paid') {

            const subscription = await stripe.subscriptions.retrieve(session.subscription);

            const createdTime = subscription.created;
            const createdDate = new Date(createdTime * 1000);
            const expirationTime = subscription.current_period_end;
            const expirationDate = new Date(expirationTime * 1000);
            const selectUser = await pool.query(
                'SELECT * FROM register WHERE userid = $1',
                [userid]
            );
            const userRow = selectUser.rows[0];

            await pool.query(
                `UPDATE subscription 
                SET customer_id = $1, 
                    start_date = $2, 
                    expires_at = $3, 
                    subscription_id = $4, 
                    price_id = $5, 
                    status = $6 
                WHERE userid = $7`,
                [
                    session.customer,
                    createdDate,
                    expirationDate,
                    session.subscription,
                    priceId,
                    subscription.status, // or session.status if using that
                    userid
                ]
            );

            return res.status(200).json({ session, subscription });
        } else {
            return res.status(400).json({ session, message: 'Payment not successful' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export default verifyPayment;