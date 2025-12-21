'use client';
import { useState } from 'react';
// Import snarkjs dynamically to avoid server-side errors
const snarkjs = require('snarkjs');

export default function HolderDashboard() {
  // Inputs for the Proof
  const [gpa, setGpa] = useState('');
  const [salt, setSalt] = useState('');
  const [publicHash, setPublicHash] = useState(''); // NEW INPUT
  
  // Outputs
  const [proof, setProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const generateProof = async () => {
    if (!gpa || !salt || !publicHash) return alert("Please fill in ALL fields!");
    setLoading(true);
    setStatus("⚙️ Generating Zero-Knowledge Proof... (This may take a moment)");

    try {
      // 1. Prepare Inputs
      // The circuit expects the 'transcriptData' to be a number (e.g., 3.8 -> 380)
      const transcriptNumeric = Math.floor(parseFloat(gpa) * 100); 
      
      const input = {
        transcriptData: transcriptNumeric,
        secretSalt: salt,
        pubHash: publicHash // NOW WE USE THE REAL HASH
      };

      console.log("Generating proof with input:", input);

      // 2. Call SnarkJS (Browser Side)
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "/artifacts/credential.wasm",
        "/artifacts/credential_final.zkey"
      );

      // 3. Display Results
      setProof(JSON.stringify(proof, null, 2));
      setPublicSignals(JSON.stringify(publicSignals, null, 2));
      setStatus("✅ Proof Generated Successfully! You can now send this to an employer.");

    } catch (err) {
      console.error(err);
      setStatus("❌ Error generating proof: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!proof || !publicSignals) return;
    const data = JSON.stringify({ proof: JSON.parse(proof), publicSignals: JSON.parse(publicSignals) });
    navigator.clipboard.writeText(data);
    alert("Proof copied to clipboard!");
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🎓 Student Holder Dashboard</h1>
      <p>Generate a privacy-preserving proof of your degree.</p>

      <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '8px', background: '#f9f9f9' }}>
        <h3>1. Enter Your Data</h3>
        <p style={{fontSize:'14px', color:'#555'}}>
          (These numbers must match EXACTLY what you used in the dataHandler script)
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>GPA (e.g. 3.8):</label>
          <input 
            style={inputStyle} 
            type="number"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            placeholder="3.8"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Secret Salt:</label>
          <input 
            style={inputStyle} 
            type="number"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="987654321"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Public Hash (The long decimal number):</label>
          <input 
            style={inputStyle} 
            type="text"
            value={publicHash}
            onChange={(e) => setPublicHash(e.target.value)}
            placeholder="1655255..."
          />
          <small>Copy this from your terminal output or the dataHandler script logs.</small>
        </div>

        <button onClick={generateProof} disabled={loading} style={actionBtnStyle}>
          {loading ? "Computing ZK Proof..." : "Generate Zero-Knowledge Proof"}
        </button>
        
        {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
      </div>

      {proof && (
        <div style={{ marginTop: '30px', border: '1px solid #28a745', padding: '20px', borderRadius: '8px' }}>
          <h3>🔐 Your Zero-Knowledge Proof</h3>
          <p>This data proves you have the degree without revealing your name or details.</p>
          
          <button onClick={copyToClipboard} style={copyBtnStyle}>Copy Full Proof for Employer</button>

          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div style={{ flex: 1 }}>
              <strong>Proof (Cryptographic Path):</strong>
              <textarea readOnly value={proof} style={areaStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <strong>Public Signals (The Hash):</strong>
              <textarea readOnly value={publicSignals} style={areaStyle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const btnStyle = { padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const actionBtnStyle = { ...btnStyle, background: '#6f42c1', width: '100%', fontSize: '16px' };
const copyBtnStyle = { ...btnStyle, background: '#28a745', marginBottom: '10px' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', color:'#000000' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color:'#000000' };
const areaStyle = { width: '100%', height: '150px', fontSize: '12px', fontFamily: 'monospace', padding: '5px' };