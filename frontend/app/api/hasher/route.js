import { NextResponse } from 'next/server';
// We use the same library your dataHandler.js uses
import { buildPoseidon } from 'circomlibjs'; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { gpa, salt } = body;

    if (!gpa || !salt) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Initialize Hash Function
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // 2. Prepare Data (MUST MATCH YOUR HOLDER LOGIC EXACTLY)
    // In holder/page.js, we saw: Math.floor(parseFloat(gpa) * 100)
    const transcriptNumeric = Math.floor(parseFloat(gpa) * 100);

    // 3. Calculate Hash
    // Hash = Poseidon([GPA, Salt])
    const hashBigInt = poseidon([transcriptNumeric, salt]);
    
    // Convert to the Decimal String format Solidity expects
    const hashString = F.toString(hashBigInt);

    return NextResponse.json({ hash: hashString });

  } catch (error) {
    console.error("Hashing Error:", error);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}