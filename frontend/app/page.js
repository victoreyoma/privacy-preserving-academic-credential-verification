import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>🎓 Academic Credential System</h1>
      <p>Secure, Private, Verifiable Degrees using Blockchain & Zero-Knowledge Proofs.</p>
      
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link href="/issuer">
          <button style={btnStyle}>🏛 University Dashboard (Issue)</button>
        </Link>
        
        <Link href="/holder">
          <button style={btnStyle}>🎓 Student Dashboard (Holder)</button>
        </Link>
        
        <Link href="/verifier">
          <button style={btnStyle}>✅ Employer Dashboard (Verify)</button>
        </Link>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '15px 30px',
  fontSize: '18px',
  cursor: 'pointer',
  backgroundColor: '#0070f3',
  color: 'white',
  border: 'none',
  borderRadius: '5px'
};