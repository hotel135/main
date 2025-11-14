// src/context/WalletContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { bitcoinWallet } from '@/lib/bitcoin';

const WalletContext = createContext();

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }) {
  const { user, userData } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [loading, setLoading] = useState(true);

  // Load wallet data
  useEffect(() => {
    if (user) {
      loadWalletData();
      setupRealtimeListener();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get wallet document
      const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
      
      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        setBalance(walletData.balance || 0);
        setBitcoinAddress(walletData.bitcoinAddress || '');
      } else {
        // Create new wallet if doesn't exist
        await createNewWallet();
      }

      // Load transactions
      await loadTransactions();
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewWallet = async () => {
    try {
      // Generate Bitcoin address
      const addressResult = await bitcoinWallet.generateAddress(user.uid);
      
      if (addressResult.success) {
        const walletData = {
          userId: user.uid,
          balance: 0,
          bitcoinAddress: addressResult.address,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await updateDoc(doc(db, 'wallets', user.uid), walletData);
        setBitcoinAddress(addressResult.address);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  const setupRealtimeListener = () => {
    if (!user) return;

    // Real-time balance updates
    const walletUnsubscribe = onSnapshot(doc(db, 'wallets', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBalance(data.balance || 0);
        setBitcoinAddress(data.bitcoinAddress || '');
      }
    });

    // Real-time transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsData);
    });

    return () => {
      walletUnsubscribe();
      transactionsUnsubscribe();
    };
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Deposit funds
  const deposit = async (amount, paymentMethod = 'bitcoin') => {
    if (!user || amount <= 0) return { success: false, error: 'Invalid amount' };

    try {
      const transactionData = {
        userId: user.uid,
        type: 'deposit',
        amount: amount,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: new Date()
      };

      // Add transaction record
      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);

      return {
        success: true,
        transactionId: transactionRef.id,
        bitcoinAddress: bitcoinAddress,
        amount: amount
      };
    } catch (error) {
      console.error('Error creating deposit:', error);
      return { success: false, error: error.message };
    }
  };

  // Withdraw funds
  const withdraw = async (amount, bitcoinAddress) => {
    if (!user || amount <= 0 || amount > balance) {
      return { success: false, error: 'Invalid amount or insufficient funds' };
    }

    if (!bitcoinWallet.validateAddress(bitcoinAddress)) {
      return { success: false, error: 'Invalid Bitcoin address' };
    }

    try {
      const transactionData = {
        userId: user.uid,
        type: 'withdrawal',
        amount: amount,
        bitcoinAddress: bitcoinAddress,
        status: 'pending',
        createdAt: new Date()
      };

      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);

      // In production, this would trigger an actual Bitcoin transfer
      // For now, we'll simulate it
      setTimeout(() => {
        completeWithdrawal(transactionRef.id, amount);
      }, 5000);

      return {
        success: true,
        transactionId: transactionRef.id,
        message: 'Withdrawal request submitted'
      };
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return { success: false, error: error.message };
    }
  };

  // Complete withdrawal (simulated)
  const completeWithdrawal = async (transactionId, amount) => {
    try {
      // Update transaction status
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'completed',
        completedAt: new Date()
      });

      // Update wallet balance
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, {
        balance: balance - amount,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error completing withdrawal:', error);
    }
  };

  // Check Bitcoin payment status
  const checkPaymentStatus = async (transactionId) => {
    // In production, this would check blockchain for confirmation
    return { confirmed: true, confirmations: 3 };
  };

  const value = {
    balance,
    transactions,
    bitcoinAddress,
    loading,
    deposit,
    withdraw,
    checkPaymentStatus,
    usdToBtc: bitcoinWallet.usdToBtc
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}