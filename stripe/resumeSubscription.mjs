import Stripe from 'stripe';
import pool from '../Db/db.mjs';
import dotenv from 'dotenv';
import { jwtDecode } from 'jwt-decode';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function resumeSubscription(req, res) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token not found' });
  }

  try {
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    const result = await pool.query(
      'SELECT subscription_id FROM subscription WHERE userid = $1',
      [userId]
    );

    const subscriptionId = result.rows[0]?.subscription_id;

    if (!subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found for user' });
    }

    // Resume the subscription by setting cancel_at_period_end to false
    const resumed = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    await pool.query(
      'UPDATE subscription SET status = $1 WHERE userid = $2',
      ['active', userId]
    );

    return res.status(200).json({ success: true, resumed });
  } catch (err) {
    console.error('Resume Subscription Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export default resumeSubscription;