import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { getCommodities } from './controllers/commodities.mjs';
import { getGainers, getLosers, getActiveStocks } from './controllers/gainers_losers.mjs';
import { symbol_search } from './controllers/symbol-search.mjs';
import { searchTickers } from './controllers/ticker_search.mjs';
import { get_stock_news } from './controllers/stock-news.mjs';
import getIPOCalendar from './controllers/ipo_calender.mjs';
import getAlphaVantageData from './controllers/your-stocks.mjs';
import cancelSubscription from './stripe/cancelSubscription.mjs';
import resumeSubscription from './stripe/resumeSubscription.mjs';
import stockpicks from './goHighLevel/stockpicks.mjs';
import os from 'os';
import cors from 'cors';
import postusers from './Db/signup.mjs';
import getsignin from './Db/signin.mjs';
import test from './stockverse-gpt/test.mjs';
import passport from './middlewares/google-auth.mjs';
import facebookpassport from './middlewares/facebook-auth.mjs';
import logout from './Db/logout.mjs';
import verify_otp from './Db/verify_email.mjs';
import forgot_pass from './auth/forgot-password.mjs';
import reset_password from './auth/reset-pass.mjs';
import get_user from './middlewares/user.mjs';
import get_user_queries from './middlewares/user_queries.mjs';
import historical_data from './controllers/historical_data.mjs';
import toggleFavorite from './middlewares/watchlist.mjs';
import search_history from './controllers/search-history.mjs';
import getUserData from './controllers/get-all-user-data.mjs';
import update_pass from './Db/update-password.mjs';
import update_username from './Db/update-username.mjs';
import active_listing from './controllers/listing_status.mjs';
import delisting_stocks from './controllers/delisting_stocks.mjs';
import fetchEarningsData from './controllers/earning_calendar.mjs';
import insider_transactions from './controllers/insider_transactions.mjs';
import delete_account from './Db/delete-account.mjs';
import resend_otp from './Db/resend-otp.mjs';
import backup_otp from './Db/backup-otp.mjs';
import jwt from 'jsonwebtoken';
import toggle2FA from './Db/2fa.mjs';
import feedback from './controllers/feedback.mjs';
import get_conversation from './middlewares/get-conversation.mjs';
import add_conversation from './middlewares/conversation.mjs';
import delete_chats from './Db/delete-chats.mjs';
import { company_overview } from './controllers/company-overview.mjs';
import favourite_chats from './Db/favourite-chats.mjs';
import fetch_watchlist from './middlewares/fetch-watchlist.mjs';
import fetch_userhistory from './middlewares/search-history.mjs';
import CheckoutSession from './stripe/checkout.mjs';
import verifyPayment from './stripe/verfiry.mjs';
import checkMembership from './stripe/membership-status.mjs';
import renewel_membership from './stripe/membership-renewel.mjs';
import change_subscription_plan from './stripe/subscription-updation.mjs';
import check_mem_exp from './stripe/check-mem-exp.mjs';
import advertiser_feedback from './controllers/advertiser.mjs';
import cvkd_klaviyo from './Db/cvkd_klaviyo.mjs';
import google_recaptcha from './controllers/google-recaptch.mjs';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONT_END = process.env.FRONT_END;
const app = express();
const router = express.Router();
app.use(cookieParser());



const allowedOrigins = ['http://192.168.1.8:3000','http://localhost:3000', 'https://stockverse.com','https://top.stockverse.com', 'https://gpt.stockverse.com', 'https://stckverse.netlify.app', 'https://stockverse.netlify.app', 'https://stockversegpt.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Check if the request origin is in the allowedOrigins array or if it's undefined (for non-browser requests)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent and received
}));




// Middleware
app.use(express.json());




app.use(passport.initialize());


// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
  
    // Generate JWT after successful authentication
    const token = jwt.sign({ id: req.user.userid, fullname: req.user.fullname, email: req.user.email }, process.env.JWT_SECRET, {
        expiresIn: '6h',
    });

    // Set cookie with the token
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true, // Set to true only if using HTTPS
      sameSite: 'None', // Default option, helps prevent CSRF attacks
      path: '/',
    });

    // Redirect to your custom frontend route with the token (if needed)
    res.redirect(`${FRONT_END}/auth-success?token=${token}`);
});

