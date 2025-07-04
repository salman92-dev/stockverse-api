import OpenAI from "openai";
import dotenv from "dotenv";
import get_stock_price from "./price.mjs";
import get_stock_news from "./news.mjs";
import get_company_details from "./company-details.mjs";
import get_IPO from "./ipo.mjs";
import get_historical_data from "./historical_data.mjs";
import get_market_status from "./market_status.mjs";
import get_related_companies from "./related_companies.mjs";
import get_upcoming_market_holidays from "./upcoming_holidays.mjs";
import get_top_gainers from "./top_gainers.mjs";
import get_top_losers from "./top_losers.mjs";
import get_weekly_adjusted from "./historical_weekly.mjs";
import get_monthly_adjusted from "./historical_monthly.mjs";
import get_daily_adjusted from "./historical_daily.mjs";
import get_income_statement from "./income_statemet.mjs";
import get_balance_sheet from "./balance_sheet.mjs";
import get_cash_flow from "./cash_flow.mjs";
import get_stock_earnings from "./earnings.mjs";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getCurrentDate = () => {
    const now = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = daysOfWeek[now.getDay()]; // Get day name
    const date = now.toISOString().split("T")[0]; // Get date in YYYY-MM-DD format

    return { date, day }; // Return both date and day
};

// Usage
const { date, day } = getCurrentDate();
console.log(`Today is ${day}, ${date}`);

