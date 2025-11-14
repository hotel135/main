// src/lib/simple-bitcoin.js
class SimpleBitcoinWallet {
    constructor() {
      this.companyWalletAddress = process.env.NEXT_PUBLIC_COMPANY_BTC_ADDRESS;
      this.blockchainApiKey = process.env.BLOCKCHAIN_API_KEY;
    }
  
    // Generate unique deposit address for each user (using xPub)
    async generateDepositAddress(userId, amountUSD) {
      try {
        // Calculate BTC amount
        const amountBTC = await this.estimateBTCAmount(amountUSD);
        const depositId = this.generateDepositId(userId);
        
        // Generate a unique address for this deposit using xPub derivation
        const uniqueAddress = await this.generateUniqueAddress(depositId);
        
        return {
          success: true,
          address: uniqueAddress,
          amountBTC: amountBTC,
          depositId: depositId,
          message: `Send exactly ${amountBTC} BTC to the address above`
        };
      } catch (error) {
        console.error('Error generating address:', error);
        return { success: false, error: error.message };
      }
    }
  
    // Generate unique address using Blockchain.com API
    async generateUniqueAddress(depositId) {
      try {
        // If you have xPub (extended public key), you can generate unique addresses
        // For now, we'll use a simple method - in production, use proper HD wallet
        const response = await fetch(`https://api.blockchain.info/v2/receive?xpub=${process.env.BLOCKCHAIN_XPUB}&callback=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/bitcoin-webhook`)}&key=${this.blockchainApiKey}`);
        
        const data = await response.json();
        return data.address;
      } catch (error) {
        // Fallback: use main address with memo (less ideal but works)
        return this.companyWalletAddress;
      }
    }
  
    // Setup webhook for address (call this when creating deposit)
    async setupAddressWebhook(address, depositId) {
      try {
        const callbackUrl = `${process.env.NEXTAUTH_URL}/api/bitcoin-webhook?depositId=${depositId}`;
        const response = await fetch(`https://api.blockchain.info/v2/receive/balance_update?address=${address}&callback=${encodeURIComponent(callbackUrl)}&key=${this.blockchainApiKey}`);
        
        return response.ok;
      } catch (error) {
        console.error('Error setting up webhook:', error);
        return false;
      }
    }
  
    // Verify transaction using Blockchain.com API
    async verifyTransaction(address, expectedAmount) {
      try {
        const response = await fetch(`https://blockchain.info/rawaddr/${address}`);
        const data = await response.json();
        
        // Check if transaction exists with sufficient amount
        const totalReceived = data.total_received / 100000000; // Convert from satoshis to BTC
        
        if (totalReceived >= expectedAmount * 0.99) { // Allow 1% variance for fees
          return {
            confirmed: true,
            amountReceived: totalReceived,
            transactionHash: data.txs[0]?.hash,
            confirmations: data.txs[0]?.confirmations || 0
          };
        }
        
        return { confirmed: false, amountReceived: totalReceived };
      } catch (error) {
        console.error('Error verifying transaction:', error);
        return { confirmed: false, error: error.message };
      }
    }
  
    // Polling method as backup
    async pollForConfirmation(depositId, address, expectedAmount, maxAttempts = 30) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await this.verifyTransaction(address, expectedAmount);
        
        if (result.confirmed) {
          return { success: true, ...result };
        }
        
        // Wait 2 minutes before next check
        await new Promise(resolve => setTimeout(resolve, 120000));
      }
      
      return { success: false, error: 'Transaction not confirmed within timeout period' };
    }
  
    // ... rest of your existing methods
  }
  
  export const simpleBitcoin = new SimpleBitcoinWallet();