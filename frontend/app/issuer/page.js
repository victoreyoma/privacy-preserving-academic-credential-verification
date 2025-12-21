'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

// ------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------
// REPLACE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

export default function IssuerDashboard() {
  const [account, setAccount] = useState(null);
  const [studentAddr, setStudentAddr] = useState('');
  const [publicHash, setPublicHash] = useState('');
  const [status, setStatus] = useState('');

  // 1. Connect MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
      } catch (err) {
        console.error(err);
        setStatus("❌ Failed to connect wallet");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 2. Mint Function
  const issueCredential = async () => {
    if (!account) return alert("Connect Wallet first!");
    setStatus("⏳ Minting... Please confirm in MetaMask.");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Load Contract ABI
      const response = await fetch('/artifacts/AcademicCredential.json');
      const contractData = await response.json();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, signer);

      // Convert the decimal hash (string) to Hex for Solidity bytes32
      // The ZK hash is a huge number. We convert it to BigInt then to Hex.
      const hashBigInt = BigInt(publicHash);
      const hashHex = "0x" + hashBigInt.toString(16).padStart(64, '0');

      // Call the Smart Contract
      const tx = await contract.issueCredential(studentAddr, hashHex);
      await tx.wait();

      setStatus(`🎉 Success! Credential Issued to ${studentAddr.slice(0,6)}...`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err.reason || err.message));
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🏛 University Issuer Dashboard</h1>
      
      {!account ? (
        <button onClick={connectWallet} style={btnStyle}>Connect MetaMask</button>
      ) : (
        <p>Connected: <strong>{account}</strong></p>
      )}

      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h3>Issue New Degree</h3>
        
        <label style={labelStyle}>Student Wallet Address:</label>
        <input 
          style={inputStyle} 
          placeholder="0x..." 
          value={studentAddr}
          onChange={(e) => setStudentAddr(e.target.value)}
        />

        <label style={labelStyle}>Credential Hash (from script):</label>
        <input 
          style={inputStyle} 
          placeholder="Paste the huge decimal number here..." 
          value={publicHash}
          onChange={(e) => setPublicHash(e.target.value)}
        />
        <small style={{display:'block', marginBottom:'10px', color:'#666'}}>
          * Run 'node utils/dataHandler.js' to generate this hash.
        </small>

        <button onClick={issueCredential} style={actionBtnStyle}>
          Mint SoulBound Token
        </button>

        {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
      </div>
    </div>
  );
}

// Simple Styles
const btnStyle = { padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const actionBtnStyle = { ...btnStyle, background: '#28a745', width: '100%' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };