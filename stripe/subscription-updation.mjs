import Stripe from 'stripe';
import dotenv from 'dotenv';
import { jwtDecode } from 'jwt-decode';
import pool from '../Db/db.mjs'; // Assuming you have a PostgreSQL connection set up

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Route to upgrade or downgrade a subscription
 * @param {string} newPriceId - The new price ID for the upgraded or downgraded plan
 */
async function change_subscription_plan(req, res) {
  const token = req.cookies.authToken;
  const { priceId } = req.body; // The new price ID for the upgraded/downgraded plan

  if (!token) {
    return res.status(400).json({ message: 'Authentication token is missing' });
  }

  if (!priceId) {
    return res.status(400).json({ message: 'New price ID is required' });
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

    // Fetch the current subscription from Stripe using the customer_id
    const subscriptions = await stripe.subscriptions.list({
      customer: subscription_row.customer_id,
      limit: 1, // Assuming one active subscription per customer
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for this customer' });
    }

    const subscriptionId = subscriptions.data[0].id;

    // Create an update to the current subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptions.data[0].items.data[0].id, // The subscription item ID
        price: priceId, // New price ID for the upgraded or downgraded plan
      }],
      proration_behavior: 'create_prorations', // Handle proration based on change
    });

    // Update the database with the new price ID (plan)
    await pool.query(
      'UPDATE subscription SET plan_id = $1 WHERE customer_id = $2',
      [priceId, subscription_row.customer_id]
    );

    return res.status(200).json({
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred', error: error.message });
  }
}

export default change_subscription_plan;
