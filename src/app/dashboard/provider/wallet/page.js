// src/app/dashboard/provider/wallet/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSimpleWallet } from '@/context/SimpleWalletContext';
import { useAuth } from '@/context/AuthContext';

export default function WalletPage() {
  const { user } = useAuth();
  const { balance, deposits, loading, fixedAmounts, createDeposit } = useSimpleWallet(); // REMOVED confirmDeposit
  const [message, setMessage] = useState('');
  const [activePayment, setActivePayment] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status === 'success') {
      setMessage('Payment completed! Waiting for confirmation...');
    } else if (status === 'cancelled') {
      setMessage('Payment was cancelled.');
    }
  }, []);

  const handleDeposit = async (amount) => {
    if (!user) {
      setMessage('Please log in to make a deposit');
      return;
    }

    setMessage('Creating payment...');

    try {
      const result = await createDeposit(amount);
      
      if (result.success) {
        setActivePayment(result);
        setMessage('');
        
        // Redirect to payment page
        window.open(result.paymentUrl, '_blank');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('Error creating deposit: ' + error.message);
    }
  };


  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}

  // REMOVED the dangerous handleManualConfirm function entirely

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-200">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Log In</h2>
          <p className="text-pink-200">You need to be logged in to access your wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">💰 Wallet Balance</h1>
            <p className="text-gray-600">Manage your funds and track deposits</p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-xl min-w-[140px]">
              <p className="text-sm opacity-90">Available Balance</p>
              <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-xl min-w-[140px]">
              <p className="text-sm opacity-90">Total Deposited</p>
              <p className="text-2xl font-bold">
                ${deposits.filter(d => d.status === 'confirmed').reduce((sum, dep) => sum + dep.amountUSD, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
  
      {/* Deposit Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">💵 Add Funds with Crypto</h2>
        <p className="text-gray-600 mb-6">Choose an amount to deposit instantly</p>
        
        {/* Amount Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {fixedAmounts.map((item) => (
            <button
              key={item.amount}
              onClick={() => handleDeposit(item.amount)}
              className="p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600">${item.amount}</div>
                <div className="text-xs text-gray-500 mt-1">Crypto</div>
              </div>
            </button>
          ))}
        </div>
  
        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">🔒</span>
            </div>
            <span>Secure payments</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">⚡</span>
            </div>
            <span>10-30 min confirmation</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">🛡️</span>
            </div>
            <span>Auto verification</span>
          </div>
        </div>
      </div>
  
      {/* Active Payment Info */}
      {activePayment && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Payment Created</h3>
              <p className="opacity-90">Redirecting to payment page for ${activePayment.amount}</p>
              <p className="text-sm opacity-80 mt-2">Order ID: {activePayment.orderId}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white/10 rounded-lg">
            <p className="text-sm font-medium">Please complete the payment on the NowPayments page</p>
          </div>
        </div>
      )}
  
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-2xl mb-6 ${
          message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 
          message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {message.includes('Error') ? '❌' : message.includes('✅') ? '✅' : '💡'}
            </span>
            <p className="font-medium">{message}</p>
          </div>
        </div>
      )}
  
      {/* Deposit History */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">📊 Deposit History</h2>
        
        {deposits.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">💸</span>
            </div>
            <p className="text-gray-500">No deposits yet</p>
            <p className="text-gray-400 text-sm mt-1">Your deposit history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.map(deposit => (
              <div key={deposit.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(deposit.status)}`}>
                      {deposit.status.toUpperCase()}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        ${deposit.amountUSD}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {deposit.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {deposit.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      <span className="text-sm">⏳</span>
                      <span className="text-sm font-medium">Waiting for confirmation</span>
                    </div>
                  )}
                </div>
                
                {deposit.orderId && (
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Order ID:</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all text-black">
                      {deposit.orderId}
                    </span>
                  </div>
                )}
                
                {deposit.confirmedAt && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">Confirmed:</span>
                    <span className="text-xs text-green-600">
                      {deposit.confirmedAt.toDate().toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  
      {/* How It Works */}
      <div className="mt-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-6">
        <h4 className="font-bold text-lg mb-3">💡 How It Works</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">1</span>
            </div>
            <div>
              <strong>Choose amount</strong>
              <p className="opacity-90 text-xs mt-1">Select from $20, $30, $40, or $50</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">2</span>
            </div>
            <div>
              <strong>Complete Crypto payment</strong>
              <p className="opacity-90 text-xs mt-1">Secure payment via NowPayments</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">3</span>
            </div>
            <div>
              <strong>Automatic verification</strong>
              <p className="opacity-90 text-xs mt-1">System verifies payment automatically</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">4</span>
            </div>
            <div>
              <strong>Funds added to wallet</strong>
              <p className="opacity-90 text-xs mt-1">Balance updates instantly</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <p className="text-sm font-medium">🛡️ Confirmation is automatic and secure - no manual intervention needed</p>
        </div>
      </div>
    </div>
  </div>
  );
}