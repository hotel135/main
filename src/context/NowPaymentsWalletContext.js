// src/context/NowPaymentsWalletContext.js
'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
  doc, getDoc, setDoc, updateDoc, 
  collection, addDoc, query, where, 
  orderBy, onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { nowPayments } from '@/lib/nowpayments'; // ADD THIS IMPORT

const NowPaymentsWalletContext = createContext();

export function useNowPaymentsWallet() {
  const context = useContext(NowPaymentsWalletContext);
  if (!context) {
    throw new Error('useNowPaymentsWallet must be used within a NowPaymentsWalletProvider');
  }
  return context;
}

export function NowPaymentsWalletProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const walletInitialized = useRef(false);

  // Initialize or get user wallet
  const initializeWallet = async (userId) => {
    try {
      const walletRef = doc(db, 'wallets', userId);
      const walletDoc = await getDoc(walletRef);
      
      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        setBalance(walletData.balance || 0);
        console.log('Wallet loaded:', walletData);
      } else {
        const walletData = {
          userId: userId,
          balance: 0,
          totalDeposited: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(walletRef, walletData);
        setBalance(0);
        console.log('New wallet created for user:', userId);
      }
      
      walletInitialized.current = true;
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  };

  // Load deposits history - REMOVED the non-existent loadTransactions function
  const loadDeposits = async (userId) => {
    try {
      // TEMPORARY: Simple query without ordering to avoid index requirement
      const depositsQuery = query(
        collection(db, 'deposits'),
        where('userId', '==', userId)
        // REMOVED: orderBy('createdAt', 'desc') to avoid index requirement
      );
  
      const unsubscribe = onSnapshot(depositsQuery, 
        (snapshot) => {
          const depositsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sort manually instead of using orderBy
          depositsData.sort((a, b) => b.createdAt - a.createdAt);
          setDeposits(depositsData);
        }, 
        (error) => {
          console.error('Deposits snapshot error:', error);
        }
      );
  
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up deposits listener:', error);
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
        } catch (error) {
          console.error('Error loading wallet data:', error);
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

  // FIXED: nowPayments is now properly imported
  const createDeposit = async (amountUSD) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (amountUSD < 5 || amountUSD > 1000) {
      return { success: false, error: 'Amount must be between $5 and $1000' };
    }

    try {
      const orderId = `deposit_${user.uid}_${Date.now()}`;
      
      // Check if demo mode is enabled
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      
      let paymentResult;
      
      if (isDemoMode) {
        console.log('Using demo mode for payment');
        paymentResult = await nowPayments.createDemoPayment(amountUSD, 'usd', orderId, user.uid);
      } else {
        paymentResult = await nowPayments.createPayment(amountUSD, 'usd', orderId, user.uid);
      }
      
      if (!paymentResult.success) {
        return { 
          success: false, 
          error: paymentResult.error,
          details: paymentResult.details 
        };
      }

      const paymentData = paymentResult.data;

      // Create deposit record
      const depositData = {
        userId: user.uid,
        amountUSD: amountUSD,
        status: isDemoMode ? 'pending' : 'pending', // Start as pending for both modes
        nowpaymentsId: paymentData.id,
        paymentUrl: paymentData.invoice_url,
        btcAmount: paymentData.pay_amount,
        btcAddress: paymentData.pay_address,
        orderId: orderId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      };

      const depositRef = await addDoc(collection(db, 'deposits'), depositData);

      // If demo mode, auto-confirm the deposit after 3 seconds
      if (isDemoMode) {
        setTimeout(async () => {
          await confirmDeposit(depositRef.id, parseFloat(paymentData.pay_amount));
        }, 3000);
      }

      return {
        success: true,
        depositId: depositRef.id,
        paymentUrl: paymentData.invoice_url,
        btcAddress: paymentData.btcAddress,
        btcAmount: paymentData.pay_amount,
        expiresAt: depositData.expiresAt,
        isDemo: isDemoMode
      };

    } catch (error) {
      console.error('Error creating deposit:', error);
      return { success: false, error: error.message };
    }
  };

  // Add confirmDeposit function
  const confirmDeposit = async (depositId, actualAmountBTC) => {
    try {
      const depositDoc = await getDoc(doc(db, 'deposits', depositId));
      
      if (!depositDoc.exists()) {
        return { success: false, error: 'Deposit not found' };
      }

      const depositData = depositDoc.data();
      
      // Update deposit status
      await updateDoc(doc(db, 'deposits', depositId), {
        status: 'confirmed',
        confirmedAt: new Date(),
        actualAmountBTC: actualAmountBTC
      });

      // Add funds to user's wallet
      const walletRef = doc(db, 'wallets', depositData.userId);
      const walletDoc = await getDoc(walletRef);
      const currentBalance = walletDoc.exists() ? walletDoc.data().balance : 0;
      const totalDeposited = walletDoc.exists() ? walletDoc.data().totalDeposited : 0;
      
      await updateDoc(walletRef, {
        balance: currentBalance + depositData.amountUSD,
        totalDeposited: totalDeposited + depositData.amountUSD,
        updatedAt: new Date()
      });

      // Update local balance state
      setBalance(currentBalance + depositData.amountUSD);

      console.log(`Deposit ${depositId} confirmed successfully`);
      return { success: true, message: 'Deposit confirmed and funds added' };
    } catch (error) {
      console.error('Error confirming deposit:', error);
      return { success: false, error: error.message };
    }
  };

  const checkDepositStatus = async (depositId) => {
    try {
      const depositDoc = await getDoc(doc(db, 'deposits', depositId));
      
      if (!depositDoc.exists()) {
        return { success: false, error: 'Deposit not found' };
      }

      const depositData = depositDoc.data();
      
      if (depositData.status === 'confirmed') {
        return { success: true, status: 'confirmed', data: depositData };
      }

      // For demo purposes, we'll simulate status checking
      return { 
        success: true, 
        status: depositData.status,
        message: 'Status check completed'
      };

    } catch (error) {
      console.error('Error checking deposit status:', error);
      return { success: false, error: error.message };
    }
  };

  const payForAd = async (adCost, adDetails) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (adCost > balance) {
      return { success: false, error: 'Insufficient funds' };
    }

    try {
      // Deduct from balance
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, {
        balance: balance - adCost,
        updatedAt: new Date()
      });

      setBalance(prev => prev - adCost);

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'ad_payment',
        amount: adCost,
        adDetails: adDetails,
        status: 'completed',
        createdAt: new Date()
      });

      return { success: true, newBalance: balance - adCost };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshWallet = async () => {
    if (user) {
      await initializeWallet(user.uid);
      await loadDeposits(user.uid);
    }
  };

  const value = {
    balance,
    deposits,
    loading,
    createDeposit,
    checkDepositStatus,
    payForAd,
    refreshWallet
  };

  return (
    <NowPaymentsWalletContext.Provider value={value}>
      {children}
    </NowPaymentsWalletContext.Provider>
  );
}