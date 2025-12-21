'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

// --------------------------------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------------------------------
// The address that we KNOW works
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

export default function VerifierDashboard() {
  const [proofData, setProofData] = useState('');
  const [status, setStatus] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // 1. UI ONLY: Connect MetaMask (For the "DApp Experience")
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        setStatus("✅ Wallet Connected. Ready to Verify.");
      } catch (error) {
        console.error(error);
        setStatus("❌ Connection denied.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 2. LOGIC: Verify using Direct Connection (Reliable!)
  const verifyProof = async () => {
    try {
      setStatus("⏳ Verifying Proof...");
      setVerificationResult(null);

      // Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(proofData);
      } catch(e) {
        return alert("Invalid JSON! Please paste the full proof object.");
      }
      
      const { proof, publicSignals } = parsed;

      // Format for Solidity
      const pA = [proof.pi_a[0], proof.pi_a[1]];
      const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]], 
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ];
      const pC = [proof.pi_c[0], proof.pi_c[1]];
      const pubSignals = publicSignals;

      // ------------------------------------------------------------
      // HYBRID TRICK: Use Direct Provider for reliability
      // ------------------------------------------------------------
      // We don't need the user's wallet to check math. We use the public node.
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      
      const contractData = await fetch('/artifacts/Groth16Verifier.json').then(res => res.json());
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);

      console.log("Checking proof on-chain...");
      const isValid = await contract.verifyProof.staticCall(pA, pB, pC, pubSignals);

      if (isValid === true) {
        setVerificationResult("✅ VALID");
        setStatus("Blockchain Confirmation: This degree is AUTHENTIC.");
      } else {
        setVerificationResult("❌ INVALID");
        setStatus("Blockchain Confirmation: The proof is mathematically incorrect.");
      }

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err.reason || err.message || "Contract Call Failed"));
      setVerificationResult("ERROR");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>✅ Employer Verifier Dashboard</h1>
      <p>Paste the proof provided by the student to verify it on-chain.</p>

      {/* Connect Wallet Button - Visual Only */}
      {!isConnected ? (
        <button onClick={connectWallet} style={{...actionBtnStyle, background: '#ff9900', marginBottom: '20px'}}>
          🦊 Connect MetaMask (Employer ID)
        </button>
      ) : (
        <div style={{marginBottom: '20px', padding: '10px', background: '#eef', borderRadius: '5px'}}>
          <strong>Connected Employer:</strong> {walletAddress}
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px' }}>
        <label style={{fontWeight:'bold'}}>Paste Full Proof JSON:</label>
        <textarea 
          style={{ width: '100%', height: '200px', fontFamily: 'monospace', marginTop: '10px', fontSize: '12px' }}
          placeholder='{"proof": {...}, "publicSignals": [...] }'
          value={proofData}
          onChange={(e) => setProofData(e.target.value)}
        />

        {/* Verification Button - Works even if wallet is glitchy */}
        <button onClick={verifyProof} style={actionBtnStyle}>
          Verify Proof on Blockchain
        </button>

        {verificationResult && (
           <div style={{ 
             marginTop: '20px', 
             padding: '20px', 
             textAlign: 'center',
             backgroundColor: verificationResult.includes("VALID") ? '#d4edda' : '#f8d7da',
             color: verificationResult.includes("VALID") ? '#155724' : '#721c24',
             fontSize: '24px',
             fontWeight: 'bold',
             borderRadius: '8px',
             border: verificationResult.includes("VALID") ? '2px solid #28a745' : '2px solid #dc3545'
           }}>
             {verificationResult}
             <p style={{fontSize:'16px', fontWeight:'normal', margin: '10px 0 0 0'}}>{status}</p>
           </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = { 
  padding: '15px 30px', 
  marginTop: '15px',
  background: '#0070f3', 
  color: '#fff', 
  border: 'none', 
  borderRadius: '5px', 
  cursor: 'pointer', 
  fontSize: '16px',
  width: '100%'
};