import Stripe from 'stripe';
import dotenv from 'dotenv';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode to decode the token
import pool from '../Db/db.mjs'; // Assuming you have a PostgreSQL connection set up

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function renewel_membership(req, res) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(400).json({ message: 'Authentication token is missing' });
  }

  try {
    // Decode the token to get the userId
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;

    // Fetch the subscription data from the database
    const subscriptionQuery = await pool.query(
      'SELECT * FROM subscription WHERE userid = $1',
      [userId]
    );
    const subscription_row = subscriptionQuery.rows[0];

    if (!subscription_row) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // If renewal is disabled in the database, enable it
    if (subscription_row.renew === false) {
      // Fetch subscriptions from Stripe using the customer_id
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription_row.customer_id,
        limit: 1, // Assuming one active subscription per customer
      });

      if (subscriptions.data.length === 0) {
        return res.status(404).json({ message: 'No subscriptions found for this customer' });
      }

      const subscriptionId = subscriptions.data[0].id;

      // Check if the subscription has expired
      const expirationTime = subscriptions.data[0].current_period_end;
      const expirationDate = new Date(expirationTime * 1000); // Convert UNIX timestamp to Date
      const isExpired = expirationDate < new Date(); // Check if the subscription is expired

      // Update subscription renewal status in Stripe (enable renewal)
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false, // Enable renewal by setting cancel_at_period_end to false
      });

      // Optionally, update your database with the new renewal status
      await pool.query(
        'UPDATE subscription SET renew = $1 WHERE customer_id = $2',
        [true, subscription_row.customer_id]
      );

      return res.status(200).json({
        message: 'Subscription renewal enabled successfully',
        subscription: updatedSubscription,
        isExpired,
        expirationDate,
      });
    }

    // If subscription renewal is already enabled, disable it
    if (subscription_row.renew === true) {
      // Fetch subscriptions from Stripe using the customer_id
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription_row.customer_id,
        limit: 1, // Assuming one active subscription per customer
      });

      if (subscriptions.data.length === 0) {
        return res.status(404).json({ message: 'No subscriptions found for this customer' });
      }

      const subscriptionId = subscriptions.data[0].id;

      // Check if the subscription has expired
      const expirationTime = subscriptions.data[0].current_period_end;
      const expirationDate = new Date(expirationTime * 1000); // Convert UNIX timestamp to Date
      const isExpired = expirationDate < new Date(); // Check if the subscription is expired

      // Update subscription renewal status in Stripe (cancel renewal)
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true, // Cancel renewal by setting cancel_at_period_end to true
      });

      // Optionally, update your database with the new renewal status
      await pool.query(
        'UPDATE subscription SET renew = $1 WHERE customer_id = $2',
        [false, subscription_row.customer_id]
      );

      return res.status(200).json({
        message: 'Subscription renewal canceled successfully',
        subscription: updatedSubscription,
        isExpired,
        expirationDate,
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred', error: error.message });
  }
}

export default renewel_membership;
