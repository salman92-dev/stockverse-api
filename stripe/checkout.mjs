import Stripe from 'stripe';
import dotenv from 'dotenv';
import pool from '../Db/db.mjs';
import { jwtDecode } from 'jwt-decode';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); 
// export { stripe };

async function CheckoutSession(req, res){
  const { priceId } = req.body;
  const token = req.cookies.authToken;
  console.log(priceId);

  // "error": "Invalid payment_method_types[2]: must be one of card, acss_debit, affirm, afterpay_clearpay, alipay, au_becs_debit, bacs_debit, bancontact, blik, boleto, cashapp, customer_balance, eps, fpx, giropay, grabpay, ideal, klarna, konbini, link, multibanco, oxxo, p24, paynow, paypal, pix, promptpay, sepa_debit, sofort, swish, us_bank_account, wechat_pay, revolut_pay, mobilepay, zip, amazon_pay, alma, twint, kr_card, naver_pay, kakao_pay, payco, or samsung_pay"

  try {
        const decodedToken = jwtDecode(token);
        const userid = decodedToken.id;

        const userInfo = await pool.query(
            'SELECT fullname , email FROM register WHERE userid = $1',
            [userid]
        ) 


    const customer = await stripe.customers.create({
        name: userInfo.fullname,
        email: userInfo.email,
        metadata: {
            userId: userInfo.rows[0].userid, // Optional: Add custom metadata
        },
    });


    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card',            // Credit and debit cards
        'us_bank_account', // ACH Direct Debit for U.S. bank accounts
        // 'paypal',
        'cashapp',
        // 'amazon_pay',
        'link',
      ],
      customer_update: {
        address: 'auto',
    },
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId, // The price ID of the selected subscription
          quantity: 1,
        },
      ],

      mode: 'subscription',
      customer: customer.id,
      return_url: `${process.env.FRONT_END}/return?session_id={CHECKOUT_SESSION_ID}`,
      automatic_tax: {enabled: true},
    });
    res.status(200).json({ 
      // sessionId: session.id,
      clientSecret: session.client_secret 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default CheckoutSession;
