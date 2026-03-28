const http = require("http");
const { URL } = require("url");
const FabricGateway = require("./fabric-gateway");

const PORT = 5000;
const CREDIT_LIFE_RATIO = 0.483;
const LENDER_TYPE_BANK = "BANK";
const LENDER_TYPE_MICROLENDER = "MICROLENDER";

const users = [
  {
    id: "usr-1",
    name: "Paula Holder",
    email: "policyholder@cedex.local",
    password: "password123",
    role: "policyholder",
    mspId: "InsurerMSP",
    gatewayIdentity: "policyholder@cedex.local"
  },
  {
    id: "usr-2",
    name: "Bridge Finance Namibia",
    email: "lender@cedex.local",
    password: "password123",
    role: "lender",
    mspId: "LenderMSP",
    gatewayIdentity: "lender@cedex.local"
  },
  {
    id: "usr-3",
    name: "Brian Borrower",
    email: "borrower@cedex.local",
    password: "password123",
    role: "policyholder",
    mspId: "InsurerMSP",
    gatewayIdentity: "policyholder@cedex.local"
  },
  {
    id: "usr-4",
    name: "NamShield Insurance",
    email: "insurer@cedex.local",
    password: "password123",
    role: "policyholder",
    mspId: "InsurerMSP",
    gatewayIdentity: "policyholder@cedex.local"
  }
];

let nextUserId = 5;
const tokens = new Map();

const demoPolicies = [
  {
    policyId: "POL-1001",
    holderName: "Paula Holder",
    holderId: "usr-1",
    insurer: "NamShield Insurance",
    productType: "Life Cover",
    totalValue: 250000,
    deathCover: 150000,
    disabilityCover: 50000,
    criticalIllnessCover: 30000,
    retrenchmentCover: 20000
  },
  {
    policyId: "POL-1002",
    holderName: "Paula Holder",
    holderId: "usr-1",
    insurer: "Savanna Mutual",
    productType: "Education Plan",
    totalValue: 180000,
    deathCover: 100000,
    disabilityCover: 32000,
    criticalIllnessCover: 28000,
    retrenchmentCover: 20000
  },
  {
    policyId: "POL-1003",
    holderName: "Brian Borrower",
    holderId: "usr-3",
    insurer: "NamShield Insurance",
    productType: "Income Protection",
    totalValue: 120000,
    deathCover: 70000,
    disabilityCover: 22000,
    criticalIllnessCover: 15000,
    retrenchmentCover: 13000
  },
  {
    policyId: "POL-1004",
    holderName: "Paula Holder",
    holderId: "usr-1",
    insurer: "Savanna Mutual",
    productType: "Whole Life",
    totalValue: 300000,
    deathCover: 180000,
    disabilityCover: 60000,
    criticalIllnessCover: 35000,
    retrenchmentCover: 25000
  }
];

const demoCessions = [
  {
    cessionId: "CES-5001",
    policyId: "POL-1001",
    loanId: "LOAN-5001",
    lenderId: "usr-2",
    borrowerId: "usr-1",
    cedent: "Paula Holder",
    cessionary: "Bridge Finance Namibia",
    amount: 75000
  },
  {
    cessionId: "CES-5002",
    policyId: "POL-1002",
    loanId: "LOAN-5002",
    lenderId: "external-lender-1",
    borrowerId: "usr-1",
    cedent: "Paula Holder",
    cessionary: "Bridge Finance",
    amount: 60000
  },
  {
    cessionId: "CES-5003",
    policyId: "POL-1003",
    loanId: "LOAN-5003",
    lenderId: "usr-2",
    borrowerId: "usr-3",
    cedent: "Brian Borrower",
    cessionary: "Bridge Finance Namibia",
    amount: 35000
  },
  {
    cessionId: "CES-5004",
    policyId: "POL-1004",
    loanId: "LOAN-5004",
    lenderId: "usr-2",
    borrowerId: "usr-1",
    cedent: "Paula Holder",
    cessionary: "Bridge Finance Namibia",
    amount: 50000
  }
];

const demoPrivateProfiles = {
  borrower: {
    login: {
      email: "borrower@cedex.local",
      password: "password123"
    },
    linkedPolicyId: "POL-1003",
    policyholderPrivateData: {
      idNumber: "90010100123",
      passportNumber: "N1234567",
      dateOfBirth: "1990-01-01",
      physicalAddress: "Erf 120, Khomasdal, Windhoek",
      emailAddress: "borrower@cedex.local",
      phoneNumber: "+264811234567",
      bankAccount: "****3456",
      taxId: "NAM-TAX-7788",
      creditScore: 642,
      incomeLevel: "Middle",
      employerName: "NamBuild Logistics",
      employmentStatus: "Permanent",
      yearsEmployed: 6,
      monthlyIncome: 28500,
      dependents: 2,
      maritalStatus: "Married"
    }
  },
  insurer: {
    login: {
      email: "insurer@cedex.local",
      password: "password123"
    },
    linkedPolicyId: "POL-1001",
    medicalUnderwritingData: {
      policyholderId: "usr-1",
      preExistingConditions: ["None"],
      currentMedications: [],
      smokingStatus: "Non-Smoker",
      alcoholConsumption: "Moderate",
      bmi: 24.1,
      underwritingClass: "Standard",
      mortalityRating: 105,
      riskScore: 0.22,
      lastMedicalExam: "2026-01-10",
      examResultsHash: "MED-HASH-POL-1001",
      attendingPhysician: "Dr. J. Kandjii",
      consentDate: "2026-01-11",
      consentExpiry: "2027-01-11"
    }
  },
  lender: {
    login: {
      email: "lender@cedex.local",
      password: "password123"
    },
    linkedCessionId: "CES-5001",
    lenderPortfolioData: {
      lenderId: "usr-2",
      policyId: "POL-1001",
      cessionId: "CES-5001",
      internalCreditScore: 688,
      riskAdjustedReturn: 0.19,
      expectedDefaultRate: 0.04,
      collateralBuffer: 0.23,
      interestRateApplied: 24.0,
      feesStructure: "Origination 2%, Service 1%",
      discountRate: 0.08,
      portfolioWeight: 0.17,
      correlationScore: 0.31,
      diversificationBenefit: 0.41,
      underwriterNotes: "Demonstration profile for lender private collection",
      approvalLevel: "SeniorCreditOfficer",
      reviewDate: "2026-03-20"
    }
  }
};

