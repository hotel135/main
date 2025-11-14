// src/context/SimpleWalletContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FIXED_AMOUNTS, PAYMENT_LINKS } from '@/config/payments';

const SimpleWalletContext = createContext();

export function useSimpleWallet() {
  const context = useContext(SimpleWalletContext);
  if (!context) {
    throw new Error('useSimpleWallet must be used within a SimpleWalletProvider');
  }
  return context;
}

export function SimpleWalletProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize wallet
  const initializeWallet = async (userId) => {
    try {
      const walletRef = doc(db, 'wallets', userId);
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
          updatedAt: new Date()
        });
        setBalance(0);
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  };

  // Load deposits
  const loadDeposits = async (userId) => {
    try {
      const depositsQuery = query(
        collection(db, 'deposits'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(depositsQuery, (snapshot) => {
        const depositsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by date manually
        depositsData.sort((a, b) => b.createdAt - a.createdAt);
        setDeposits(depositsData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading deposits:', error);
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

  // Create deposit record and redirect to payment link
  const createDeposit = async (amount) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (![20, 30, 40, 50].includes(amount)) {
      return { success: false, error: 'Amount must be $20, $30, $40, or $50' };
    }

    try {
      const orderId = `deposit_${user.uid}_${Date.now()}`;
      
      // Create deposit record
      const depositData = {
        userId: user.uid,
        amountUSD: amount,
        status: 'pending',
        orderId: orderId,
        paymentLink: PAYMENT_LINKS[amount],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      const depositRef = await addDoc(collection(db, 'deposits'), depositData);

      return {
        success: true,
        depositId: depositRef.id,
        paymentUrl: PAYMENT_LINKS[amount],
        amount: amount,
        orderId: orderId
      };

    } catch (error) {
      console.error('Error creating deposit:', error);
      return { success: false, error: error.message };
    }
  };

  // Manual confirmation (for testing or fallback)
  const confirmDeposit = async (depositId) => {
    try {
      const depositDoc = await getDoc(doc(db, 'deposits', depositId));
      
      if (!depositDoc.exists()) {
        return { success: false, error: 'Deposit not found' };
      }

      const depositData = depositDoc.data();
      
      // Update deposit status
      await updateDoc(doc(db, 'deposits', depositId), {
        status: 'confirmed',
        confirmedAt: new Date()
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

      setBalance(currentBalance + depositData.amountUSD);

      return { success: true, message: 'Deposit confirmed' };
    } catch (error) {
      console.error('Error confirming deposit:', error);
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
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, {
        balance: balance - adCost,
        updatedAt: new Date()
      });

      setBalance(prev => prev - adCost);

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

  const value = {
    balance,
    deposits,
    loading,
    fixedAmounts: FIXED_AMOUNTS,
    createDeposit,
    confirmDeposit,
    payForAd
  };

  return (
    <SimpleWalletContext.Provider value={value}>
      {children}
    </SimpleWalletContext.Provider>
  );
}