const hre = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--- Starting Full System Test ---");

  // ----------------------------------------------------
  // 1. SETUP: Get the deployed contracts
  // ----------------------------------------------------
  // Note: We use the addresses from your deployment log
  const credentialAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const verifierAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  const Credential = await hre.ethers.getContractFactory("AcademicCredential");
  const credentialContract = Credential.attach(credentialAddr);

  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifierContract = Verifier.attach(verifierAddr);

  // Get test accounts
  const [university, student] = await hre.ethers.getSigners();
  console.log(`University: ${university.address}`);
  console.log(`Student:    ${student.address}`);

  // ----------------------------------------------------
  // 2. PRIVACY LAYER: Prepare the Data
  // ----------------------------------------------------
  // In a real app, this is the PDF file. Here we simulate it with a number.
  const transcriptData = 123456789; // e.g., Hash of the PDF
  const secretSalt = 987654321;     // Secret random number

  // We need to calculate the "Public Hash" manually first to mint the token
  // (We use Circom's Poseidon implementation for consistency)
  const { buildPoseidon } = require("circomlibjs");
  const poseidon = await buildPoseidon();
  const pubHashBigInt = poseidon([transcriptData, secretSalt]);
  const pubHash = poseidon.F.toString(pubHashBigInt); // Convert to string for Solidity

  console.log(`\n[Off-Chain] Generated Public Hash: ${pubHash}`);

  // ----------------------------------------------------
  // 3. ISSUANCE: University Mints SoulBound Token
  // ----------------------------------------------------
  console.log("\n[On-Chain] University minting credential...");
  // We need to convert the big number to a hex string for Solidity bytes32
  // But for the ZK input, we use the decimal string. 
  // For simplicity in this v1 test, we will just mint the token.
  
  // Note: For the Verifier contract, inputs are usually uint256. 
  // Let's assume the Credential contract stores it as bytes32 for generic storage.
  const tx = await credentialContract.connect(university).issueCredential(
      student.address, 
      "0x" + BigInt(pubHash).toString(16).padStart(64, '0') // Store as hex
  );
  await tx.wait();
  console.log("✅ Credential Minted! TokenID: 0");

  // ----------------------------------------------------
  // 4. PROOF: Student Generates ZK Proof (Client-Side)
  // ----------------------------------------------------
  console.log("\n[Client-Side] Student generating Zero-Knowledge Proof...");
  
  const input = {
      transcriptData: transcriptData,
      secretSalt: secretSalt,
      pubHash: pubHash
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "circuits/credential_js/credential.wasm",
      "circuits/credential_final.zkey"
  );

  console.log("✅ Proof Generated!");
  // console.log("Public Signals (Root):", publicSignals);

  // ----------------------------------------------------
  // 5. VERIFICATION: Employer Checks on Blockchain
  // ----------------------------------------------------
  console.log("\n[On-Chain] Employer verifying proof...");

  // Convert the proof to the format Solidity expects (uint256[8])
  const solidityCallData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  
  // The output comes as a string "[a,b,c], [d,e], ...". We need to parse it.
  // A hacky way to parse the arguments for Ethers.js:
  const args = JSON.parse("[" + solidityCallData + "]");
  const a = args[0];
  const b = args[1];
  const c = args[2];
  const inputs = args[3];

  const isValid = await verifierContract.verifyProof(a, b, c, inputs);

  if (isValid) {
      console.log("🎉 SUCCESS: Proof is VALID! The student has the degree.");
  } else {
      console.log("❌ FAILURE: Proof Invalid.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});