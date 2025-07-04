import pool from '../Db/db.mjs';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkMembership(req, res) {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(400).json({ message: "Token was not provided" });
    }

    try {
        const decodedToken = jwtDecode(token);
        const userid = decodedToken.id;

        const result = await pool.query('SELECT * FROM subscription WHERE userid = $1', [userid]);
        const subscription = result.rows[0];

        if (!subscription) {
            return res.status(404).json({ message: "No subscription found" });
        }

        const now = new Date();
        const expiresAt = new Date(subscription.expires_at);

        // Check if the subscription has expired
        if (expiresAt <= now) {
            try {
                const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscription_id);
                const newStart = new Date(stripeSubscription.current_period_start * 1000);
                const newEnd = new Date(stripeSubscription.current_period_end * 1000);

                // Create a fresh new date object to avoid mutation
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);

                // If it's cancelled and expired, downgrade to free
                if (
                    stripeSubscription.status === 'canceled' &&
                    newEnd <= now
                ) {
                    await pool.query(
                        'UPDATE subscription SET start_date = $1, expires_at = $2, status = $3, subscription_id = NULL, price_id = $4, counter = $5 WHERE userid = $6',
                        [now, nextMonth, 'active', 'price_free', 3, userid]
                    );
                } else if (subscription.price_id === 'price_free') {
                    await pool.query(
                        'UPDATE subscription SET start_date = $1, expires_at = $2, status = $3, subscription_id = NULL, price_id = $4, counter = $5 WHERE userid = $6',
                        [now, nextMonth, 'active', 'price_free', 3, userid]
                    );
                } else {
                    // If still active or not yet expired, just update from Stripe
                    await pool.query(
                        'UPDATE subscription SET start_date = $1, expires_at = $2, status = $3 WHERE userid = $4',
                        [newStart, newEnd, stripeSubscription.status, userid]
                    );
                }
            } catch (err) {
                // Stripe subscription not found, downgrade to free
                await pool.query(
                    'UPDATE subscription SET start_date = $1, expires_at = $2, status = $3, subscription_id = NULL, price_id = $4, counter = $5 WHERE userid = $6',
                    [now, nextMonth, 'active', 'price_free', 3, userid]
                );
            }

            // Return updated row
            const updated = await pool.query('SELECT * FROM subscription WHERE userid = $1', [userid]);
            return res.status(200).json(updated.rows[0]);
        }

        return res.status(200).json(subscription);
    } catch (error) {
        console.error('checkMembership error:', error);
        return res.status(500).json({ error: error.message });
    }
}

export default checkMembership;