let fabricGateway = null;

function buildDemoPrivateProfileResponse() {
  return {
    message: "Demo credentials and private-data profiles",
    profiles: [
      {
        actor: "borrower",
        collection: "PolicyholderPrivate",
        login: demoPrivateProfiles.borrower.login,
        linkedPolicyId: demoPrivateProfiles.borrower.linkedPolicyId,
        profile: demoPrivateProfiles.borrower.policyholderPrivateData
      },
      {
        actor: "insurer",
        collection: "MedicalUnderwriting",
        login: demoPrivateProfiles.insurer.login,
        linkedPolicyId: demoPrivateProfiles.insurer.linkedPolicyId,
        profile: demoPrivateProfiles.insurer.medicalUnderwritingData
      },
      {
        actor: "lender",
        collection: "LenderPortfolio",
        login: demoPrivateProfiles.lender.login,
        linkedCessionId: demoPrivateProfiles.lender.linkedCessionId,
        profile: demoPrivateProfiles.lender.lenderPortfolioData
      }
    ]
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { message: "Route not found" });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token || !tokens.has(token)) return null;

  const userId = tokens.get(token);
  return users.find((entry) => entry.id === userId) || null;
}

function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    sendJson(res, 401, { message: "Unauthorized" });
    return null;
  }
  return user;
}

function requireRole(res, user, ...roles) {
  if (!user || roles.includes(user.role)) {
    return true;
  }

  sendJson(res, 403, { message: "Forbidden" });
  return false;
}

function ensureGateway() {
  if (!fabricGateway) {
    throw new Error("Fabric gateway is unavailable");
  }
}

function createToken(user) {
  const token = `token-${user.id}-${Date.now()}`;
  tokens.set(token, user.id);
  return token;
}

function isInsurerPersona(user) {
  return String(user?.email || "").toLowerCase() === "insurer@cedex.local";
}

function getFabricIdentity(user) {
  if (user?.gatewayIdentity) {
    return user.gatewayIdentity;
  }

  return user?.role === "lender" ? "lender@cedex.local" : "policyholder@cedex.local";
}

function routeMatch(pathname, pattern) {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
      continue;
    }

    if (patternPart !== pathPart) return null;
  }

  return params;
}

function parseFabricResult(result) {
  if (!result || !result.success) return null;
  if (result.result === "") {
    return [];
  }

  try {
    return JSON.parse(result.result);
  } catch (error) {
    return result.result;
  }
}

function normalizePolicy(policy) {
  const normalizedHolderName =
    policy.holderName === "Irene Insurer" ? "Irene Paulus" : policy.holderName;

  return {
    ...policy,
    holderName: normalizedHolderName,
    totalValue: Number(policy.totalValue || 0),
    availableValue: Number(policy.availableValue || 0),
    cededValue: Number(policy.cededValue || 0),
    deathCover: Number(policy.deathCover || 0),
    disabilityCover: Number(policy.disabilityCover || 0),
    criticalIllnessCover: Number(policy.criticalIllnessCover || 0),
    retrenchmentCover: Number(policy.retrenchmentCover || 0)
  };
}

function normalizeCession(cession) {
  const normalizedCedent = cession.cedent === "Irene Insurer" ? "Irene Paulus" : cession.cedent;
  const normalizedCessionary =
    cession.cessionary === "Leon Lender" ? "Bridge Finance Namibia" : cession.cessionary;

  return {
    ...cession,
    cedent: normalizedCedent,
    cessionary: normalizedCessionary,
    amount: Number(cession.amount || 0),
    amountCents: Number(cession.amountCents || 0),
    loanAmount: Number(cession.loanAmount || 0),
    loanAmountCents: Number(cession.loanAmountCents || 0),
    lifeCoverPortion: Number(cession.lifeCoverPortion || 0),
    lifeCoverPortionCents: Number(cession.lifeCoverPortionCents || 0),
    retrenchmentPortion: Number(cession.retrenchmentPortion || 0),
    retrenchmentPortionCents: Number(cession.retrenchmentPortionCents || 0),
    requiredCoverageBps: Number(cession.requiredCoverageBps || 0),
    monthlyPayment: Number(cession.monthlyPayment || 0),
    monthlyPaymentCents: Number(cession.monthlyPaymentCents || 0)
  };
}

function normalizeLender(lender) {
  return {
    ...lender,
    maxLoanAmountCents: Number(lender.maxLoanAmountCents || 0),
    minLoanAmountCents: Number(lender.minLoanAmountCents || 0),
    lendingPolicies: lender.lendingPolicies || {}
  };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function requireObjectPayload(payload, fallbackMessage) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(fallbackMessage);
  }

  return payload;
}

async function getPoliciesForUser(user) {
  ensureGateway();
  const result = await fabricGateway.queryAllPolicies(getFabricIdentity(user), user.mspId);
  const parsed = parseFabricResult(result);

  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric policy query failed");
  }

  const policies = parsed.map(normalizePolicy);
  if (user.role === "lender") {
    return policies;
  }
  if (isInsurerPersona(user)) {
    return policies.filter(
      (policy) => String(policy.insurer || "").toLowerCase() === String(user.name || "").toLowerCase()
    );
  }

  return policies.filter(
    (policy) => policy.holderId === user.id || policy.holderName === user.name
  );
}

