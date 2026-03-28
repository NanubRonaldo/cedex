const fs = require("fs");
const path = require("path");
const FabricGateway = require("./fabric-gateway");

const insurerUser = {
  email: "policyholder@cedex.local",
  mspId: "InsurerMSP"
};

const lenderUser = {
  email: "lender@cedex.local",
  mspId: "LenderMSP"
};

const publicPolicies = [
  {
    policyId: "POL-2024-001",
    holderName: "John Mwatile",
    holderId: "PH-001",
    insurer: "Momentum Namibia",
    productType: "Life Cover",
    totalValue: 300000,
    deathCover: 180000,
    disabilityCover: 60000,
    criticalIllnessCover: 35000,
    retrenchmentCover: 25000
  },
  {
    policyId: "POL-2024-002",
    holderName: "Helena Simon",
    holderId: "PH-002",
    insurer: "Old Mutual Namibia",
    productType: "Family Protection",
    totalValue: 240000,
    deathCover: 150000,
    disabilityCover: 40000,
    criticalIllnessCover: 25000,
    retrenchmentCover: 25000
  },
  {
    policyId: "POL-2024-003",
    holderName: "Thomas Kamati",
    holderId: "PH-003",
    insurer: "Hollard Namibia",
    productType: "Executive Life",
    totalValue: 420000,
    deathCover: 250000,
    disabilityCover: 80000,
    criticalIllnessCover: 50000,
    retrenchmentCover: 40000
  },
  {
    policyId: "POL-2024-004",
    holderName: "Martha Ndapanda",
    holderId: "PH-004",
    insurer: "Santam Namibia",
    productType: "Income Shield",
    totalValue: 150000,
    deathCover: 80000,
    disabilityCover: 25000,
    criticalIllnessCover: 15000,
    retrenchmentCover: 30000
  },
  {
    policyId: "POL-2024-005",
    holderName: "Elizabeth Mukwanga",
    holderId: "PH-005",
    insurer: "Momentum Namibia",
    productType: "Starter Life",
    totalValue: 260000,
    deathCover: 155000,
    disabilityCover: 45000,
    criticalIllnessCover: 30000,
    retrenchmentCover: 30000
  }
];

const publicCessions = [
  {
    cessionId: "CES-2024-001",
    policyId: "POL-2024-001",
    loanId: "LOAN-2024-001",
    lenderId: "LND-001",
    borrowerId: "PH-001",
    cedent: "John Mwatile",
    cessionary: "Momentum Credit Namibia",
    amount: 29000
  },
  {
    cessionId: "CES-2024-002",
    policyId: "POL-2024-002",
    loanId: "LOAN-2024-002",
    lenderId: "LND-001",
    borrowerId: "PH-002",
    cedent: "Helena Simon",
    cessionary: "Momentum Credit Namibia",
    amount: 36000
  },
  {
    cessionId: "CES-2024-003",
    policyId: "POL-2024-003",
    loanId: "LOAN-2024-003",
    lenderId: "LND-002",
    borrowerId: "PH-003",
    cedent: "Thomas Kamati",
    cessionary: "FNB Namibia Microlending",
    amount: 52000
  },
  {
    cessionId: "CES-2024-004",
    policyId: "POL-2024-004",
    loanId: "LOAN-2024-004",
    lenderId: "LND-003",
    borrowerId: "PH-004",
    cedent: "Martha Ndapanda",
    cessionary: "Capricorn Micro Finance",
    amount: 22500
  },
  {
    cessionId: "CES-2024-005",
    policyId: "POL-2024-005",
    loanId: "LOAN-2024-005",
    lenderId: "LND-002",
    borrowerId: "PH-005",
    cedent: "Elizabeth Mukwanga",
    cessionary: "FNB Namibia Microlending",
    amount: 41000
  }
];

