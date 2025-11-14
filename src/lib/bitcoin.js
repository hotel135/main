// src/lib/bitcoin.js
class BitcoinWallet {
    constructor() {
      this.apiKey = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_KEY;
      this.baseURL = 'https://api.blockchain.com/v3/exchange';
    }
  
    // Generate new Bitcoin address for user
    async generateAddress(userId) {
      try {
        // In a real implementation, you'd use Blockchain.com API
        // For demo, we'll generate a deterministic address from userId
        const address = this.generateDeterministicAddress(userId);
        
        return {
          success: true,
          address: address,
          message: 'Bitcoin address generated successfully'
        };
      } catch (error) {
        console.error('Error generating address:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  
    // Check address balance
    async checkBalance(address) {
      try {
        // Mock implementation - in production, use blockchain API
        const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
        
        if (response.ok) {
          const balance = await response.text();
          return {
            success: true,
            balance: parseInt(balance) / 100000000, // Convert satoshis to BTC
            confirmed: true
          };
        }
        
        throw new Error('Failed to fetch balance');
      } catch (error) {
        console.error('Error checking balance:', error);
        return {
          success: false,
          error: error.message
        };
      }
    }
  
    // Generate deterministic address from userId (for demo)
    generateDeterministicAddress(userId) {
      // This is a simplified version - in production use proper key derivation
      const hash = this.simpleHash(userId);
      return `bc1q${hash.substring(0, 40)}`; // Mock Bech32 address
    }
  
    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
  
    // Convert USD to BTC
    async usdToBtc(amountUSD) {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        const btcPrice = data.bitcoin.usd;
        
        return amountUSD / btcPrice;
      } catch (error) {
        console.error('Error converting USD to BTC:', error);
        return 0.0001; // Fallback rate
      }
    }
  
    // Validate Bitcoin address
    validateAddress(address) {
      // Basic validation - in production use proper validation library
      const regex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/;
      return regex.test(address);
    }
  }
  
  export const bitcoinWallet = new BitcoinWallet();