async function getAvailablePoliciesForUser(user) {
  ensureGateway();
  const result = await fabricGateway.queryAvailableCollateral(getFabricIdentity(user), user.mspId);
  const parsed = parseFabricResult(result);

  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric available collateral query failed");
  }

  const policies = parsed.map(normalizePolicy);
  if (user.role === "lender") {
    return policies;
  }
  if (isInsurerPersona(user)) {
    return policies.filter(
      (policy) => String(policy.insurer || "").toLowerCase() === String(user.name || "").toLowerCase()
    );
  }

  return policies.filter(
    (policy) => policy.holderId === user.id || policy.holderName === user.name
  );
}

async function getPolicyForUser(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryPolicy(getFabricIdentity(user), user.mspId, policyId);
  const parsed = parseFabricResult(result);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return normalizePolicy(parsed);
  }

  const errorMessage = String(result?.error || "");
  if (errorMessage.toLowerCase().includes("does not exist")) {
    return null;
  }

  throw new Error(errorMessage || "Fabric policy query failed");
}

function buildPolicyPayload(user, body) {
  const totalValue = Number(body.totalValue || 0);
  const insurerName = body.insurer || (isInsurerPersona(user) ? user.name : "Cedex Mutual");
  const holderName = body.holderName || (isInsurerPersona(user) ? "" : user.name);

  return {
    policyId: body.policyId || `POL-${Date.now()}`,
    holderName,
    holderId: body.holderId || user.id,
    insurer: insurerName,
    productType: body.productType || "General Cover",
    totalValue,
    deathCover: Number(body.deathCover ?? round2(totalValue * 0.55)),
    disabilityCover: Number(body.disabilityCover ?? round2(totalValue * 0.2)),
    criticalIllnessCover: Number(body.criticalIllnessCover ?? round2(totalValue * 0.15)),
    retrenchmentCover: Number(body.retrenchmentCover ?? round2(totalValue * 0.1)),
    status: body.status || "active"
  };
}

async function createPolicyForUser(user, body) {
  ensureGateway();
  if (isInsurerPersona(user) && !body.holderName) {
    throw new Error("holderName is required for insurer-created policies and must be a natural person");
  }
  const policy = buildPolicyPayload(user, body);

  const result = await fabricGateway.createPolicy(
    getFabricIdentity(user),
    user.mspId,
    JSON.stringify(policy)
  );

  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric policy registration failed");
  }

  return normalizePolicy(parsed);
}

async function getCessionsForUser(user) {
  ensureGateway();
  const result = await fabricGateway.queryAllCessions(getFabricIdentity(user), user.mspId);
  const parsed = parseFabricResult(result);

  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric cession query failed");
  }

  const cessions = parsed.map(normalizeCession);
  if (user.role === "lender") {
    return cessions;
  }
  if (isInsurerPersona(user)) {
    const insurerPolicies = await getPoliciesForUser(user);
    const insurerPolicyIDs = new Set(insurerPolicies.map((policy) => policy.policyId));
    return cessions.filter((cession) => insurerPolicyIDs.has(cession.policyId));
  }

  return cessions.filter(
    (cession) => cession.borrowerId === user.id || cession.cedent === user.name
  );
}

async function getActiveCessionsForUser(user) {
  const cessions = await getCessionsForUser(user);
  return cessions.filter((cession) => cession.status === "active");
}

async function getCessionsByPolicy(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryCessionsByPolicy(getFabricIdentity(user), user.mspId, policyId);
  const parsed = parseFabricResult(result);

  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric cession query failed");
  }

  return parsed
    .map(normalizeCession)
    .sort((a, b) => a.priorityRank - b.priorityRank);
}

async function getPriorityCessionsByPolicy(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryCessionsByPriority(getFabricIdentity(user), user.mspId, policyId);
  const parsed = parseFabricResult(result);

  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric priority cession query failed");
  }

  return parsed
    .map(normalizeCession)
    .sort((a, b) => a.priorityRank - b.priorityRank);
}

async function calculateCollateralForUser(user, policyId, loanAmount) {
  ensureGateway();
  const result = await fabricGateway.calculateAvailableCollateral(
    getFabricIdentity(user),
    user.mspId,
    policyId,
    loanAmount
  );
  const parsed = parseFabricResult(result);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric collateral calculation failed");
  }

  return parsed;
}

async function getPolicyCollateralStatusForUser(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryPolicyCollateralStatus(
    getFabricIdentity(user),
    user.mspId,
    policyId
  );
  const parsed = parseFabricResult(result);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric collateral status query failed");
  }

  return parsed;
}

async function getAvailableCapacityForUser(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryAvailableCapacity(
    getFabricIdentity(user),
    user.mspId,
    policyId
  );
  const parsed = parseFabricResult(result);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric available capacity query failed");
  }

  return parsed;
}

