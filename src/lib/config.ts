// This file is used to load environment variables from .env file
// and make them available to the rest of the application.

// In your Vercel/hosting environment, make sure to set:
// NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
// RAZORPAY_KEY_SECRET=your_razorpay_key_secret

import 'dotenv/config';

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RDAGiD6Jwm9aHA';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'kfvmEnjjR6eSMNfY3zHSf3zL';
