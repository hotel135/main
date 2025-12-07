// src/config/payments.js
export const FIXED_AMOUNTS = [
  { amount: 50, id: "amount_50", description: "$50 Deposit" },
  { amount: 100, id: "amount_100", description: "$100 Deposit" },
  { amount: 200, id: "amount_200", description: "$200 Deposit" },
  { amount: 300, id: "amount_300", description: "$300 Deposit" },
  { amount: 500, id: "amount_500", description: "$500 Deposit" },
];

// Your NowPayments payment links (you'll get these from your NowPayments dashboard)
export const PAYMENT_LINKS = {
  50: "https://nowpayments.io/payment/?iid=5734775603",
  100: "https://nowpayments.io/payment/?iid=5151315238",
  200: "https://nowpayments.io/payment/?iid=5320138310",
  300: "https://nowpayments.io/payment/?iid=6007528789",
  500: "https://nowpayments.io/payment/?iid=4707117736",
};

// NowPayments IPN settings
export const IPN_CONFIG = {
  callback_url: `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/api/nowpayments/webhook`,
  success_url: `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/dashboard/provider/wallet?status=success`,
  cancel_url: `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/dashboard/provider/wallet?status=cancelled`,
};
