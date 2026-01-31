// src/context/SimpleWalletContext.js
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIXED_AMOUNTS } from "@/config/payments";

const SimpleWalletContext = createContext();

export function useSimpleWallet() {
  const context = useContext(SimpleWalletContext);
  if (!context) {
    throw new Error(
      "useSimpleWallet must be used within a SimpleWalletProvider"
    );
  }
  return context;
}

export function SimpleWalletProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Your NowPayments API Key (store in .env.local in production)
  const NOWPAYMENTS_API_KEY =
    process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY || "YOUR_API_KEY_HERE";

  // NowPayments API URLs
  const NOWPAYMENTS_API = {
    createInvoice: "https://api.nowpayments.io/v1/invoice",
    getInvoice: "https://api.nowpayments.io/v1/invoice",
    paymentStatus: "https://api.nowpayments.io/v1/payment",
  };

  // Initialize wallet
  const initializeWallet = async (userId) => {
    try {
      const walletRef = doc(db, "wallets", userId);
      const walletDoc = await getDoc(walletRef);

      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        setBalance(walletData.balance || 0);
      } else {
        await setDoc(walletRef, {
          userId: userId,
          balance: 0,
          totalDeposited: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setBalance(0);
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
    }
  };

  // Load deposits
  const loadDeposits = async (userId) => {
    try {
      const depositsQuery = query(
        collection(db, "deposits"),
        where("userId", "==", userId)
      );

      const unsubscribe = onSnapshot(depositsQuery, (snapshot) => {
        const depositsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by date manually
        depositsData.sort((a, b) => b.createdAt - a.createdAt);
        setDeposits(depositsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading deposits:", error);
      return () => {};
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);

      const loadWalletData = async () => {
        try {
          await initializeWallet(user.uid);
          await loadDeposits(user.uid);
          startPaymentPolling(user.uid); // Start polling for pending payments
        } catch (error) {
          console.error("Error loading wallet data:", error);
        } finally {
          setLoading(false);
        }
      };

      loadWalletData();
    } else if (!authLoading && !user) {
      setLoading(false);
      setBalance(0);
      setDeposits([]);
    }
  }, [user, authLoading]);

  // Create unique NowPayments invoice
  const createDeposit = async (amount) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    if (![50, 100, 200, 300, 500].includes(amount)) {
      return { success: false, error: "Amount must be 50, 100, 200, 300, 500" };
    }

    try {
      // Generate unique order ID
      const orderId = `deposit_${user.uid}_${Date.now()}`;

      // Create invoice with NowPayments API
      const invoiceResponse = await fetch(NOWPAYMENTS_API.createInvoice, {
        method: "POST",
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          order_id: orderId, // UNIQUE per user
          order_description: `Wallet deposit $${amount}`,
          ipn_callback_url:
            process.env.NEXT_PUBLIC_WEBHOOK_URL ||
            "https://your-webhook-url/api/nowpayments/webhook",
          success_url: `${window.location.origin}/dashboard/provider/wallet?status=success&orderId=${orderId}`,
          cancel_url: `${window.location.origin}/dashboard/provider/wallet?status=cancelled`,
          // Optional: Add custom fields
          pay_currency: null, // Let user choose
          is_fixed_rate: false,
          is_fee_paid_by_user: false,
        }),
      });

      if (!invoiceResponse.ok) {
        const error = await invoiceResponse.text();
        throw new Error(`NowPayments API error: ${error}`);
      }

      const invoiceData = await invoiceResponse.json();

      // Create deposit record in Firestore
      const depositData = {
        userId: user.uid,
        amountUSD: amount,
        status: "pending",
        orderId: orderId,
        invoiceId: invoiceData.id,
        paymentUrl: invoiceData.invoice_url,
        paymentId: invoiceData.payment_id || null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          invoiceUrl: invoiceData.invoice_url,
          payAddress: invoiceData.pay_address,
          payAmount: invoiceData.pay_amount,
          payCurrency: invoiceData.pay_currency,
          nowpaymentsStatus: "pending",
        },
      };

      const depositRef = await addDoc(collection(db, "deposits"), depositData);

      return {
        success: true,
        depositId: depositRef.id,
        paymentUrl: invoiceData.invoice_url, // Unique payment link
        amount: amount,
        orderId: orderId,
        invoiceId: invoiceData.id,
      };
    } catch (error) {
      console.error("Error creating deposit:", error);
      return {
        success: false,
        error: error.message || "Failed to create payment",
      };
    }
  };

  // Poll for payment status (simple browser-based polling)
  const startPaymentPolling = (userId) => {
    let pollingInterval;

    const pollPayments = async () => {
      if (!userId) return;

      try {
        // Get pending deposits for this user
        const pendingQuery = query(
          collection(db, "deposits"),
          where("userId", "==", userId),
          where("status", "==", "pending"),
          where("createdAt", ">", new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24h
        );

        const snapshot = await getDocs(pendingQuery);

        for (const depositDoc of snapshot.docs) {
          const deposit = depositDoc.data();

          // Skip if no invoiceId
          if (!deposit.invoiceId) continue;

          try {
            // Check invoice status with NowPayments API
            const statusResponse = await fetch(
              `${NOWPAYMENTS_API.getInvoice}/${deposit.invoiceId}`,
              {
                headers: {
                  "x-api-key": NOWPAYMENTS_API_KEY,
                },
              }
            );

            if (statusResponse.ok) {
              const invoiceStatus = await statusResponse.json();

              // Update deposit with latest status
              await updateDoc(doc(db, "deposits", depositDoc.id), {
                metadata: {
                  ...deposit.metadata,
                  nowpaymentsStatus: invoiceStatus.payment_status,
                  actuallyPaid: invoiceStatus.actually_paid,
                  payCurrency: invoiceStatus.pay_currency,
                },
                updatedAt: new Date(),
              });

              // If payment is finished, confirm it
              if (invoiceStatus.payment_status === "finished") {
                await confirmPayment(depositDoc.id, deposit, invoiceStatus);
              }

              // If expired or failed
              if (
                ["expired", "failed", "refunded"].includes(
                  invoiceStatus.payment_status
                )
              ) {
                await updateDoc(doc(db, "deposits", depositDoc.id), {
                  status: invoiceStatus.payment_status,
                  updatedAt: new Date(),
                });
              }
            }
          } catch (apiError) {
            console.log("API check error:", apiError.message);
          }
        }
      } catch (error) {
        console.log("Polling error:", error.message);
      }
    };

    // Start polling every 30 seconds
    pollingInterval = setInterval(pollPayments, 30000);

    // Run immediately
    pollPayments();

    // Return cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  };

  // Confirm payment and update wallet
  const confirmPayment = async (depositId, depositData, invoiceStatus) => {
    try {
      const batch = writeBatch(db);

      // Update deposit status
      const depositRef = doc(db, "deposits", depositId);
      batch.update(depositRef, {
        status: "confirmed",
        confirmedAt: new Date(),
        paymentId: invoiceStatus.payment_id || depositData.paymentId,
        metadata: {
          ...depositData.metadata,
          nowpaymentsStatus: "finished",
          actuallyPaid: invoiceStatus.actually_paid,
          payCurrency: invoiceStatus.pay_currency,
        },
      });

      // Update wallet balance
      const walletRef = doc(db, "wallets", depositData.userId);
      const walletDoc = await getDoc(walletRef);

      let currentBalance = 0;
      let totalDeposited = 0;

      if (walletDoc.exists()) {
        const wallet = walletDoc.data();
        currentBalance = wallet.balance || 0;
        totalDeposited = wallet.totalDeposited || 0;
      }

      batch.update(walletRef, {
        balance: currentBalance + depositData.amountUSD,
        totalDeposited: totalDeposited + depositData.amountUSD,
        updatedAt: new Date(),
      });

      await batch.commit();

      // Update local state
      setBalance((prev) => prev + depositData.amountUSD);

      console.log(
        `✅ Payment confirmed: $${depositData.amountUSD} added to wallet`
      );
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw error;
    }
  };

  // Manual payment check (for testing)
  const checkPaymentStatus = async (depositId) => {
    try {
      const depositDoc = await getDoc(doc(db, "deposits", depositId));
      if (!depositDoc.exists()) {
        return { success: false, error: "Deposit not found" };
      }

      const deposit = depositDoc.data();
      if (!deposit.invoiceId) {
        return { success: false, error: "No invoice ID" };
      }

      const response = await fetch(
        `${NOWPAYMENTS_API.getInvoice}/${deposit.invoiceId}`,
        {
          headers: { "x-api-key": NOWPAYMENTS_API_KEY },
        }
      );

      if (response.ok) {
        const invoiceStatus = await response.json();

        await updateDoc(doc(db, "deposits", depositId), {
          metadata: {
            ...deposit.metadata,
            nowpaymentsStatus: invoiceStatus.payment_status,
            updatedAt: new Date(),
          },
        });

        if (invoiceStatus.payment_status === "finished") {
          await confirmPayment(depositId, deposit, invoiceStatus);
        }

        return {
          success: true,
          status: invoiceStatus.payment_status,
          data: invoiceStatus,
        };
      }

      return { success: false, error: "API request failed" };
    } catch (error) {
      console.error("Error checking payment:", error);
      return { success: false, error: error.message };
    }
  };

  // Pay for ad
  const payForAd = async (adCost, adDetails) => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    if (adCost > balance) {
      return { success: false, error: "Insufficient funds" };
    }

    try {
      const walletRef = doc(db, "wallets", user.uid);
      await updateDoc(walletRef, {
        balance: balance - adCost,
        updatedAt: new Date(),
      });

      setBalance((prev) => prev - adCost);

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "ad_payment",
        amount: adCost,
        adDetails: adDetails,
        status: "completed",
        createdAt: new Date(),
      });

      return { success: true, newBalance: balance - adCost };
    } catch (error) {
      console.error("Error processing payment:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    balance,
    deposits,
    loading,
    fixedAmounts: FIXED_AMOUNTS,
    createDeposit,
    checkPaymentStatus,
    payForAd,
  };

  return (
    <SimpleWalletContext.Provider value={value}>
      {children}
    </SimpleWalletContext.Provider>
  );
}