function loadJson(relativePath) {
  const absolutePath = path.join(__dirname, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function parseResult(result, fallbackMessage) {
  if (!result || !result.success) {
    throw new Error(result?.error || fallbackMessage);
  }

  if (!result.result) {
    return null;
  }

  try {
    return JSON.parse(result.result);
  } catch (error) {
    return result.result;
  }
}

async function ensurePolicies(gateway) {
  const existing = parseResult(
    await gateway.queryAllPolicies(insurerUser.email, insurerUser.mspId),
    "Unable to query policies"
  );
  const existingIds = new Set((existing || []).map((policy) => policy.policyId));

  for (const policy of publicPolicies) {
    if (existingIds.has(policy.policyId)) {
      continue;
    }

    parseResult(
      await gateway.createPolicy(insurerUser.email, insurerUser.mspId, JSON.stringify(policy)),
      `Unable to create policy ${policy.policyId}`
    );
  }
}

async function ensureCessions(gateway) {
  const existing = parseResult(
    await gateway.queryAllCessions(lenderUser.email, lenderUser.mspId),
    "Unable to query cessions"
  );
  const existingIds = new Set((existing || []).map((cession) => cession.cessionId));

  for (const cession of publicCessions) {
    if (existingIds.has(cession.cessionId)) {
      continue;
    }

    parseResult(
      await gateway.createCession(lenderUser.email, lenderUser.mspId, JSON.stringify(cession)),
      `Unable to create cession ${cession.cessionId}`
    );
  }
}

async function seedPolicyCollections(gateway) {
  const policyholderPrivate = loadJson("sample-data/private-collections/policyholder-private.json").docs;
  const medicalUnderwriting = loadJson("sample-data/private-collections/medical-underwriting.json").docs;
  const premiumPayments = loadJson("sample-data/private-collections/premium-payments.json").docs;
  const regulatoryReports = loadJson("sample-data/private-collections/regulatory-reporting.json").docs;

  for (const doc of policyholderPrivate) {
    parseResult(
      await gateway.storePolicyholderPrivateData(
        insurerUser.email,
        insurerUser.mspId,
        doc.policyID,
        doc.data
      ),
      `Unable to store policyholder private data for ${doc.policyID}`
    );
  }

  for (const doc of medicalUnderwriting) {
    parseResult(
      await gateway.storeMedicalUnderwritingData(
        insurerUser.email,
        insurerUser.mspId,
        doc.policyID,
        doc.data
      ),
      `Unable to store medical underwriting data for ${doc.policyID}`
    );
  }

  for (const doc of premiumPayments) {
    parseResult(
      await gateway.storePremiumPaymentData(
        insurerUser.email,
        insurerUser.mspId,
        doc.policyID,
        doc.data.paymentID,
        doc.data
      ),
      `Unable to store premium payment data for ${doc.policyID}`
    );
  }

  for (const doc of regulatoryReports) {
    parseResult(
      await gateway.storeRegulatoryReport(
        insurerUser.email,
        insurerUser.mspId,
        doc.data.reportID,
        doc.data
      ),
      `Unable to store regulatory report ${doc.data.reportID}`
    );
  }
}

async function seedCessionCollections(gateway) {
  const lenderPortfolio = loadJson("sample-data/private-collections/lender-portfolio.json").docs;
  const disputes = loadJson("sample-data/private-collections/dispute-resolution.json").docs;

  for (const doc of lenderPortfolio) {
    parseResult(
      await gateway.storeLenderPortfolioData(
        lenderUser.email,
        lenderUser.mspId,
        doc.cessionID,
        {
          lenderId: doc.data.lenderID,
          policyId: doc.policyID,
          cessionId: doc.cessionID,
          internalCreditScore: doc.data.internalCreditScore,
          riskAdjustedReturn: doc.data.riskAdjustedReturn,
          expectedDefaultRate: doc.data.expectedDefaultRate,
          collateralBuffer: doc.data.collateralBuffer,
          interestRateApplied: doc.data.interestRateApplied,
          feesStructure: doc.data.feesStructure,
          discountRate: doc.data.discountRate,
          portfolioWeight: doc.data.portfolioWeight,
          correlationScore: doc.data.correlationScore,
          diversificationBenefit: doc.data.diversificationBenefit,
          underwriterNotes: doc.data.underwriterNotes,
          approvalLevel: doc.data.approvalLevel,
          reviewDate: doc.data.reviewDate
        }
      ),
      `Unable to store lender portfolio data for ${doc.cessionID}`
    );
  }

  for (const doc of disputes) {
    parseResult(
      await gateway.storeDisputeData(
        lenderUser.email,
        lenderUser.mspId,
        doc.data.disputeID,
        {
          policyId: doc.policyID,
          cessionId: doc.cessionID,
          initiator: doc.data.initiator,
          respondent: doc.data.respondent,
          disputeType: doc.data.disputeType,
          description: doc.data.description,
          evidenceHashes: doc.data.evidenceHashes,
          status: doc.data.status,
          resolutionDate: doc.data.resolutionDate,
          outcome: doc.data.outcome,
          settlementAmount: doc.data.settlementAmount,
          arbitratorId: doc.data.arbitratorID,
          decision: doc.data.decision,
          appealDeadline: doc.data.appealDeadline
        }
      ),
      `Unable to store dispute data for ${doc.data.disputeID}`
    );
  }
}

async function main() {
  const gateway = new FabricGateway();
  await gateway.initialize();

  console.log("Seeding realistic Namibian public and private sample data...");
  await ensurePolicies(gateway);
  await ensureCessions(gateway);
  await seedPolicyCollections(gateway);
  await seedCessionCollections(gateway);
  console.log("Private data sample seeding complete.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
