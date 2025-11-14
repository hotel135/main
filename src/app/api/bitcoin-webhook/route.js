// src/app/api/bitcoin-webhook/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const depositId = searchParams.get('depositId');
    
    const body = await request.json();
    
    // Blockchain.com webhook format
    const { value, address, transaction_hash, confirmations } = body;
    
    if (!value || !address) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Convert from satoshis to BTC
    const amountBTC = value / 100000000;
    
    // Find deposit by address
    let depositData;
    let depositDocId;

    if (depositId) {
      // If depositId provided in webhook
      const depositDoc = await getDoc(doc(db, 'deposits', depositId));
      if (depositDoc.exists()) {
        depositData = depositDoc.data();
        depositDocId = depositDoc.id;
      }
    } else {
      // Search by address
      const depositsQuery = query(
        collection(db, 'deposits'),
        where('depositAddress', '==', address),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(depositsQuery);
      if (!snapshot.empty) {
        depositDocId = snapshot.docs[0].id;
        depositData = snapshot.docs[0].data();
      }
    }

    if (!depositData) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    // Check if amount matches (within 1% tolerance)
    const expectedAmount = depositData.amountBTC;
    const amountDifference = Math.abs(amountBTC - expectedAmount) / expectedAmount;
    
    if (amountDifference > 0.01) {
      // Amount doesn't match - mark as problematic
      await updateDoc(doc(db, 'deposits', depositDocId), {
        status: 'amount_mismatch',
        actualAmountBTC: amountBTC,
        confirmedAt: new Date(),
        transactionHash: transaction_hash
      });
      
      return NextResponse.json({ success: false, reason: 'Amount mismatch' });
    }

    // Confirm deposit
    await updateDoc(doc(db, 'deposits', depositDocId), {
      status: 'confirmed',
      actualAmountBTC: amountBTC,
      confirmedAt: new Date(),
      transactionHash: transaction_hash,
      confirmations: confirmations
    });

    // Add funds to user's wallet
    const walletRef = doc(db, 'wallets', depositData.userId);
    const walletDoc = await getDoc(walletRef);
    const currentBalance = walletDoc.exists() ? walletDoc.data().balance : 0;
    
    await updateDoc(walletRef, {
      balance: currentBalance + depositData.amountUSD,
      updatedAt: new Date()
    });

    console.log(`✅ Deposit confirmed: ${amountBTC} BTC for user ${depositData.userId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}