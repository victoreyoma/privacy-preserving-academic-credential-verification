'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

// ✅ SEPOLIA CONFIGURATION
const CONTRACT_ADDRESS = "0xf387af0fec89732F29A0b79D56d01eB1FD3340d2"; 

export default function IssuerDashboard() {
  // Student Details
  const [studentName, setStudentName] = useState('');
  const [studentAddr, setStudentAddr] = useState('');
  const [gpa, setGpa] = useState('');
  const [salt, setSalt] = useState('');
  
  // System State
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Force Switch to Sepolia
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== "0xaa36a7") { 
           try {
             await window.ethereum.request({
               method: 'wallet_switchEthereumChain',
               params: [{ chainId: '0xaa36a7' }],
             });
           } catch (err) {
             alert("Please switch MetaMask to Sepolia Testnet!");
           }
        }
        setIsConnected(true);
        setStatus("✅ Connected as Admin.");
      } catch (error) {
        setStatus("❌ Connection denied.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 2. Helper: Generate Random Secret
  const generateSalt = () => {
    const randomNum = Math.floor(Math.random() * 1000000000000);
    setSalt(randomNum.toString());
  };

  // 3. AUTOMATIC WORKFLOW: Hash -> Convert -> Issue
  const handleIssue = async () => {
    if (!studentAddr || !gpa || !salt) return alert("Please fill in all required fields.");
    
    try {
      setIsProcessing(true);
      setStatus("⚙️ 1/3 Calculating Secure Hash (API)...");

      // A. Call API to Calculate Hash (Background)
      const response = await fetch('/api/hasher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gpa, salt })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // ✅ FIX IS HERE: Convert Decimal String to Bytes32 Hex
      const decimalHash = data.hash; // e.g., "12345..."
      const bigIntHash = BigInt(decimalHash); // Convert to Big Integer
      const hexHash = ethers.toBeHex(bigIntHash); // Convert to Hex "0x3039..."
      const merkleRoot = ethers.zeroPadValue(hexHash, 32); // Ensure it is exactly 32 bytes

      console.log("Original Hash:", decimalHash);
      console.log("Converted Hex:", merkleRoot);

      setStatus("⏳ 2/3 Minting Credential on Blockchain... Check MetaMask.");

      // B. Issue to Smart Contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractData = await fetch('/artifacts/AcademicCredential.json').then(res => res.json());
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, signer);

      // Send the Transaction with the HEX string
      const tx = await contract.issueCredential(studentAddr, merkleRoot);
      setStatus("⏳ 3/3 Waiting for confirmation...");
      
      await tx.wait();

      setStatus(`✅ Success! Degree Issued to ${studentName || 'Student'} (${studentAddr.slice(0,6)}...)`);
      setIsProcessing(false);

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err.reason || err.message || "Operation failed"));
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🎓 University Admin Portal</h1>
      <p style={{color: '#666'}}>Enter student details below to issue a Privacy-Preserving Credential.</p>

      {!isConnected ? (
        <button onClick={connectWallet} style={{...actionBtnStyle, background: '#ff9900', marginBottom: '20px'}}>
          🦊 Connect Admin Wallet
        </button>
      ) : (
        <div style={{marginBottom: '20px', padding: '10px', background: '#eef', borderRadius: '5px', border: '1px solid #ccd'}}>
          <strong>Status:</strong> Online (Sepolia)
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        {/* Student Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Student Name</label>
          <input 
            style={inputStyle} 
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        {/* Wallet Address */}
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Student Wallet Address *</label>
          <input 
            style={inputStyle} 
            value={studentAddr}
            onChange={(e) => setStudentAddr(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
            {/* GPA */}
            <div style={{flex: 1}}>
                <label style={labelStyle}>Graduating GPA *</label>
                <input 
                    style={inputStyle} 
                    type="number"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g. 4.5"
                />
            </div>

            {/* Salt */}
            <div style={{flex: 1}}>
                <label style={labelStyle}>
                    Secret Salt *
                    <span 
                        onClick={generateSalt} 
                        style={{fontSize: '12px', color: '#0070f3', cursor: 'pointer', marginLeft: '10px', textDecoration:'underline'}}
                    >
                        (Generate Random)
                    </span>
                </label>
                <input 
                    style={inputStyle} 
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="Click Generate ->"
                />
            </div>
        </div>

        {/* Action Button */}
        <button 
            onClick={handleIssue} 
            disabled={!isConnected || isProcessing} 
            style={{...actionBtnStyle, opacity: (isConnected && !isProcessing) ? 1 : 0.5}}
        >
          {isProcessing ? "Processing..." : "Issue Credential"}
        </button>

        {/* Status Message */}
        {status && (
            <div style={{ marginTop: '20px', padding: '15px', background: status.includes('Success') ? '#d4edda' : '#f8f9fa', borderRadius: '6px', color: status.includes('Success') ? '#155724' : '#333' }}>
                {status}
            </div>
        )}

        {/* IMPORTANT SECURE DATA DISPLAY */}
        {status.includes('Success') && (
            <div style={{marginTop: '15px', padding: '15px', border: '1px dashed #ffa500', background: '#fff9e6', borderRadius: '6px'}}>
                <strong>⚠️ SEND TO STUDENT:</strong><br/>
                Please securely send these two numbers to <b>{studentName}</b>. They need them to claim their degree:<br/><br/>
                <b>GPA:</b> {gpa}<br/>
                <b>Salt:</b> {salt}
            </div>
        )}

      </div>
    </div>
  );
}

// Styles
const labelStyle = { display:'block', fontWeight:'bold', marginBottom:'8px', color:'#333' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' };
const actionBtnStyle = { padding: '15px 30px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', width: '100%', fontWeight: 'bold' };