function buildLenderProfilePayload(type, body) {
  const lenderType = String(type || "").toUpperCase();
  const base = {
    lenderId: body.lenderId || `${lenderType}-${Date.now()}`,
    lenderType,
    name: body.name,
    registrationNumber: body.registrationNumber,
    namfisaLicense: body.namfisaLicense || `NAM-${Date.now()}`,
    riskProfile: body.riskProfile || (lenderType === LENDER_TYPE_BANK ? "Conservative" : "Moderate"),
    active: true,
    lendingPolicies: body.lendingPolicies || {}
  };

  if (lenderType === LENDER_TYPE_BANK) {
    return {
      ...base,
      bankOfNamibiaReg: body.bankOfNamibiaReg || `BON-${Date.now()}`,
      bankCode: body.bankCode,
      swiftCode: body.swiftCode || "",
      isCommercialBank: Boolean(body.isCommercialBank),
      lendingPolicies: {
        maxLtvBps: 6500,
        minCreditScore: 650,
        baseRateBps: 1250,
        riskPremiumBps: 250,
        effectiveRateBps: 1500,
        minTermMonths: 12,
        maxTermMonths: 240,
        requiredCoverageBps: 3500,
        accepts80_20: true,
        ...base.lendingPolicies
      }
    };
  }

  return {
    ...base,
    microlenderLicense: body.microlenderLicense || body.registrationNumber,
    maxLoanAmountCents: Number(body.maxLoanAmountCents || 5000000),
    minLoanAmountCents: Number(body.minLoanAmountCents || 100000),
    targetMarket: body.targetMarket || "General",
    lendingPolicies: {
      maxLtvBps: 8500,
      minCreditScore: 500,
      baseRateBps: 1850,
      riskPremiumBps: 550,
      effectiveRateBps: 2400,
      minTermMonths: 1,
      maxTermMonths: 36,
      requiredCoverageBps: 4830,
      accepts80_20: true,
      ...base.lendingPolicies
    }
  };
}

async function registerLenderForUser(user, lenderType, body) {
  ensureGateway();
  if (!body.name || !body.registrationNumber) {
    throw new Error("name and registrationNumber are required");
  }

  const payload = buildLenderProfilePayload(lenderType, body);
  const result = await fabricGateway.registerLender(getFabricIdentity(user), user.mspId, JSON.stringify(payload));
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric lender registration failed");
  }
  return normalizeLender(parsed);
}

async function getLendersByTypeForUser(user, lenderType) {
  ensureGateway();
  const result = await fabricGateway.queryLendersByType(getFabricIdentity(user), user.mspId, lenderType);
  const parsed = parseFabricResult(result);
  if (!Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric lender query failed");
  }
  return parsed.map(normalizeLender).filter((entry) => entry.active);
}

async function getRecommendedLenderForUser(user, loanAmount) {
  const borrowerCreditScore = Number(user.creditScore || 600);
  let recommendedType = LENDER_TYPE_MICROLENDER;
  let reason = "";

  if (loanAmount >= 50000 && borrowerCreditScore >= 650) {
    recommendedType = LENDER_TYPE_BANK;
    reason = "Large loan with stronger credit profile can qualify for lower bank rates.";
  } else if (loanAmount < 50000) {
    recommendedType = LENDER_TYPE_MICROLENDER;
    reason = "Smaller loans are typically faster through microlenders.";
  } else {
    recommendedType = LENDER_TYPE_MICROLENDER;
    reason = "Credit profile is below typical bank thresholds.";
  }

  const lenders = await getLendersByTypeForUser(user, recommendedType);
  return {
    recommendedLenderType: recommendedType,
    reason,
    lenders: lenders.slice(0, 3)
  };
}

async function createCessionForUser(user, body) {
  ensureGateway();
  if (user.role !== "lender") {
    throw new Error("Only lenders can request cessions");
  }

  const policy = await getPolicyForUser(user, body.policyId);
  if (!policy) {
    throw new Error("Policy not found");
  }

  const cessionPayload = {
    cessionId: body.cessionId || `CES-${Date.now()}`,
    policyId: body.policyId,
    loanId: body.loanId || `LOAN-${Date.now()}`,
    lenderId: body.lenderId || (user.role === "lender" ? user.id : body.lenderId),
    lenderName: body.lenderName || (user.role === "lender" ? user.name : ""),
    lenderType: body.lenderType,
    borrowerId: body.borrowerId || policy.holderId || user.id,
    borrowerName: body.borrowerName || policy.holderName,
    cedent: body.cedent || policy.holderName,
    cessionary: body.cessionary || user.name,
    loanAmount: Number(body.loanAmount || 0),
    amount: Number(body.amount || 0),
    startDate: body.startDate || todayDate(),
    endDate: ""
  };

  const result = await fabricGateway.requestCessionApproval(
    getFabricIdentity(user),
    user.mspId,
    JSON.stringify(cessionPayload)
  );
  const parsed = parseFabricResult(result);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Fabric cession request failed");
  }

  return normalizeCession(parsed);
}

async function createTokenizedCessionForUser(user, body) {
  const loanAmount = Number(body.loanAmount || 0);
  if (loanAmount <= 0) {
    throw new Error("loanAmount must be positive");
  }

  const calculation = await calculateCollateralForUser(user, body.policyId, loanAmount);
  if (!calculation.eligible) {
    return {
      success: false,
      message: calculation.message,
      calculation
    };
  }

  const created = await createCessionForUser(user, {
    ...body,
    loanAmount,
    amount: calculation.creditLifeRequired,
    lenderId: body.lenderId || user.id,
    cessionary: body.cessionary || user.name
  });

  return {
    success: true,
    message: `Cession request submitted with 80/20 computation (N$${Number(
      calculation.lifeCoverPortion
    ).toLocaleString()} policy-backed). Await borrower consent and insurer approval.`,
    calculation,
    savings: calculation.savings,
    requestedCession: created
  };
}

async function borrowerConsentCessionForUser(user, cessionId) {
  ensureGateway();
  if (user.role !== "policyholder") {
    throw new Error("Only borrower/policyholder users can consent");
  }

  const result = await fabricGateway.borrowerConsentCession(
    getFabricIdentity(user),
    user.mspId,
    cessionId
  );
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Borrower consent failed");
  }
  return normalizeCession(parsed);
}

async function insurerApproveCessionForUser(user, cessionId) {
  ensureGateway();
  if (!isInsurerPersona(user)) {
    throw new Error("Only insurer persona can approve cessions");
  }

  const result = await fabricGateway.insurerApproveCession(
    getFabricIdentity(user),
    user.mspId,
    cessionId
  );
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Insurer approval failed");
  }
  return normalizeCession(parsed);
}

