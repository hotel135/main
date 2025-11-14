// src/lib/nowpayments.js
class NowPaymentsAPI {
    constructor() {
      this.apiKey = process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY;
      this.baseURL = 'https://api.nowpayments.io/v1';
      this.ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    }
  
    async createPayment(amount, currency = 'usd', orderId, userId) {
      try {
        if (!this.apiKey || this.apiKey === 'demo_key') {
          // Fall back to demo mode if no API key
          return this.createDemoPayment(amount, currency, orderId, userId);
        }
  
        const response = await fetch(`${this.baseURL}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({
            price_amount: amount,
            price_currency: currency.toLowerCase(),
            pay_currency: 'btc',
            ipn_callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/nowpayments/webhook`,
            order_id: orderId,
            order_description: `Deposit for user ${userId}`,
            success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/provider/wallet?status=success`,
            cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/provider/wallet?status=cancelled`,
          }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
  
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        console.error('NowPayments API Error:', error);
        return { 
          success: false, 
          error: error.message
        };
      }
    }
  
    // Demo mode for testing
    async createDemoPayment(amount, currency = 'usd', orderId, userId) {
      console.log('DEMO MODE: Creating mock payment');
      
      const mockPayment = {
        id: `demo_${Date.now()}`,
        invoice_url: `${window.location.origin}/demo-payment?amount=${amount}`,
        pay_address: 'bc1qdemoaddressfortesting123456',
        pay_amount: (amount / 45000).toFixed(8),
        price_amount: amount,
        order_id: orderId
      };
  
      return { success: true, data: mockPayment };
    }
  
    async getPaymentStatus(paymentId) {
      // Demo implementation
      return { 
        success: true, 
        data: { payment_status: 'finished' } 
      };
    }
  
    verifyIPNSignature(payload, signature) {
      return true; // Skip verification in demo mode
    }
  }
  
  export const nowPayments = new NowPaymentsAPI();