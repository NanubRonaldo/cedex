const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");

class FabricGateway {
  constructor() {
    this.connectionProfile = null;
    this.wallet = null;
  }

  async initialize() {
    const connectionProfilePath = path.join(__dirname, "fabric-connection.json");
    this.connectionProfile = JSON.parse(fs.readFileSync(connectionProfilePath, "utf8"));

    const walletPath = path.join(__dirname, "wallet");
    this.wallet = await Wallets.newFileSystemWallet(walletPath);
  }

  async connectAsUser(userId) {
    try {
      const gateway = new Gateway();
      await gateway.connect(this.connectionProfile, {
        wallet: this.wallet,
        identity: userId,
        discovery: { enabled: false, asLocalhost: true }
      });

      const network = await gateway.getNetwork("cessionchannel");
      const policyContract = network.getContract("policy");
      const cessionContract = network.getContract("cession");

      return { gateway, policyContract, cessionContract };
    } catch (error) {
      console.error(`Failed to connect as ${userId}:`, error);
      throw error;
    }
  }

  async disconnect(gateway) {
    if (gateway) {
      gateway.disconnect();
    }
  }

  async setupUserWallet(userId, mspId, certPath, keyPath) {
    try {
      const certificate = fs.readFileSync(certPath, "utf8");
      const privateKey = fs.readFileSync(keyPath, "utf8");

      const identity = {
        credentials: {
          certificate,
          privateKey
        },
        mspId,
        type: "X.509"
      };

      await this.wallet.put(userId, identity);
      console.log(`Identity ${userId} added to wallet`);
      return true;
    } catch (error) {
      console.error(`Failed to setup wallet for ${userId}:`, error);
      return false;
    }
  }

  async submitTransaction(contract, userId, _mspId, func, args) {
    let gateway;
    try {
      const connected = await this.connectAsUser(userId);
      gateway = connected.gateway;
      const activeContract = contract === "policy" ? connected.policyContract : connected.cessionContract;

      const result = await activeContract.submitTransaction(func, ...args);
      return {
        success: true,
        result: result.toString()
      };
    } catch (error) {
      console.error(`Transaction failed: ${func}`, error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.disconnect(gateway);
    }
  }

  async submitTransactionWithTransient(contract, userId, mspId, func, args, transientData, endorsingOrganizations = []) {
    let gateway;
    try {
      const connected = await this.connectAsUser(userId);
      gateway = connected.gateway;
      const activeContract = contract === "policy" ? connected.policyContract : connected.cessionContract;

      const transaction = activeContract.createTransaction(func);
      if (endorsingOrganizations.length > 0) {
        transaction.setEndorsingOrganizations(...endorsingOrganizations);
      } else if (mspId) {
        transaction.setEndorsingOrganizations(mspId);
      }
      if (transientData && Object.keys(transientData).length > 0) {
        const transientMap = {};
        for (const [key, value] of Object.entries(transientData)) {
          transientMap[key] = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
        }
        transaction.setTransient(transientMap);
      }

      const result = await transaction.submit(...args);
      return {
        success: true,
        result: result.toString()
      };
    } catch (error) {
      console.error(`Transient transaction failed: ${func}`, error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.disconnect(gateway);
    }
  }

  async evaluateTransaction(contract, userId, _mspId, func, args) {
    let gateway;
    try {
      const connected = await this.connectAsUser(userId);
      gateway = connected.gateway;
      const activeContract = contract === "policy" ? connected.policyContract : connected.cessionContract;

      const result = await activeContract.evaluateTransaction(func, ...args);
      return {
        success: true,
        result: result.toString()
      };
    } catch (error) {
      console.error(`Query failed: ${func}`, error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.disconnect(gateway);
    }
  }

  async queryAllPolicies(userId, mspId) {
    return this.evaluateTransaction("policy", userId, mspId, "GetAllPolicies", []);
  }

  async queryPolicy(userId, mspId, policyId) {
    return this.evaluateTransaction("policy", userId, mspId, "QueryPolicy", [policyId]);
  }

  async createPolicy(userId, mspId, policyData) {
    return this.submitTransaction("policy", userId, mspId, "RegisterPolicy", [policyData]);
  }

  async queryAllCessions(userId, mspId) {
    return this.evaluateTransaction("cession", userId, mspId, "GetAllCessions", []);
  }

  async queryCessionsByPolicy(userId, mspId, policyId) {
    return this.evaluateTransaction("cession", userId, mspId, "GetCessionsByPolicy", [policyId]);
  }

  async createCession(userId, mspId, cessionData) {
    return this.submitTransaction("cession", userId, mspId, "CreateCession", [cessionData]);
  }

  async createCessionWithLenderType(userId, mspId, cessionData) {
    return this.submitTransaction("cession", userId, mspId, "CreateCessionWithLenderType", [cessionData]);
  }

  async requestCessionApproval(userId, mspId, cessionData) {
    return this.submitTransaction("cession", userId, mspId, "RequestCessionApproval", [cessionData]);
  }

  async borrowerConsentCession(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "BorrowerConsentCession", [cessionId]);
  }

  async insurerApproveCession(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "InsurerApproveCession", [cessionId]);
  }

  async activateApprovedCession(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "ActivateApprovedCession", [cessionId]);
  }