async function activateApprovedCessionForUser(user, cessionId) {
  ensureGateway();
  if (user.role !== "lender") {
    throw new Error("Only lenders can activate approved cessions");
  }

  const result = await fabricGateway.activateApprovedCession(
    getFabricIdentity(user),
    user.mspId,
    cessionId
  );
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Activation failed");
  }
  return normalizeCession(parsed);
}

async function requestReleaseFromBorrowerForUser(user, cessionId) {
  ensureGateway();
  if (user.role !== "policyholder" || isInsurerPersona(user)) {
    throw new Error("Only borrower persona can request cession release");
  }

  const result = await fabricGateway.requestReleaseFromBorrower(
    getFabricIdentity(user),
    user.mspId,
    cessionId
  );
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Borrower release request failed");
  }
  return normalizeCession(parsed);
}

async function lenderApproveReleaseAndNotifyInsurerForUser(user, cessionId) {
  ensureGateway();
  if (user.role !== "lender") {
    throw new Error("Only lenders can approve release requests");
  }

  const result = await fabricGateway.lenderApproveReleaseAndNotifyInsurer(
    getFabricIdentity(user),
    user.mspId,
    cessionId
  );
  const parsed = parseFabricResult(result);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(result?.error || "Lender release approval failed");
  }
  return normalizeCession(parsed);
}

async function releaseCessionForUser(user, cessionId) {
  ensureGateway();
  if (!isInsurerPersona(user)) {
    throw new Error("Only insurer persona can finalize release");
  }

  const result = await fabricGateway.releaseCession(getFabricIdentity(user), user.mspId, cessionId);
  const parsed = parseFabricResult(result);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return {
      message: "Cession released successfully",
      source: "fabric",
      cession: normalizeCession(parsed)
    };
  }

  const errorMessage = String(result?.error || "");
  if (errorMessage.toLowerCase().includes("does not exist")) {
    return null;
  }
  if (errorMessage.toLowerCase().includes("already released")) {
    return { message: "Cession already released", source: "fabric" };
  }

  throw new Error(errorMessage || "Fabric cession release failed");
}

