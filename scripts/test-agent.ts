const TEST_CASES = [
  {
    name: "1. Explicit Errata Lookup (Mirror Shield vs Piercing Bolt)",
    payload: {
      cards: ["Mirror Shield", "Piercing Bolt"],
      currentPhase: "Action Phase",
      question: "Can Mirror Shield reflect Piercing Bolt?"
    },
    expectedConfidence: "high"
  },
  {
    name: "2. Rule Priority Fallback (Time Warp vs Null Field)",
    payload: {
      cards: ["Time Warp", "Null Field"],
      currentPhase: "End Phase",
      question: "Can I play Time Warp during the End Phase if Null Field is active?"
    },
    expectedConfidence: "high"
  },
  {
    name: "3. Three-Card Chain Interaction",
    payload: {
      cards: ["Chain Lightning", "Sanctuary Zone", "Blood Pact"],
      currentPhase: "Combat Phase",
      question: "How does Chain Lightning resolve when targeting Sanctuary Zone if Blood Pact is played as a reaction?"
    },
    expectedConfidence: "high"
  },
  {
    name: "4. Unknown / Unseeded Card (Strict Fallback)",
    payload: {
      cards: ["Mystic Dragon"],
      currentPhase: "Main Phase",
      question: "Does Mystic Dragon destroy target items?"
    },
    expectedConfidence: "low"
  }
];

async function runTestSuite() {
  console.log("==================================================");
  console.log("  BOARD GAME RULE AGENT — END-TO-END TEST SUITE   ");
  console.log("==================================================\n");

  for (const tc of TEST_CASES) {
    console.log(`Running: ${tc.name}...`);
    try {
      const res = await fetch("http://localhost:3000/api/resolve-conflict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tc.payload),
      });

      const data: any = await res.json();

      if (!data.success) {
        console.log(`❌ ERROR: ${data.error}\n`);
        continue;
      }

      const ruling = data.agentRuling;
      const pass = tc.expectedConfidence === 'low'
        ? ruling?.confidence === 'low'
        : (ruling?.confidence === 'high' || ruling?.confidence === 'medium');

      console.log(`Result: [${pass ? 'PASS' : 'FAIL'}]`);
      console.log(`• Verdict:    ${ruling?.verdict}`);
      console.log(`• Confidence: ${ruling?.confidence}`);
      console.log(`• Cited Docs: ${JSON.stringify(ruling?.citedDocuments || [])}`);
      console.log(`• Reasoning:  ${ruling?.reasoning?.slice(0, 120)}...\n`);
    } catch (err: any) {
      console.log(`❌ FETCH FAILED: ${err.message}\n`);
    }
  }
}

runTestSuite();