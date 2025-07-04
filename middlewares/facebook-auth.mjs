import passport from "passport";
import { Strategy as FacebookStrategy } from 'passport-facebook';
import pool from '../Db/db.mjs';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import axios from 'axios';
dotenv.config();

const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';
const GHL_API_KEY = process.env.GHL_API_KEY; // Set in your .env securely


// passport.use(
//     new FacebookStrategy(
//         {
//             clientID: `${process.env.FACEBOOK_CLIENT_ID}`,
//             clientSecret: `${process.env.FACEBOOK_CLIENT_SECRET}`,
//             callbackURL: '/auth/facebook/callback',
//             profileFields: ["id", "displayName", "email"],
//             failureRedirect: '/login/cancelled',  // This will redirect on cancellation
//         },
//         async (accessToken, refreshToken, profile, done) => {
//             console.log('Facebook Profile:', profile);
//             const { id, displayName, emails } = profile;
//             const email = emails && emails.length > 0 ? emails[0].value : null;
//             console.log(id,email,displayName);
//             if (!id || !displayName || !email) {
//                 return done(new Error('Missing required fields'), null);
//             }

//             let client;
//             try {
//                 client = await pool.connect();

//                 // Check if the user already exists in the `register` table
//                 const existingUserQuery = 'SELECT * FROM register WHERE email = $1';
//                 const existingUserResult = await client.query(existingUserQuery, [email]);

//                 let user;
//                 if (existingUserResult.rows.length > 0) {
//                     user = existingUserResult.rows[0];
//                 } else {
//                     // Insert new user into `register` table
//                     const insertUserQuery = `
//                         INSERT INTO register (facebook_id, fullname, email, is_verified)
//                         VALUES ($1, $2, $3, $4)
//                         RETURNING *
//                     `;
//                     const insertUserValues = [id, displayName, email, true];
//                     const newUserResult = await client.query(insertUserQuery, insertUserValues);
//                     user = newUserResult.rows[0];
//                 }

//                 // Check if the user has a subscription entry in the `subscription` table
//                 const existingSubscriptionQuery = 'SELECT * FROM subscription WHERE userid = $1';
//                 const existingSubscriptionResult = await client.query(existingSubscriptionQuery, [user.userid]);

//                 if (existingSubscriptionResult.rows.length === 0) {
//                     // Insert default subscription data into `subscription` table
//                     const insertSubscriptionQuery = `
//                         INSERT INTO subscription (
//                             userid, customer_id, email, start_date, expires_at, renew, status, subscription_id, price_id
//                         ) 
//                         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)
//                     `;
//                     const insertSubscriptionValues = [
//                         user.userid,
//                         'N/A', // Default customer ID
//                         user.email,
//                         '2070-01-01 00:00:00', // Default expiration date
//                         false, // Renew flag
//                         'active', // Default status
//                         'N/A', // Default subscription ID
//                         'price_free', // Default price ID
//                     ];
//                     await client.query(insertSubscriptionQuery, insertSubscriptionValues);
//                 }

//                 const klaviyoResponse = await cvkd_klaviyo(email, null);
//                 console.log(klaviyoResponse); // Log it instead of sending response from there

//                 done(null, user);
//             } catch (err) {
//                 console.error('Error in Facebook Strategy:', err);
//                 done(err, false);
//             } finally {
//                 if (client) {
//                     client.release();
//                 }
//             }
//         }
//     )
// );

passport.use(
    new FacebookStrategy(
        {
            clientID: `${process.env.FACEBOOK_CLIENT_ID}`,
            clientSecret: `${process.env.FACEBOOK_CLIENT_SECRET}`,
            callbackURL: 'https://api.stockverse.com/auth/facebook/callback',
            profileFields: ["id", "displayName", "email"],
            failureRedirect: '/login/cancelled',  // This will redirect on cancellation
        },
        async (accessToken, refreshToken, profile, done) => {
            console.log('Facebook Profile:', profile);
            const { id, displayName, emails } = profile;
            const email = emails && emails.length > 0 ? emails[0].value : null;
            console.log(id, email, displayName);
            
            if (!id || !displayName || !email) {
                return done(new Error('Missing required fields'), null);
            }

            let client;
            try {
                client = await pool.connect();

                // Check if the user already exists in the `register` table
                const existingUserQuery = 'SELECT * FROM register WHERE email = $1';
                const existingUserResult = await client.query(existingUserQuery, [email]);

                let user;
                if (existingUserResult.rows.length > 0) {
                    user = existingUserResult.rows[0];
                } else {
                    // Insert new user into `register` table
                    const insertUserQuery = `
                        INSERT INTO register (facebook_id, fullname, email, is_verified)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                    `;
                    const insertUserValues = [id, displayName, email, true];
                    const newUserResult = await client.query(insertUserQuery, insertUserValues);
                    user = newUserResult.rows[0];
                    // Build contact payload from available inputs
                    const tag = "stockverse fb user";
                    const createBody = {};
                    if (email) createBody.email = email;
                    if (tag) createBody.tags = [tag];
                    
                    try {
                        console.log('[Info] Creating new contact...');
                        await axios.post(`${GHL_API_BASE}/contacts/`, createBody, {
                        headers: {
                            Authorization: `Bearer ${GHL_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        });
                    
                        console.log('[Success] New contact created.');
                    
                    } catch (createErr) {
                        console.error('[Create Contact Error]', createErr.response?.data || createErr.message);
                    }
                }

                // Check if the user has a subscription entry in the `subscription` table
                const existingSubscriptionQuery = 'SELECT * FROM subscription WHERE userid = $1';
                const existingSubscriptionResult = await client.query(existingSubscriptionQuery, [user.userid]);

                if (existingSubscriptionResult.rows.length === 0) {
                    // Insert default subscription data into `subscription` table
                    const insertSubscriptionQuery = `
                        INSERT INTO subscription (
                            userid, customer_id, email, start_date, expires_at, renew, status, subscription_id, price_id
                        ) 
                        VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)
                    `;
                    const insertSubscriptionValues = [
                        user.userid,
                        'N/A', // Default customer ID
                        user.email,
                        '2070-01-01 00:00:00', // Default expiration date
                        false, // Renew flag
                        'active', // Default status
                        'N/A', // Default subscription ID
                        'price_free', // Default price ID
                    ];
                    await client.query(insertSubscriptionQuery, insertSubscriptionValues);
                }

                // const klaviyoResponse = await cvkd_klaviyo(email, null);

                done(null, user);
            } catch (err) {
                console.error('Error in Facebook Strategy:', err);
                done(err, false);
            } finally {
                if (client) {
                    client.release();
                }
            }
        }
    )
);


export default passport;