async function storePolicyholderPrivateDataForUser(user, policyId, body) {
  ensureGateway();
  const result = await fabricGateway.storePolicyholderPrivateData(getFabricIdentity(user), user.mspId, policyId, body);
  if (!result.success) {
    throw new Error(result.error || "Unable to store policyholder private data");
  }

  const hash = await fabricGateway.queryPolicyPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "PolicyholderPrivate",
    policyId
  );

  return {
    message: "Policyholder private data stored",
    policyId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryPolicyholderPrivateDataForUser(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryPolicyholderPrivateData(getFabricIdentity(user), user.mspId, policyId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query policyholder private data");
}

async function storeMedicalUnderwritingDataForUser(user, policyId, body) {
  ensureGateway();
  const result = await fabricGateway.storeMedicalUnderwritingData(getFabricIdentity(user), user.mspId, policyId, body);
  if (!result.success) {
    throw new Error(result.error || "Unable to store medical underwriting data");
  }

  const hash = await fabricGateway.queryPolicyPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "MedicalUnderwriting",
    policyId
  );

  return {
    message: "Medical underwriting data stored",
    policyId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryMedicalUnderwritingDataForUser(user, policyId) {
  ensureGateway();
  const result = await fabricGateway.queryMedicalUnderwritingData(getFabricIdentity(user), user.mspId, policyId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query medical underwriting data");
}

async function storePremiumPaymentDataForUser(user, policyId, paymentId, body) {
  ensureGateway();
  const result = await fabricGateway.storePremiumPaymentData(
    getFabricIdentity(user),
    user.mspId,
    policyId,
    paymentId,
    body
  );
  if (!result.success) {
    throw new Error(result.error || "Unable to store premium payment data");
  }

  const hash = await fabricGateway.queryPolicyPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "PremiumPaymentPrivate",
    `${policyId}::${paymentId}`
  );

  return {
    message: "Premium payment data stored",
    policyId,
    paymentId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryPremiumPaymentDataForUser(user, policyId, paymentId) {
  ensureGateway();
  const result = await fabricGateway.queryPremiumPaymentData(getFabricIdentity(user), user.mspId, policyId, paymentId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query premium payment data");
}

async function storeRegulatoryReportForUser(user, reportId, body) {
  ensureGateway();
  const result = await fabricGateway.storeRegulatoryReport(getFabricIdentity(user), user.mspId, reportId, body);
  if (!result.success) {
    throw new Error(result.error || "Unable to store regulatory report");
  }

  const hash = await fabricGateway.queryPolicyPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "RegulatoryReporting",
    reportId
  );

  return {
    message: "Regulatory report stored",
    reportId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryRegulatoryReportForUser(user, reportId) {
  ensureGateway();
  const result = await fabricGateway.queryRegulatoryReport(getFabricIdentity(user), user.mspId, reportId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query regulatory report");
}

async function storeLenderPortfolioDataForUser(user, cessionId, body) {
  ensureGateway();
  const result = await fabricGateway.storeLenderPortfolioData(getFabricIdentity(user), user.mspId, cessionId, body);
  if (!result.success) {
    throw new Error(result.error || "Unable to store lender portfolio data");
  }

  const hash = await fabricGateway.queryCessionPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "LenderPortfolio",
    cessionId
  );

  return {
    message: "Lender portfolio data stored",
    cessionId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryLenderPortfolioDataForUser(user, cessionId) {
  ensureGateway();
  const result = await fabricGateway.queryLenderPortfolioData(getFabricIdentity(user), user.mspId, cessionId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query lender portfolio data");
}

async function storeDisputeDataForUser(user, disputeId, body) {
  ensureGateway();
  const result = await fabricGateway.storeDisputeData(getFabricIdentity(user), user.mspId, disputeId, body);
  if (!result.success) {
    throw new Error(result.error || "Unable to store dispute data");
  }

  const hash = await fabricGateway.queryCessionPrivateDataHash(
    getFabricIdentity(user),
    user.mspId,
    "DisputeResolution",
    disputeId
  );

  return {
    message: "Dispute data stored",
    disputeId,
    dataHash: hash.success ? hash.result : null
  };
}

async function queryDisputeDataForUser(user, disputeId) {
  ensureGateway();
  const result = await fabricGateway.queryDisputeData(getFabricIdentity(user), user.mspId, disputeId);
  return requireObjectPayload(parseFabricResult(result), result?.error || "Unable to query dispute data");
}

async function ensureDemoData() {
  const policyUser = users.find((entry) => entry.email === "policyholder@cedex.local");
  const lenderUser = users.find((entry) => entry.email === "lender@cedex.local");

  if (!policyUser || !lenderUser) {
    return;
  }

  const existingPoliciesResult = await fabricGateway.queryAllPolicies(
    policyUser.email,
    policyUser.mspId
  );
  const existingPolicies = parseFabricResult(existingPoliciesResult);
  if (!Array.isArray(existingPolicies)) {
    throw new Error(existingPoliciesResult?.error || "Unable to query policies during demo seed");
  }

  const existingPolicyIds = new Set(existingPolicies.map((policy) => policy.policyId));
  for (const policy of demoPolicies) {
    if (existingPolicyIds.has(policy.policyId)) {
      continue;
    }

    const result = await fabricGateway.createPolicy(
      policyUser.email,
      policyUser.mspId,
      JSON.stringify(policy)
    );
    if (!result.success) {
      throw new Error(result.error || `Unable to seed policy ${policy.policyId}`);
    }
  }

  const existingCessionsResult = await fabricGateway.queryAllCessions(
    policyUser.email,
    policyUser.mspId
  );
  const existingCessions = parseFabricResult(existingCessionsResult);
  if (!Array.isArray(existingCessions)) {
    throw new Error(existingCessionsResult?.error || "Unable to query cessions during demo seed");
  }

  const existingCessionIds = new Set(existingCessions.map((cession) => cession.cessionId));
  for (const cession of demoCessions) {
    if (existingCessionIds.has(cession.cessionId)) {
      continue;
    }

    const result = await fabricGateway.requestCessionApproval(
      lenderUser.email,
      lenderUser.mspId,
      JSON.stringify({
        ...cession,
        startDate: todayDate(),
        endDate: ""
      })
    );
    if (!result.success) {
      throw new Error(result.error || `Unable to seed cession ${cession.cessionId}`);
    }

    await fabricGateway.borrowerConsentCession(policyUser.email, policyUser.mspId, cession.cessionId);
    await fabricGateway.insurerApproveCession(policyUser.email, policyUser.mspId, cession.cessionId);
    await fabricGateway.activateApprovedCession(lenderUser.email, lenderUser.mspId, cession.cessionId);
  }

  try {
    await ensureDemoPrivateProfiles();
  } catch (error) {
    console.warn(`Demo private-profile seed skipped: ${error.message}`);
  }
}

async function ensureDemoPrivateProfiles() {
  const borrowerUser = users.find((entry) => entry.email === demoPrivateProfiles.borrower.login.email);
  const insurerUser = users.find((entry) => entry.email === demoPrivateProfiles.insurer.login.email);
  const lenderUser = users.find((entry) => entry.email === demoPrivateProfiles.lender.login.email);

  if (!borrowerUser || !insurerUser || !lenderUser) {
    return;
  }

  const seedSteps = [
    {
      label: "PolicyholderPrivate",
      run: () =>
        storePolicyholderPrivateDataForUser(
          borrowerUser,
          demoPrivateProfiles.borrower.linkedPolicyId,
          demoPrivateProfiles.borrower.policyholderPrivateData
        )
    },
    {
      label: "MedicalUnderwriting",
      run: () =>
        storeMedicalUnderwritingDataForUser(
          insurerUser,
          demoPrivateProfiles.insurer.linkedPolicyId,
          demoPrivateProfiles.insurer.medicalUnderwritingData
        )
    },
    {
      label: "LenderPortfolio",
      run: () =>
        storeLenderPortfolioDataForUser(
          lenderUser,
          demoPrivateProfiles.lender.linkedCessionId,
          demoPrivateProfiles.lender.lenderPortfolioData
        )
    }
  ];

  for (const step of seedSteps) {
    try {
      await step.run();
    } catch (error) {
      console.warn(`Unable to seed ${step.label}: ${error.message}`);
    }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = requestUrl;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        fabric: fabricGateway ? "initialized" : "unavailable",
        fallbackData: false
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/demo/private-profiles") {
      sendJson(res, 200, buildDemoPrivateProfileResponse());
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
      const body = await parseBody(req);
      const { name, email, password, role = "policyholder" } = body;

      if (!name || !email || !password) {
        sendJson(res, 400, { message: "Name, email, and password are required" });
        return;
      }

      if (users.some((user) => user.email.toLowerCase() === String(email).toLowerCase())) {
        sendJson(res, 409, { message: "A user with that email already exists" });
        return;
      }

      const newUser = {
        id: `usr-${nextUserId++}`,
        name,
        email,
        password,
        role,
        mspId: role === "policyholder" ? "InsurerMSP" : "LenderMSP",
        gatewayIdentity:
          role === "policyholder" ? "policyholder@cedex.local" : "lender@cedex.local"
      };

      users.push(newUser);
      sendJson(res, 201, sanitizeUser(newUser));
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const user = users.find(
        (entry) =>
          entry.email.toLowerCase() === String(body.email || "").toLowerCase() &&
          entry.password === body.password
      );

      if (!user) {
        sendJson(res, 401, { message: "Invalid email or password" });
        return;
      }

      const token = createToken(user);
      sendJson(res, 200, { token, user: sanitizeUser(user) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/auth/profile") {
      const user = requireAuth(req, res);
      if (!user) return;

      sendJson(res, 200, sanitizeUser(user));
      return;
    }

    if (req.method === "POST" && pathname === "/api/lenders/register/bank") {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "lender")) return;

      const body = await parseBody(req);
      const lender = await registerLenderForUser(user, LENDER_TYPE_BANK, body);
      sendJson(res, 201, lender);
      return;
    }

    if (req.method === "POST" && pathname === "/api/lenders/register/microlender") {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "lender")) return;

      const body = await parseBody(req);
      const lender = await registerLenderForUser(user, LENDER_TYPE_MICROLENDER, body);
      sendJson(res, 201, lender);
      return;
    }

    if (req.method === "GET" && pathname === "/api/lenders/banks") {
      const user = requireAuth(req, res);
      if (!user) return;

      const lenders = await getLendersByTypeForUser(user, LENDER_TYPE_BANK);
      sendJson(res, 200, lenders);
      return;
    }

    if (req.method === "GET" && pathname === "/api/lenders/microlenders") {
      const user = requireAuth(req, res);
      if (!user) return;

      const lenders = await getLendersByTypeForUser(user, LENDER_TYPE_MICROLENDER);
      sendJson(res, 200, lenders);
      return;
    }

    const recommendedLenderParams = routeMatch(pathname, "/api/loans/:loanAmount/recommended-lender");
    if (req.method === "GET" && recommendedLenderParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const loanAmount = Number(recommendedLenderParams.loanAmount || 0);
      if (loanAmount <= 0) {
        sendJson(res, 400, { message: "loanAmount must be positive" });
        return;
      }

      const recommendation = await getRecommendedLenderForUser(user, loanAmount);
      sendJson(res, 200, recommendation);
      return;
    }

    if (req.method === "GET" && pathname === "/api/policies") {
      const user = requireAuth(req, res);
      if (!user) return;

      const policies = await getPoliciesForUser(user);
      sendJson(res, 200, policies);
      return;
    }

    if (req.method === "GET" && pathname === "/api/policies/available") {
      const user = requireAuth(req, res);
      if (!user) return;

      const policies = await getAvailablePoliciesForUser(user);
      sendJson(res, 200, policies);
      return;
    }

    const collateralCalcParams = routeMatch(pathname, "/api/policies/:policyId/calculate-collateral");
    if (req.method === "POST" && collateralCalcParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseBody(req);
      const calculation = await calculateCollateralForUser(
        user,
        collateralCalcParams.policyId,
        Number(body.loanAmount || 0)
      );
      sendJson(res, 200, calculation);
      return;
    }

    const collateralStatusParams = routeMatch(pathname, "/api/policies/:policyId/collateral-status");
    if (req.method === "GET" && collateralStatusParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const status = await getPolicyCollateralStatusForUser(user, collateralStatusParams.policyId);
      sendJson(res, 200, status);
      return;
    }

    const policyholderPrivateParams = routeMatch(pathname, "/api/policies/:policyId/private/policyholder");
    if (policyholderPrivateParams) {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "policyholder")) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storePolicyholderPrivateDataForUser(user, policyholderPrivateParams.policyId, body);
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryPolicyholderPrivateDataForUser(user, policyholderPrivateParams.policyId);
        sendJson(res, 200, result);
        return;
      }
    }

    const medicalPrivateParams = routeMatch(pathname, "/api/policies/:policyId/private/medical");
    if (medicalPrivateParams) {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "policyholder")) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storeMedicalUnderwritingDataForUser(user, medicalPrivateParams.policyId, body);
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryMedicalUnderwritingDataForUser(user, medicalPrivateParams.policyId);
        sendJson(res, 200, result);
        return;
      }
    }

    const premiumPrivateParams = routeMatch(pathname, "/api/policies/:policyId/private/premium/:paymentId");
    if (premiumPrivateParams) {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "policyholder")) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storePremiumPaymentDataForUser(
          user,
          premiumPrivateParams.policyId,
          premiumPrivateParams.paymentId,
          body
        );
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryPremiumPaymentDataForUser(
          user,
          premiumPrivateParams.policyId,
          premiumPrivateParams.paymentId
        );
        sendJson(res, 200, result);
        return;
      }
    }

    const regulatoryParams = routeMatch(pathname, "/api/regulatory/reports/:reportId");
    if (regulatoryParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storeRegulatoryReportForUser(user, regulatoryParams.reportId, body);
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryRegulatoryReportForUser(user, regulatoryParams.reportId);
        sendJson(res, 200, result);
        return;
      }
    }

    const capacityParams = routeMatch(pathname, "/api/policies/:policyId/available-capacity");
    if (req.method === "GET" && capacityParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const capacity = await getAvailableCapacityForUser(user, capacityParams.policyId);
      sendJson(res, 200, capacity);
      return;
    }

    const policyParams = routeMatch(pathname, "/api/policies/:policyId");
    if (req.method === "GET" && policyParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const policy = await getPolicyForUser(user, policyParams.policyId);
      if (!policy) {
        sendJson(res, 404, { message: "Policy not found" });
        return;
      }

      sendJson(res, 200, policy);
      return;
    }

    if (req.method === "POST" && pathname === "/api/policies") {
      const user = requireAuth(req, res);
      if (!user) return;

      const body = await parseBody(req);
      const policy = await createPolicyForUser(user, body);
      sendJson(res, 201, policy);
      return;
    }

    if (req.method === "GET" && pathname === "/api/cessions") {
      const user = requireAuth(req, res);
      if (!user) return;

      const cessions = await getCessionsForUser(user);
      sendJson(res, 200, cessions);
      return;
    }

    if (req.method === "GET" && pathname === "/api/cessions/active") {
      const user = requireAuth(req, res);
      if (!user) return;

      const cessions = await getActiveCessionsForUser(user);
      sendJson(res, 200, cessions);
      return;
    }

    const policyCessionParams = routeMatch(pathname, "/api/cessions/policy/:policyId");
    if (req.method === "GET" && policyCessionParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const cessions = await getCessionsByPolicy(user, policyCessionParams.policyId);
      sendJson(res, 200, cessions);
      return;
    }

    const priorityCessionParams = routeMatch(pathname, "/api/cessions/policy/:policyId/priority");
    if (req.method === "GET" && priorityCessionParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const cessions = await getPriorityCessionsByPolicy(user, priorityCessionParams.policyId);
      sendJson(res, 200, cessions);
      return;
    }

    if (req.method === "POST" && pathname === "/api/cessions/tokenized") {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "lender")) return;

      const body = await parseBody(req);
      const result = await createTokenizedCessionForUser(user, body);
      sendJson(res, result.success ? 201 : 400, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/cessions") {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "lender")) return;

      const body = await parseBody(req);
      const cession = await createCessionForUser(user, body);
      sendJson(res, 201, cession);
      return;
    }

    const consentParams = routeMatch(pathname, "/api/cessions/:cessionId/consent");
    if (req.method === "POST" && consentParams) {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "policyholder")) return;

      const cession = await borrowerConsentCessionForUser(user, consentParams.cessionId);
      sendJson(res, 200, {
        message: "Borrower consent recorded",
        cession
      });
      return;
    }

    const approveParams = routeMatch(pathname, "/api/cessions/:cessionId/approve");
    if (req.method === "POST" && approveParams) {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "policyholder")) return;

      const cession = await insurerApproveCessionForUser(user, approveParams.cessionId);
      sendJson(res, 200, {
        message: "Insurer approval recorded",
        cession
      });
      return;
    }

    const activateParams = routeMatch(pathname, "/api/cessions/:cessionId/activate");
    if (req.method === "POST" && activateParams) {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "lender")) return;

      const cession = await activateApprovedCessionForUser(user, activateParams.cessionId);
      sendJson(res, 200, {
        message: "Cession activated and tokenized",
        cession
      });
      return;
    }

    const releaseRequestParams = routeMatch(pathname, "/api/cessions/:cessionId/release-request");
    if (req.method === "POST" && releaseRequestParams) {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "policyholder")) return;

      const cession = await requestReleaseFromBorrowerForUser(user, releaseRequestParams.cessionId);
      sendJson(res, 200, {
        message: "Borrower release request recorded",
        cession
      });
      return;
    }

    const releaseApprovalParams = routeMatch(pathname, "/api/cessions/:cessionId/release-approve-lender");
    if (req.method === "POST" && releaseApprovalParams) {
      const user = requireAuth(req, res);
      if (!user) return;
      if (!requireRole(res, user, "lender")) return;

      const cession = await lenderApproveReleaseAndNotifyInsurerForUser(user, releaseApprovalParams.cessionId);
      sendJson(res, 200, {
        message: "Lender approved release and insurer was notified",
        cession
      });
      return;
    }

    const releaseParams = routeMatch(pathname, "/api/cessions/:cessionId/release");
    if (req.method === "POST" && releaseParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      const result = await releaseCessionForUser(user, releaseParams.cessionId);
      if (!result) {
        sendJson(res, 404, { message: "Cession not found" });
        return;
      }

      sendJson(res, 200, result);
      return;
    }

    const lenderPortfolioParams = routeMatch(pathname, "/api/cessions/:cessionId/private/portfolio");
    if (lenderPortfolioParams) {
      const user = requireAuth(req, res);
      if (!user || !requireRole(res, user, "lender")) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storeLenderPortfolioDataForUser(user, lenderPortfolioParams.cessionId, body);
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryLenderPortfolioDataForUser(user, lenderPortfolioParams.cessionId);
        sendJson(res, 200, result);
        return;
      }
    }

    const disputeParams = routeMatch(pathname, "/api/disputes/:disputeId");
    if (disputeParams) {
      const user = requireAuth(req, res);
      if (!user) return;

      if (req.method === "POST") {
        const body = await parseBody(req);
        const result = await storeDisputeDataForUser(user, disputeParams.disputeId, body);
        sendJson(res, 201, result);
        return;
      }

      if (req.method === "GET") {
        const result = await queryDisputeDataForUser(user, disputeParams.disputeId);
        sendJson(res, 200, result);
        return;
      }
    }

    notFound(res);
  } catch (error) {
    console.error("Server error:", error);
    sendJson(res, 500, { message: "Internal server error", detail: error.message });
  }
});

async function startServer() {
  try {
    fabricGateway = new FabricGateway();
    await fabricGateway.initialize();
    console.log("Fabric Gateway initialized");
  } catch (error) {
    fabricGateway = null;
    console.log("Fabric gateway initialization failed.");
    console.log(error.message);
  }

  if (fabricGateway) {
    try {
      await ensureDemoData();
    } catch (error) {
      console.warn(`Demo data seed failed: ${error.message}`);
    }
  }

  server.listen(PORT, () => {
    console.log(`Cedex API listening on http://localhost:${PORT}`);
    console.log("Demo logins:");
    console.log("lender@cedex.local / password123");
    console.log("borrower@cedex.local / password123");
    console.log("insurer@cedex.local / password123");
    console.log(`Private profile endpoint: http://localhost:${PORT}/api/demo/private-profiles`);
  });
}

startServer();