  async requestReleaseFromBorrower(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "RequestReleaseFromBorrower", [cessionId]);
  }

  async lenderApproveReleaseAndNotifyInsurer(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "LenderApproveReleaseAndNotifyInsurer", [cessionId]);
  }

  async releaseCession(userId, mspId, cessionId) {
    return this.submitTransaction("cession", userId, mspId, "ReleaseCession", [cessionId]);
  }

  async registerLender(userId, mspId, lenderData) {
    return this.submitTransaction("cession", userId, mspId, "RegisterLender", [lenderData]);
  }

  async queryLender(userId, mspId, lenderId) {
    return this.evaluateTransaction("cession", userId, mspId, "QueryLender", [lenderId]);
  }

  async queryLendersByType(userId, mspId, lenderType) {
    return this.evaluateTransaction("cession", userId, mspId, "GetLendersByType", [lenderType]);
  }

  async queryAvailableCollateral(userId, mspId) {
    return this.evaluateTransaction("policy", userId, mspId, "GetAvailableCollateral", []);
  }

  async calculateAvailableCollateral(userId, mspId, policyId, loanAmount) {
    return this.evaluateTransaction(
      "policy",
      userId,
      mspId,
      "CalculateAvailableCollateral",
      [policyId, String(loanAmount)]
    );
  }

  async queryPolicyCollateralStatus(userId, mspId, policyId) {
    return this.evaluateTransaction(
      "policy",
      userId,
      mspId,
      "GetPolicyCollateralStatus",
      [policyId]
    );
  }

  async queryAvailableCapacity(userId, mspId, policyId) {
    return this.evaluateTransaction(
      "policy",
      userId,
      mspId,
      "GetAvailableCapacity",
      [policyId]
    );
  }

  async queryToken(userId, mspId, tokenId) {
    return this.evaluateTransaction("policy", userId, mspId, "GetCessionToken", [tokenId]);
  }

  async queryPolicyTokens(userId, mspId, policyId) {
    return this.evaluateTransaction("policy", userId, mspId, "GetPolicyCessions", [policyId]);
  }

  async queryCessionsByPriority(userId, mspId, policyId) {
    return this.evaluateTransaction("cession", userId, mspId, "GetCessionsByPriority", [policyId]);
  }

  async storePolicyholderPrivateData(userId, mspId, policyId, privateData) {
    return this.submitTransactionWithTransient(
      "policy",
      userId,
      mspId,
      "StorePolicyholderPrivateData",
      [policyId],
      { private_data: JSON.stringify(privateData) },
      ["InsurerMSP"]
    );
  }

  async queryPolicyholderPrivateData(userId, mspId, policyId) {
    return this.evaluateTransaction("policy", userId, mspId, "QueryPolicyholderPrivateData", [policyId]);
  }

  async storeMedicalUnderwritingData(userId, mspId, policyId, privateData) {
    return this.submitTransactionWithTransient(
      "policy",
      userId,
      mspId,
      "StoreMedicalUnderwritingData",
      [policyId],
      { private_data: JSON.stringify(privateData) },
      ["InsurerMSP"]
    );
  }

  async queryMedicalUnderwritingData(userId, mspId, policyId) {
    return this.evaluateTransaction("policy", userId, mspId, "QueryMedicalUnderwritingData", [policyId]);
  }

  async storePremiumPaymentData(userId, mspId, policyId, paymentId, privateData) {
    return this.submitTransactionWithTransient(
      "policy",
      userId,
      mspId,
      "StorePremiumPaymentData",
      [policyId, paymentId],
      { private_data: JSON.stringify(privateData) },
      ["InsurerMSP"]
    );
  }

  async queryPremiumPaymentData(userId, mspId, policyId, paymentId) {
    return this.evaluateTransaction("policy", userId, mspId, "QueryPremiumPaymentData", [policyId, paymentId]);
  }

  async storeRegulatoryReport(userId, mspId, reportId, privateData) {
    return this.submitTransactionWithTransient(
      "policy",
      userId,
      mspId,
      "StoreRegulatoryReport",
      [reportId],
      { private_data: JSON.stringify(privateData) },
      [mspId]
    );
  }

  async queryRegulatoryReport(userId, mspId, reportId) {
    return this.evaluateTransaction("policy", userId, mspId, "QueryRegulatoryReport", [reportId]);
  }

  async storeLenderPortfolioData(userId, mspId, cessionId, privateData) {
    return this.submitTransactionWithTransient(
      "cession",
      userId,
      mspId,
      "StoreLenderPortfolioData",
      [cessionId],
      { private_data: JSON.stringify(privateData) },
      ["LenderMSP"]
    );
  }

  async queryLenderPortfolioData(userId, mspId, cessionId) {
    return this.evaluateTransaction("cession", userId, mspId, "QueryLenderPortfolioData", [cessionId]);
  }

  async storeDisputeData(userId, mspId, disputeId, privateData) {
    return this.submitTransactionWithTransient(
      "cession",
      userId,
      mspId,
      "StoreDisputeData",
      [disputeId],
      { private_data: JSON.stringify(privateData) },
      [mspId]
    );
  }

  async queryDisputeData(userId, mspId, disputeId) {
    return this.evaluateTransaction("cession", userId, mspId, "QueryDisputeData", [disputeId]);
  }

  async queryPolicyPrivateDataHash(userId, mspId, collection, key) {
    return this.evaluateTransaction("policy", userId, mspId, "GetPrivateDataHash", [collection, key]);
  }

  async queryCessionPrivateDataHash(userId, mspId, collection, key) {
    return this.evaluateTransaction("cession", userId, mspId, "GetPrivateDataHash", [collection, key]);
  }
}

module.exports = FabricGateway;
