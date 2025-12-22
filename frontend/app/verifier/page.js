'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

// --------------------------------------------------------------------------------
// CONFIGURATION
// --------------------------------------------------------------------------------
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

export default function VerifierDashboard() {
  const [proofData, setProofData] = useState('');
  const [status, setStatus] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Function to Connect MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setStatus("Wallet Connected. Ready to Verify.");
      } catch (error) {
        console.error(error);
        setStatus("❌ Connection denied.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const verifyProof = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask");
      
      setStatus("⏳ parsing data...");
      setVerificationResult(null);

      // 1. Parse the JSON
      let parsed;
      try {
        parsed = JSON.parse(proofData);
      } catch(e) {
        return alert("Invalid JSON! Please paste the full proof object.");
      }
      
      const { proof, publicSignals } = parsed;

      // 2. Format for Solidity
      const pA = [proof.pi_a[0], proof.pi_a[1]];
      const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]], 
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ];
      const pC = [proof.pi_c[0], proof.pi_c[1]];
      const pubSignals = publicSignals;

      setStatus("🔌 Connecting to MetaMask...");

      // ------------------------------------------------------------
      // META MASK CONNECTION IS BACK
      // ------------------------------------------------------------
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // We get the signer (the user)
      
      const contractData = await fetch('/artifacts/Groth16Verifier.json').then(res => res.json());
      
      // We connect the contract to the SIGNER (MetaMask User)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, signer);

      // 3. Verify
      // We use .staticCall to ask the node "Is this valid?" without paying gas
      console.log("Sending to contract...", CONTRACT_ADDRESS);
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

      {/* Connect Wallet Button */}
      {!isConnected && (
        <button onClick={connectWallet} style={{...actionBtnStyle, background: '#ff9900', marginBottom: '20px'}}>
          🦊 Connect MetaMask First
        </button>
      )}

      <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px' }}>
        <label style={{fontWeight:'bold'}}>Paste Full Proof JSON:</label>
        <textarea 
          style={{ width: '100%', height: '200px', fontFamily: 'monospace', marginTop: '10px', fontSize: '12px' }}
          placeholder='{"proof": {...}, "publicSignals": [...] }'
          value={proofData}
          onChange={(e) => setProofData(e.target.value)}
        />

        <button onClick={verifyProof} disabled={!isConnected} style={{...actionBtnStyle, opacity: isConnected ? 1 : 0.5}}>
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