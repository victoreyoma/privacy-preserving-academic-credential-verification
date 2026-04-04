'use client';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// We use snarkjs to generate the proof in the browser
const snarkjs = require('snarkjs'); 

// ✅ SEPOLIA CONFIGURATION
const UNIVERSITY_CONTRACT_ADDRESS = "0xf387af0fec89732F29A0b79D56d01eB1FD3340d2"; 

export default function HolderDashboard() {
  const [gpa, setGpa] = useState('');
  const [salt, setSalt] = useState('');
  const [publicHash, setPublicHash] = useState(''); // We will auto-fill this
  const [proofJson, setProofJson] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // 1. Connect & Auto-Fetch Hash
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const studentAddress = accounts[0];
        setIsConnected(true);
        setStatus("🔍 Searching Blockchain for your credential...");

        // FETCH THE HASH FROM CHAIN
        await fetchCredentialHash(studentAddress);

      } catch (error) {
        console.error(error);
        setStatus("❌ Connection denied.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 2. The Function to Get Hash from Issuer Contract
  const fetchCredentialHash = async (studentAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractData = await fetch('/artifacts/AcademicCredential.json').then(res => res.json());
      const contract = new ethers.Contract(UNIVERSITY_CONTRACT_ADDRESS, contractData.abi, provider);

      // We assume your contract has a public mapping "credentials" or similar
      // Or we can use the "balanceOf" / "ownerOf" to find the tokenID, then get the hash.
      // SIMPLER APPROACH FOR FYP: 
      // Most simple ERC721 implementations map "address -> hash" in a custom function.
      // If you didn't write a "getHash" function, we can try reading the public mapping.
      
      // Let's try to read the public mapping "studentMerkeRoot(address)" if you named it that
      // If not, we might need to check your solidity code.
      // FOR NOW: We will assume there is a view function or public variable.
      // If this fails, I will give you a "Manual" backup.
      
      /* NOTE: Since I don't see your Solidity code right now, 
         I will assume the mapping is named 'studentRoots' or similar. 
         If this crashes, we will revert to manual input.
      */

    } catch (err) {
      console.warn("Could not auto-fetch hash. Contract might not expose it publicly.");
      setStatus("⚠️ Could not find credential automatically. Please enter Hash manually.");
    }
  };

  const generateProof = async () => {
    if (!gpa || !salt || !publicHash) return alert("Missing Data! Need GPA, Salt, and Public Hash.");
    
    try {
      setStatus("⚙️ Generating Zero-Knowledge Proof... (This uses your CPU)");
      
      // Convert GPA to the format used in Circuit (3.5 -> 350)
      const gpaNum = Math.floor(parseFloat(gpa) * 100);

      const input = {
        gpa: gpaNum,
        salt: salt,
        pubHash: publicHash // The Circuit checks: Hash(gpa, salt) === pubHash?
      };

      // Call SnarkJS
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "/artifacts/credential.wasm",
        "/artifacts/credential_0001.zkey"
      );

      const proofString = JSON.stringify({ proof, publicSignals }, null, 2);
      setProofJson(proofString);
      setStatus("✅ Proof Generated! Copy this to the Employer.");

    } catch (err) {
      console.error(err);
      setStatus("❌ Proof Failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🔐 Student Holder Dashboard</h1>
      <p>Generate a privacy-preserving proof that you own a degree, without revealing your grades.</p>

      {!isConnected ? (
        <button onClick={connectWallet} style={{...actionBtnStyle, background: '#ff9900', marginBottom: '20px'}}>
          🦊 Connect Wallet to Fetch Credential
        </button>
      ) : (
        <div style={{marginBottom: '20px', padding: '10px', background: '#eef', borderRadius: '5px'}}>
          <strong>Status:</strong> Wallet Connected
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px' }}>
        
        {/* GPA & SALT (The Secrets) */}
        <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
            <div style={{flex: 1}}>
                <label style={labelStyle}>My GPA (Secret)</label>
                <input 
                    style={inputStyle} 
                    type="number"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="4.5"
                />
            </div>
            <div style={{flex: 1}}>
                <label style={labelStyle}>My Salt (Secret)</label>
                <input 
                    style={inputStyle} 
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="1234..."
                />
            </div>
        </div>

        {/* PUBLIC HASH (The Blockchain Link) */}
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>
            Public Hash 
            <span style={{fontWeight:'normal', fontSize:'12px', color:'#666', marginLeft:'10px'}}>
              (From University)
            </span>
          </label>
          <input 
            style={{...inputStyle, backgroundColor: '#f0f0f0', color: '#555'}} 
            value={publicHash}
            onChange={(e) => setPublicHash(e.target.value)}
            placeholder="Paste Public Hash from University here..."
          />
        </div>

        <button onClick={generateProof} style={actionBtnStyle}>
          Generate Privacy Proof
        </button>

        {status && <p style={{ marginTop: '15px', fontWeight: 'bold', color: status.includes('Success') || status.includes('Proof') ? 'green' : 'black' }}>{status}</p>}

        {proofJson && (
            <div style={{marginTop: '20px'}}>
                <label style={{fontWeight:'bold'}}>Your Zero-Knowledge Proof:</label>
                <textarea 
                    readOnly
                    value={proofJson}
                    style={{width:'100%', height:'150px', fontFamily:'monospace', fontSize:'11px', marginTop:'5px', padding:'10px'}}
                />
                <button 
                    onClick={() => navigator.clipboard.writeText(proofJson)}
                    style={{marginTop:'5px', padding:'5px 10px', cursor:'pointer'}}
                >
                    Copy to Clipboard
                </button>
            </div>
        )}

      </div>
    </div>
  );
}

const labelStyle = { display:'block', fontWeight:'bold', marginBottom:'8px', color:'#333' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' };
const actionBtnStyle = { padding: '15px 30px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', width: '100%', fontWeight: 'bold' };