export default async function stockverseGPT({ command, chatHistory }) {
    const messages = [
        {
            role: "system",
            content: `These are Instructions and rules and strictly follow these intructions. Today's date is ${date} and it is ${day}. Always reference yourself as 'StockverseGPT'. Your only purpose is to call the funtions required to answer the question or if the question do not need data from funtions following these Instructions. Never ask or tell user to wait or hold on, while you call the functions. If you need news, company details, income statemet, balance sheet, cash flow, earnings, or related companies details to the specific stock, or top gainers/losers (no symbol required), or upcoming IPO details (no symbol required), or market status (no symbol required), or upcoming market holidays (no symbol required) , or price of any stock, or if you need data of any of from here 'afterHours,close,from,high,low,open,preMarket,volume' of a specific date (you can decide the date if the specific date is not mentioned in the question but make sure it's not holiday what you decide.) call get_historical_data. If you need average volume,price,open,close,high,low,change of some days or any week or month of any stock, you can call get_daily_adjusted/get_weekly_adjusted/get_monthly_adjusted. When responding with stock symbols,funtions,dates ensure that they are according to provided rules and structures without any additional information, annotations, or comments, or even any space. For example: RequiredStockDetails = [ symbols : { '1':'aapl','2':'intc','3':'amd'}, functions : {'1':'get_stock_price', '2': 'get_stock_news', '3': 'get_company_details', '4': 'get_ipo', '5': 'get_market_status', '6': 'get_related_companies', '7': 'get_upcoming_market_holidays', '8': 'get_historical_data', '9': 'get_top_gainers', '10': 'get_top_losers', '11': 'get_daily_adjusted', '12': 'get_weekly_adjusted', '13': 'get_monthly_adjusted', '14': 'get_income_statement', '15': 'get_balance_sheet', '16': 'get_cash_flow', '17': 'get_stock_earnings'}, dates : {'1': '2006-12-04'} ]. Any response violating this format will break the system. If the question is AAPL is a good buy or any stock or related to that you can call any funtions you have to analyze and determine to tell the user if that stock is a good buy or sell or should user invest in it. Call funtion get_stock_price if you need latest value of any of these 'open,high,low,price,volume,latest trading day,previous close,change,change percent'. Call funtion get_company_details, if you need values of any of these: 'name,market,locale,primary_exchange,type,active,currency_name,cik,composite_figi,share_class_figi,market_cap,phone Number,address,city,state,postal_code,description,sic_code,sic_description,ticker_root,homepage_url,total_employees,list_date,share_class_shares_outstanding,weighted_shares_outstanding,round_lot'. Call the funtion get_market_status funtion if you need values of these 'afterHours,currencies,crypto,fx,earlyHours,exchanges,nasdaq,nyse,otc,market,serverTime'. If these provided functions are not enough to answer the question, recommend user to go to Stockverse 'https://stockverse.com/dashboard' to see the latest information related. Do not recommend any other sources. and one more thing that 'CVKD', 'NEOV' is a stock and exists.`
        },
    ];
    
    chatHistory.rows.forEach(({ question, answer }) => {
        messages.push({ role: "user", content: question });
        messages.push({ role: "assistant", content: answer });
    });

    messages.push({ role: "user", content: command });

    console.log("Sent to GPT");
    const chat = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4o",
        temperature: 0,
        max_tokens: 16384,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });

    const answer = chat.choices[0].message.content;

    // Check if RequiredStockDetails is present in the answer
    const requiredStockDetailsMatch = answer.match(/RequiredStockDetails\s*=\s*\[([^\]]*)\]/);
    console.log(requiredStockDetailsMatch);

    if (requiredStockDetailsMatch) {
        const requiredStockDetails = requiredStockDetailsMatch[1];

        // Extract symbols and functions
        const symbolsMatch = requiredStockDetails.match(/symbols\s*:\s*\{([^\}]*)\}/);
        const functionsMatch = requiredStockDetails.match(/functions\s*:\s*\{([^\}]*)\}/);
        const datesMatch = requiredStockDetails.match(/dates\s*:\s*\{([^\}]*)\}/);

        const symbols = symbolsMatch && symbolsMatch[1].trim() // Check if symbolsMatch[1] exists and is not empty
            ? symbolsMatch[1]
                .split(',')
                .map(item => {
                    const parts = item.split(':');
                    const symbol = parts[1]?.trim().replace(/'/g, ""); // Safely access and clean symbol
                    return symbol ? symbol.toUpperCase() : null; // Convert to uppercase and validate
                })
                .filter(Boolean) // Remove invalid or null entries
            : []; // Default to an empty array if no symbols are found
            
        const functions = functionsMatch && functionsMatch[1].trim()
            ? functionsMatch[1]
                .split(',')
                .map(item => item.split(':')[1]?.trim().replace(/'/g, ""))
                .filter(Boolean)
            : [];
    
        const dates = datesMatch && datesMatch[1].trim()
            ? datesMatch[1]
                .split(',')
                .map(item => item.split(':')[1]?.trim().replace(/'/g, ""))
                .filter(Boolean)
            : [];

        console.log("Symbols:", symbols);
        console.log("Functions:", functions);
        console.log("Dates:", dates);

        if (functions.length > 0) {
            try {
                // Map functions to their corresponding calls
                const functionCalls = functions.map((fn) => {
                    switch (fn) {
                        case "get_stock_price":
                            return get_stock_price(symbols);
                        case "get_stock_news":
                            return get_stock_news(symbols);
                        case "get_company_details":
                            return get_company_details(symbols);
                        case "get_ipo":
                            return get_IPO();
                        case "get_historical_data":
                            return get_historical_data(symbols, dates);
                        case "get_market_status":
                            return get_market_status();
                        case "get_related_companies":
                            return get_related_companies(symbols);
                        case "get_upcoming_market_holidays":
                            return get_upcoming_market_holidays();
                        case "get_top_gainers":
                            return get_top_gainers();
                        case "get_top_losers":
                            return get_top_losers();
                        case "get_daily_adjusted":
                            return get_daily_adjusted(symbols);
                        case "get_weekly_adjusted":
                            return get_weekly_adjusted(symbols);
                        case "get_monthly_adjusted":
                            return get_monthly_adjusted(symbols);
                        case "get_income_statement":
                            return get_income_statement(symbols);
                        case "get_balance_sheet":
                            return get_balance_sheet(symbols);
                        case "get_cash_flow":
                            return get_cash_flow(symbols);
                        case "get_stock_earnings":
                            return get_stock_earnings(symbols);
                        default:
                            console.warn(`Unknown function: ${fn}`);
                            return null;
                    }
                });

                // Wait for all function results
                const results = await Promise.all(functionCalls);

                // Combine the results
                const combinedResults = results.reduce((acc, result, index) => {
                    if (result) acc[functions[index]] = result;
                    return acc;
                }, {});

                console.log("Combined Results:", combinedResults);

                const StockDetailsRequired = JSON.stringify(combinedResults);

                // Pass the results to GPT for a final response
                const finalMessages = [
                    {
                        role: "system",
                        content: "Always reference yourself as 'StockverseGPT' and do not say 'ChatGPT' or OpenAI model to users. If the question is related to get point of view on any stock you can analyze the provided data and tell user about the stock if it's a good buy or sell or should invest in it and pros and cons of that stock. The question of the user will be given to you with the data required to answer that question. The data is latest and realtime, so you just have to answer the question while keeping that StockDetailsRequired in mind. If the provided details are not enough to answer the question or undefined or not avaialable then you can say to user that these details are not available right now and recommend them to visit the stockverse.com"
                    },
                    {
                        role: "user",
                        content: `This is the user's question: ${command}. Here is the StockDetailsRequired = ${StockDetailsRequired}`,
                    },
                ];

                const finalChat = await openai.chat.completions.create({
                    messages: finalMessages,
                    model: "gpt-4o-mini",
                    temperature: 1,
                    max_tokens: 4500,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                });

                const finalAnswer = finalChat.choices[0].message.content;
                console.log("Final Answer:", finalAnswer);

                return { answer: finalAnswer };
            } catch (error) {
                console.error("Error fetching data:", error);
                return { answer: "An error occurred while fetching the required data. Please try again." };
            }
        }
    }

    return { answer };
}