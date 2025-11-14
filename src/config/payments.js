// src/config/payments.js
export const FIXED_AMOUNTS = [
    { amount: 20, id: 'amount_20', description: '$20 Deposit' },
    { amount: 30, id: 'amount_30', description: '$30 Deposit' },
    { amount: 40, id: 'amount_40', description: '$40 Deposit' },
    { amount: 50, id: 'amount_50', description: '$50 Deposit' }
  ];
  
  // Your NowPayments payment links (you'll get these from your NowPayments dashboard)
  export const PAYMENT_LINKS = {
    20: 'https://nowpayments.io/payment/?iid=4727153517',
    30: 'https://nowpayments.io/payment/?iid=4910793489_30', 
    40: 'https://nowpayments.io/payment/?iid=4910793489_40',
    50: 'https://nowpayments.io/payment/?iid=4910793489_50'
  };
  
  // NowPayments IPN settings
  export const IPN_CONFIG = {
    callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/nowpayments/webhook`,
    success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/provider/wallet?status=success`,
    cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/provider/wallet?status=cancelled`
  };