app.get('/login/cancelled', (req, res) => {
  res.redirect('https://stockverse.com/register'); // Replace with your desired URL
});

app.get("/auth/facebook", facebookpassport.authenticate("facebook", { scope: ["email"] }));


app.get("/auth/facebook/callback",facebookpassport.authenticate("facebook", { session: false }),
  (req, res) => {
    if(!req.user){
      return res.redirect('/login');
    }
    const token = jwt.sign({ id: req.user.userid, fullname: req.user.fullname, email: req.user.email }, process.env.JWT_SECRET, {
      expiresIn: '6h',
  });

  // Set cookie with the token
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: true, // Set to true only if using HTTPS
    sameSite: 'None', // Default option, helps prevent CSRF attacks
    path: '/',
  });

  // Redirect to your custom frontend route with the token (if needed)
  res.redirect(`${FRONT_END}/auth-success?token=${token}`);
  }
);
// // Protected route example
// app.get('/profile', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.json(req.user);
//   } else {
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// });

// Other routes
app.get('/', (req, res) => {
  res.send('<h1>This is the homepage</h1>');
});

app.get('/most-active-stocks', getActiveStocks);
app.get('/gainer-stocks', getGainers);
app.get('/loser-stocks', getLosers);
app.get('/top7', getCommodities);
app.get('/search', searchTickers);
app.get('/symb-search', symbol_search);
app.get('/stock-news',get_stock_news);
app.get('/ipo-calendar',getIPOCalendar);
app.post('/signup', postusers);
app.post('/signin', getsignin);
app.get('/stocks-list',getAlphaVantageData);
app.post('/logout',logout);
app.post('/stockgpt',test);
app.post('/test',test);
app.post('/forgot-password',forgot_pass);
app.post('/reset-password',reset_password);
app.get('/get-user',get_user);
app.post('/chat-history',get_user_queries);
app.get('/historical-data', historical_data);
app.post('/watchlist',toggleFavorite);
app.post('/search-history',search_history);
app.get('/user-data',getUserData);
app.post('/update-password',update_pass);
app.post('/update-username',update_username);
app.get('/listed-stocks', active_listing);
app.get('/delisted-stocks',delisting_stocks);
app.get('/earning-calendar',fetchEarningsData);
app.get('/insider_transactions', insider_transactions);
app.post('/delete-account',delete_account);
app.post('/resend-otp',resend_otp);
app.post('/backup-otp',backup_otp);
app.post('/toggle-2fa',toggle2FA);
app.post('/feedback',feedback);
app.post('/add-conversation',add_conversation);
app.post('/conversation-history',get_conversation);
app.post('/delete-chat',delete_chats);
app.get('/overview', company_overview);
app.post('/favourite-chat',favourite_chats);
app.get('/get-watchlist',fetch_watchlist);
app.get('/get-user-history',fetch_userhistory);
app.post('/create-checkout-session',CheckoutSession);
app.get('/session-status',verifyPayment);
app.get('/membership_info',checkMembership);
app.get('membership_renew',renewel_membership);
app.post('/subscription/cancel', cancelSubscription);
app.post('/subscription/resume', resumeSubscription);
app.get('/membership_update',change_subscription_plan);
app.post('/check-mem-exp',check_mem_exp);
app.use('/auth',verify_otp);
app.post('/advertise-feedback',advertiser_feedback);
app.post('/klaviyo-subscription',cvkd_klaviyo);
app.post("/google-recaptcha",google_recaptcha);
app.use('/stockpicks', stockpicks);


const PORT = process.env.PORT || 4848;
app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  const localNetworkUrl = `http://${getLocalIPAddress()}:${PORT}`;
  console.log(`Server is running on:`);
  console.log(`- Local: ${localUrl}`);
  console.log(`- Local Network: ${localNetworkUrl}`);
});

function getLocalIPAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (let iface in networkInterfaces) {
    for (let alias of networkInterfaces[iface]) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}
