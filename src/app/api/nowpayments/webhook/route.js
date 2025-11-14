// src/app/api/nowpayments/webhook/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('NowPayments Webhook Received:', JSON.stringify(payload, null, 2));

    const { payment_id, payment_status, pay_amount, order_id, price_amount } = payload;

    // Find deposit by order_id
    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const depositsQuery = query(
      collection(db, 'deposits'), 
      where('orderId', '==', order_id)
    );
    
    const snapshot = await getDocs(depositsQuery);
    
    if (snapshot.empty) {
      console.log('Deposit not found for order:', order_id);
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const depositDoc = snapshot.docs[0];
    const depositData = depositDoc.data();

    // Update deposit status based on payment status
    let newStatus = 'pending';
    
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      newStatus = 'confirmed';
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      newStatus = 'failed';
    }

    await updateDoc(depositDoc.ref, {
      status: newStatus,
      paymentStatus: payment_status,
      updatedAt: new Date()
    });

    // If payment is confirmed, add funds to wallet
    if (newStatus === 'confirmed') {
      await confirmDeposit(depositDoc.id, depositData);
    }

    console.log(`Deposit ${order_id} updated to: ${newStatus}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function confirmDeposit(depositId, depositData) {
  // Update deposit as confirmed
  await updateDoc(doc(db, 'deposits', depositId), {
    status: 'confirmed',
    confirmedAt: new Date()
  });

  // Add funds to user's wallet
  const walletRef = doc(db, 'wallets', depositData.userId);
  
  try {
    const walletDoc = await getDoc(walletRef);
    const currentBalance = walletDoc.exists() ? walletDoc.data().balance : 0;
    const totalDeposited = walletDoc.exists() ? walletDoc.data().totalDeposited : 0;

    await updateDoc(walletRef, {
      balance: currentBalance + depositData.amountUSD,
      totalDeposited: totalDeposited + depositData.amountUSD,
      updatedAt: new Date()
    });

    console.log(`✅ Deposit confirmed: $${depositData.amountUSD} for user ${depositData.userId}`);
  } catch (error) {
    console.error('Error updating wallet:', error);
    // Create wallet if it doesn't exist
    await setDoc(walletRef, {
      userId: depositData.userId,
      balance: depositData.amountUSD,
      totalDeposited: depositData.amountUSD,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}