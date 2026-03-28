package main

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	cessionPrefix               = "CESSION_"
	lenderPrefix                = "LENDER_"
	policyChaincodeName         = "policy"
	lenderPortfolioCollection   = "LenderPortfolio"
	disputeResolutionCollection = "DisputeResolution"
	privatePayloadTransientKey  = "private_data"
	bankCoverageBPS             = int64(3500)
	microlenderCoverageBPS      = int64(4830)
	bankInterestRateBPS         = int64(1500)
	microlenderInterestRateBPS  = int64(2400)
	cessionStatusRequested      = "requested"
	cessionStatusConsented      = "consented"
	cessionStatusInsurerApproved = "insurer_approved"
	cessionStatusActive         = "active"
	cessionStatusReleaseRequested = "release_requested"
	cessionStatusLenderReleaseApproved = "lender_release_approved"
	cessionStatusReleased       = "released"
)

type LenderType string

const (
	Bank        LenderType = "BANK"
	Microlender LenderType = "MICROLENDER"
)

type CessionRecord struct {
	CessionID             string  `json:"cessionId"`
	TokenID               string  `json:"tokenId"`
	PolicyID              string  `json:"policyId"`
	LoanID                string  `json:"loanId"`
	LenderID              string  `json:"lenderId"`
	LenderName            string  `json:"lenderName"`
	LenderType            string  `json:"lenderType"`
	BorrowerID            string  `json:"borrowerId"`
	BorrowerName          string  `json:"borrowerName"`
	Cedent                string  `json:"cedent"`
	Cessionary            string  `json:"cessionary"`
	LoanAmount            float64 `json:"loanAmount"`
	LoanAmountCents       int64   `json:"loanAmountCents"`
	Amount                float64 `json:"amount"`
	AmountCents           int64   `json:"amountCents"`
	LifeCoverPortion      float64 `json:"lifeCoverPortion"`
	LifeCoverPortionCents int64   `json:"lifeCoverPortionCents"`
	RetrenchmentPortion   float64 `json:"retrenchmentPortion"`
	RetrenchmentPortionCents int64 `json:"retrenchmentPortionCents"`
	ExistingCoverage      float64 `json:"existingCoverage"`
	ExistingCoverageCents int64   `json:"existingCoverageCents"`
	NewCoverage           float64 `json:"newCoverage"`
	NewCoverageCents      int64   `json:"newCoverageCents"`
	SavingsAmount         float64 `json:"savingsAmount"`
	SavingsAmountCents    int64   `json:"savingsAmountCents"`
	PremiumSaved          float64 `json:"premiumSaved"`
	PremiumSavedCents     int64   `json:"premiumSavedCents"`
	InterestRateBPS       int64   `json:"interestRateBps"`
	InterestRate          float64 `json:"interestRate"`
	MonthlyPayment        float64 `json:"monthlyPayment"`
	MonthlyPaymentCents   int64   `json:"monthlyPaymentCents"`
	LoanTermMonths        int     `json:"loanTermMonths"`
	RequiredCoverageBPS   int64   `json:"requiredCoverageBps"`
	PriorityRank          int     `json:"priorityRank"`
	Status                string  `json:"status"`
	BorrowerConsented     bool    `json:"borrowerConsented"`
	InsurerApproved       bool    `json:"insurerApproved"`
	ConsentedAt           string  `json:"consentedAt"`
	InsurerApprovedAt     string  `json:"insurerApprovedAt"`
	ActivatedAt           string  `json:"activatedAt"`
	BorrowerReleaseRequested bool `json:"borrowerReleaseRequested"`
	ReleaseRequestedAt    string  `json:"releaseRequestedAt"`
	LenderReleaseApproved bool    `json:"lenderReleaseApproved"`
	LenderReleaseApprovedAt string `json:"lenderReleaseApprovedAt"`
	InsurerNotified       bool    `json:"insurerNotified"`
	InsurerNotifiedAt     string  `json:"insurerNotifiedAt"`
	StartDate             string  `json:"startDate"`
	EndDate               string  `json:"endDate"`
	CreatedAt             string  `json:"createdAt"`
}

type PolicySnapshot struct {
	PolicyID          string  `json:"policyId"`
	HolderName        string  `json:"holderName"`
	HolderID          string  `json:"holderId"`
	Insurer           string  `json:"insurer"`
	ProductType       string  `json:"productType"`
	AvailableValue    float64 `json:"availableValue"`
	DeathCover        float64 `json:"deathCover"`
	RetrenchmentCover float64 `json:"retrenchmentCover"`
	Status            string  `json:"status"`
}

type LendingPolicies struct {
	MaxLTV              int64 `json:"maxLtvBps"`
	MinCreditScore      int   `json:"minCreditScore"`
	BaseRateBPS         int64 `json:"baseRateBps"`
	RiskPremiumBPS      int64 `json:"riskPremiumBps"`
	EffectiveRateBPS    int64 `json:"effectiveRateBps"`
	MinTermMonths       int   `json:"minTermMonths"`
	MaxTermMonths       int   `json:"maxTermMonths"`
	RequiredCoverageBPS int64 `json:"requiredCoverageBps"`
	Accepts80_20        bool  `json:"accepts80_20"`
}

type LenderProfile struct {
	LenderID            string          `json:"lenderId"`
	LenderType          LenderType      `json:"lenderType"`
	Name                string          `json:"name"`
	RegistrationNumber  string          `json:"registrationNumber"`
	NAMFISALicense      string          `json:"namfisaLicense"`
	BankOfNamibiaReg    string          `json:"bankOfNamibiaReg"`
	BankCode            string          `json:"bankCode"`
	SwiftCode           string          `json:"swiftCode"`
	IsCommercialBank    bool            `json:"isCommercialBank"`
	MicrolenderLicense  string          `json:"microlenderLicense"`
	MaxLoanAmountCents  int64           `json:"maxLoanAmountCents"`
	MinLoanAmountCents  int64           `json:"minLoanAmountCents"`
	TargetMarket        string          `json:"targetMarket"`
	LendingPolicies     LendingPolicies `json:"lendingPolicies"`
	RiskProfile         string          `json:"riskProfile"`
	Active              bool            `json:"active"`
	CreatedAt           string          `json:"createdAt"`
	UpdatedAt           string          `json:"updatedAt"`
}

type TokenCreateRequest struct {
	TokenID             string  `json:"tokenId"`
	PolicyID            string  `json:"policyId"`
	LoanID              string  `json:"loanId"`
	LenderID            string  `json:"lenderId"`
	LenderType          string  `json:"lenderType,omitempty"`
	BorrowerID          string  `json:"borrowerId"`
	LoanAmount          float64 `json:"loanAmount"`
	Amount              float64 `json:"amount"`
	RequiredCoverageBPS int64   `json:"requiredCoverageBps,omitempty"`
	StartDate           string  `json:"startDate"`
}

type CessionToken struct {
	TokenID                 string  `json:"tokenId"`
	PolicyID                string  `json:"policyId"`
	LoanID                  string  `json:"loanId"`
	LenderID                string  `json:"lenderId"`
	LenderType              string  `json:"lenderType,omitempty"`
	BorrowerID              string  `json:"borrowerId"`
	LoanAmount              float64 `json:"loanAmount"`
	LoanAmountCents         int64   `json:"loanAmountCents,omitempty"`
	Amount                  float64 `json:"amount"`
	AmountCents             int64   `json:"amountCents,omitempty"`
	TotalSecured            float64 `json:"totalSecured"`
	TotalSecuredCents       int64   `json:"totalSecuredCents,omitempty"`
	LifeCoverPortion        float64 `json:"lifeCoverPortion"`
	LifeCoverPortionCents   int64   `json:"lifeCoverPortionCents,omitempty"`
	RetrenchmentPortion     float64 `json:"retrenchmentPortion"`
	RetrenchmentPortionCents int64  `json:"retrenchmentPortionCents,omitempty"`
	RequiredCoverageBPS     int64   `json:"requiredCoverageBps,omitempty"`
	PriorityRank            int     `json:"priorityRank"`
	Status                  string  `json:"status"`
	StartDate               string  `json:"startDate"`
	EndDate                 string  `json:"endDate"`
	CreatedAt               string  `json:"createdAt"`
}

type LenderPortfolioData struct {
	LenderID               string  `json:"lenderId"`
	PolicyID               string  `json:"policyId"`
	CessionID              string  `json:"cessionId"`
	InternalCreditScore    int     `json:"internalCreditScore"`
	RiskAdjustedReturn     float64 `json:"riskAdjustedReturn"`
	ExpectedDefaultRate    float64 `json:"expectedDefaultRate"`
	CollateralBuffer       float64 `json:"collateralBuffer"`
	InterestRateApplied    float64 `json:"interestRateApplied"`
	FeesStructure          string  `json:"feesStructure"`
	DiscountRate           float64 `json:"discountRate"`
	PortfolioWeight        float64 `json:"portfolioWeight"`
	CorrelationScore       float64 `json:"correlationScore"`
	DiversificationBenefit float64 `json:"diversificationBenefit"`
	UnderwriterNotes       string  `json:"underwriterNotes"`
	ApprovalLevel          string  `json:"approvalLevel"`
	ReviewDate             string  `json:"reviewDate"`
}

type DisputeData struct {
	DisputeID         string   `json:"disputeId"`
	PolicyID          string   `json:"policyId"`
	CessionID         string   `json:"cessionId"`
	Initiator         string   `json:"initiator"`
	Respondent        string   `json:"respondent"`
	DisputeType       string   `json:"disputeType"`
	Description       string   `json:"description"`
	EvidenceHashes    []string `json:"evidenceHashes"`
	Status            string   `json:"status"`
	ResolutionDate    string   `json:"resolutionDate"`
	Outcome           string   `json:"outcome"`
	SettlementAmount  float64  `json:"settlementAmount"`
	ArbitratorID      string   `json:"arbitratorId"`
	Decision          string   `json:"decision"`
	AppealDeadline    string   `json:"appealDeadline"`
}

type EnhancedCessionContract struct {
	contractapi.Contract
}

func (c *EnhancedCessionContract) RegisterLender(ctx contractapi.TransactionContextInterface, lenderJSON string) (*LenderProfile, error) {
	var lender LenderProfile
	if err := json.Unmarshal([]byte(lenderJSON), &lender); err != nil {
		return nil, fmt.Errorf("failed to unmarshal lender: %v", err)
	}

	if lender.LenderID == "" {
		lender.LenderID = fmt.Sprintf("LDR-%s", ctx.GetStub().GetTxID())
	}
	if err := validateLenderProfile(&lender); err != nil {
		return nil, err
	}

	exists, err := c.LenderExists(ctx, lender.LenderID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("lender %s already exists", lender.LenderID)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}
	lender.CreatedAt = now
	lender.UpdatedAt = now
	lender.Active = true

	lenderBytes, err := json.Marshal(lender)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal lender profile: %v", err)
	}
	if err := ctx.GetStub().PutState(lenderKey(lender.LenderID), lenderBytes); err != nil {
		return nil, fmt.Errorf("failed to store lender profile: %v", err)
	}

	return &lender, nil
}

func (c *EnhancedCessionContract) QueryLender(ctx contractapi.TransactionContextInterface, lenderID string) (*LenderProfile, error) {
	lenderBytes, err := ctx.GetStub().GetState(lenderKey(lenderID))
	if err != nil {
		return nil, fmt.Errorf("failed to read lender: %v", err)
	}
	if lenderBytes == nil {
		return nil, fmt.Errorf("lender %s does not exist", lenderID)
	}

	var lender LenderProfile
	if err := json.Unmarshal(lenderBytes, &lender); err != nil {
		return nil, fmt.Errorf("failed to unmarshal lender profile: %v", err)
	}

	return &lender, nil
}

func (c *EnhancedCessionContract) GetLendersByType(ctx contractapi.TransactionContextInterface, lenderType string) ([]*LenderProfile, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange(lenderPrefix, lenderPrefix+"\uffff")
	if err != nil {
		return nil, fmt.Errorf("failed to query lenders: %v", err)
	}
	defer resultsIterator.Close()

	normalizedType := strings.ToUpper(strings.TrimSpace(lenderType))
	var lenders []*LenderProfile
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate lenders: %v", err)
		}

		var lender LenderProfile
		if err := json.Unmarshal(queryResponse.Value, &lender); err != nil {
			continue
		}
		if normalizedType == "" || string(lender.LenderType) == normalizedType {
			lenders = append(lenders, &lender)
		}
	}

	sort.Slice(lenders, func(i, j int) bool {
		return lenders[i].Name < lenders[j].Name
	})

	return lenders, nil
}

func (c *EnhancedCessionContract) LenderExists(ctx contractapi.TransactionContextInterface, lenderID string) (bool, error) {
	lenderBytes, err := ctx.GetStub().GetState(lenderKey(lenderID))
	if err != nil {
		return false, fmt.Errorf("failed to read lender %s: %v", lenderID, err)
	}
	return lenderBytes != nil, nil
}

func (c *EnhancedCessionContract) CreateCessionWithLenderType(ctx contractapi.TransactionContextInterface, cessionJSON string) (*CessionRecord, error) {
	return c.RequestCessionApproval(ctx, cessionJSON)
}

func (c *EnhancedCessionContract) CreateCession(ctx contractapi.TransactionContextInterface, cessionJSON string) (*CessionRecord, error) {
	return c.RequestCessionApproval(ctx, cessionJSON)
}

func (c *EnhancedCessionContract) RequestCessionApproval(ctx contractapi.TransactionContextInterface, cessionJSON string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "LenderMSP"); err != nil {
		return nil, err
	}

	var cession CessionRecord
	if err := json.Unmarshal([]byte(cessionJSON), &cession); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cession: %v", err)
	}

	if cession.PolicyID == "" || cession.LenderID == "" {
		return nil, fmt.Errorf("policyId and lenderId are required")
	}

	lender, err := c.QueryLender(ctx, cession.LenderID)
	if err != nil {
		return nil, err
	}
	if !lender.Active {
		return nil, fmt.Errorf("lender %s is not active", lender.LenderID)
	}

	coverageBPS := lender.LendingPolicies.RequiredCoverageBPS
	if coverageBPS <= 0 {
		switch lender.LenderType {
		case Bank:
			coverageBPS = bankCoverageBPS
		case Microlender:
			coverageBPS = microlenderCoverageBPS
		default:
			return nil, fmt.Errorf("unsupported lender type: %s", lender.LenderType)
		}
	}

	loanAmountCents := amountToCents(cession.LoanAmount)
	requestedAmountCents := amountToCents(cession.Amount)
	if loanAmountCents <= 0 && requestedAmountCents <= 0 {
		return nil, fmt.Errorf("loanAmount or amount is required")
	}
	if loanAmountCents <= 0 {
		loanAmountCents = divBPSRounded(requestedAmountCents, coverageBPS)
	}
	requiredCoverageCents := requestedAmountCents
	if requiredCoverageCents <= 0 {
		requiredCoverageCents = mulBPSRounded(loanAmountCents, coverageBPS)
	}
	if requiredCoverageCents <= 0 {
		return nil, fmt.Errorf("unable to derive required coverage")
	}

	policy, err := c.queryPolicySnapshot(ctx, cession.PolicyID)
	if err != nil {
		return nil, err
	}

	lifeCoverPortionCents, retrenchmentPortionCents, err := validatePolicyCoverageForCession(policy, requiredCoverageCents)
	if err != nil {
		return nil, err
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.CessionID = coalesce(cession.CessionID, fmt.Sprintf("CES-%s", ctx.GetStub().GetTxID()))
	exists, err := c.CessionExists(ctx, cession.CessionID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("cession %s already exists", cession.CessionID)
	}

	cession.LenderName = lender.Name
	cession.LenderType = string(lender.LenderType)
	cession.LoanID = coalesce(cession.LoanID, fmt.Sprintf("LOAN-%s", ctx.GetStub().GetTxID()))
	cession.BorrowerID = coalesce(cession.BorrowerID, policy.HolderID)
	cession.BorrowerName = coalesce(cession.BorrowerName, policy.HolderName)
	cession.Cedent = coalesce(cession.Cedent, policy.HolderName)
	cession.Cessionary = coalesce(cession.Cessionary, lender.Name)
	cession.LoanAmountCents = loanAmountCents
	cession.LoanAmount = centsToAmount(loanAmountCents)
	cession.AmountCents = requiredCoverageCents
	cession.Amount = centsToAmount(requiredCoverageCents)
	cession.LifeCoverPortionCents = lifeCoverPortionCents
	cession.LifeCoverPortion = centsToAmount(lifeCoverPortionCents)
	cession.RetrenchmentPortionCents = retrenchmentPortionCents
	cession.RetrenchmentPortion = centsToAmount(retrenchmentPortionCents)
	cession.ExistingCoverageCents = lifeCoverPortionCents
	cession.ExistingCoverage = centsToAmount(lifeCoverPortionCents)
	cession.NewCoverageCents = retrenchmentPortionCents
	cession.NewCoverage = centsToAmount(retrenchmentPortionCents)
	cession.SavingsAmountCents = lifeCoverPortionCents
	cession.SavingsAmount = centsToAmount(lifeCoverPortionCents)
	cession.PremiumSavedCents = estimateMonthlyPremiumSaved(requiredCoverageCents, retrenchmentPortionCents)
	cession.PremiumSaved = centsToAmount(cession.PremiumSavedCents)
	cession.RequiredCoverageBPS = coverageBPS
	cession.Status = cessionStatusRequested
	cession.BorrowerConsented = false
	cession.InsurerApproved = false
	cession.PriorityRank = 0
	cession.StartDate = coalesce(cession.StartDate, now)
	cession.EndDate = ""
	cession.CreatedAt = now

	switch lender.LenderType {
	case Bank:
		cession.InterestRateBPS = bankInterestRateBPS
		cession.LoanTermMonths = 24
	case Microlender:
		cession.InterestRateBPS = microlenderInterestRateBPS
		cession.LoanTermMonths = 12
	}
	cession.InterestRate = bpsToRate(cession.InterestRateBPS)
	cession.MonthlyPaymentCents = simpleMonthlyPayment(cession.LoanAmountCents, cession.InterestRateBPS, cession.LoanTermMonths)
	cession.MonthlyPayment = centsToAmount(cession.MonthlyPaymentCents)

	if err := c.putCession(ctx, &cession); err != nil {
		return nil, err
	}

	return &cession, nil
}

func (c *EnhancedCessionContract) QueryCession(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	cessionBytes, err := ctx.GetStub().GetState(cessionKey(cessionID))
	if err != nil {
		return nil, fmt.Errorf("failed to read cession: %v", err)
	}
	if cessionBytes == nil {
		return nil, fmt.Errorf("cession %s does not exist", cessionID)
	}

	var cession CessionRecord
	if err := json.Unmarshal(cessionBytes, &cession); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cession: %v", err)
	}

	return &cession, nil
}

func (c *EnhancedCessionContract) GetAllCessions(ctx contractapi.TransactionContextInterface) ([]*CessionRecord, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange(cessionPrefix, cessionPrefix+"\uffff")
	if err != nil {
		return nil, fmt.Errorf("failed to query cessions: %v", err)
	}
	defer resultsIterator.Close()

	var cessions []*CessionRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate cessions: %v", err)
		}

		var cession CessionRecord
		if err := json.Unmarshal(queryResponse.Value, &cession); err != nil {
			continue
		}
		cessions = append(cessions, &cession)
	}

	sort.Slice(cessions, func(i, j int) bool {
		return cessions[i].CreatedAt < cessions[j].CreatedAt
	})

	return cessions, nil
}

func (c *EnhancedCessionContract) GetCessionsByPolicy(ctx contractapi.TransactionContextInterface, policyID string) ([]*CessionRecord, error) {
	cessions, err := c.GetAllCessions(ctx)
	if err != nil {
		return nil, err
	}

	var filtered []*CessionRecord
	for _, cession := range cessions {
		if cession.PolicyID == policyID {
			filtered = append(filtered, cession)
		}
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].PriorityRank < filtered[j].PriorityRank
	})

	return filtered, nil
}

func (c *EnhancedCessionContract) GetCessionsByPriority(ctx contractapi.TransactionContextInterface, policyID string) ([]*CessionRecord, error) {
	cessions, err := c.GetCessionsByPolicy(ctx, policyID)
	if err != nil {
		return nil, err
	}

	var active []*CessionRecord
	for _, cession := range cessions {
		if cession.Status == "active" {
			active = append(active, cession)
		}
	}

	return active, nil
}

func (c *EnhancedCessionContract) BorrowerConsentCession(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusRequested {
		return nil, fmt.Errorf("cession %s must be in requested status before consent", cessionID)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.BorrowerConsented = true
	cession.ConsentedAt = now
	cession.Status = cessionStatusConsented

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) InsurerApproveCession(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusConsented {
		return nil, fmt.Errorf("cession %s must be consented before insurer approval", cessionID)
	}
	if !cession.BorrowerConsented {
		return nil, fmt.Errorf("cession %s is missing borrower consent", cessionID)
	}

	policy, err := c.queryPolicySnapshot(ctx, cession.PolicyID)
	if err != nil {
		return nil, err
	}
	lifeCoverPortionCents, retrenchmentPortionCents, err := validatePolicyCoverageForCession(policy, cession.AmountCents)
	if err != nil {
		return nil, err
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.LifeCoverPortionCents = lifeCoverPortionCents
	cession.LifeCoverPortion = centsToAmount(lifeCoverPortionCents)
	cession.RetrenchmentPortionCents = retrenchmentPortionCents
	cession.RetrenchmentPortion = centsToAmount(retrenchmentPortionCents)
	cession.NewCoverageCents = retrenchmentPortionCents
	cession.NewCoverage = centsToAmount(retrenchmentPortionCents)
	cession.ExistingCoverageCents = lifeCoverPortionCents
	cession.ExistingCoverage = centsToAmount(lifeCoverPortionCents)
	cession.SavingsAmountCents = lifeCoverPortionCents
	cession.SavingsAmount = centsToAmount(lifeCoverPortionCents)
	cession.PremiumSavedCents = estimateMonthlyPremiumSaved(cession.AmountCents, retrenchmentPortionCents)
	cession.PremiumSaved = centsToAmount(cession.PremiumSavedCents)
	cession.InsurerApproved = true
	cession.InsurerApprovedAt = now
	cession.Status = cessionStatusInsurerApproved

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) ActivateApprovedCession(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "LenderMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusInsurerApproved {
		return nil, fmt.Errorf("cession %s must be insurer_approved before activation", cessionID)
	}
	if !cession.BorrowerConsented || !cession.InsurerApproved {
		return nil, fmt.Errorf("cession %s is missing consent/approval checkpoints", cessionID)
	}

	tokenRequest := TokenCreateRequest{
		TokenID:             cession.TokenID,
		PolicyID:            cession.PolicyID,
		LoanID:              cession.LoanID,
		LenderID:            cession.LenderID,
		LenderType:          cession.LenderType,
		BorrowerID:          cession.BorrowerID,
		LoanAmount:          cession.LoanAmount,
		Amount:              cession.Amount,
		RequiredCoverageBPS: cession.RequiredCoverageBPS,
		StartDate:           cession.StartDate,
	}

	tokenPayload, err := json.Marshal(tokenRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal token request: %v", err)
	}

	response := ctx.GetStub().InvokeChaincode(
		policyChaincodeName,
		[][]byte{[]byte("CreateCessionToken"), tokenPayload},
		ctx.GetStub().GetChannelID(),
	)
	if response.Status != shim.OK {
		return nil, fmt.Errorf("failed to activate cession token: %s", response.Message)
	}

	var token CessionToken
	if err := json.Unmarshal(response.Payload, &token); err != nil {
		return nil, fmt.Errorf("failed to unmarshal token response: %v", err)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.TokenID = token.TokenID
	cession.LoanID = token.LoanID
	cession.BorrowerID = coalesce(cession.BorrowerID, token.BorrowerID)
	cession.LoanAmount = token.LoanAmount
	cession.LoanAmountCents = nonZero(token.LoanAmountCents, amountToCents(token.LoanAmount))
	cession.Amount = token.TotalSecured
	cession.AmountCents = nonZero(token.TotalSecuredCents, amountToCents(token.TotalSecured))
	cession.LifeCoverPortion = token.LifeCoverPortion
	cession.LifeCoverPortionCents = nonZero(token.LifeCoverPortionCents, amountToCents(token.LifeCoverPortion))
	cession.RetrenchmentPortion = token.RetrenchmentPortion
	cession.RetrenchmentPortionCents = nonZero(token.RetrenchmentPortionCents, amountToCents(token.RetrenchmentPortion))
	cession.PriorityRank = token.PriorityRank
	cession.Status = cessionStatusActive
	cession.StartDate = coalesce(token.StartDate, cession.StartDate)
	cession.EndDate = token.EndDate
	cession.ActivatedAt = now

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) ReleaseCession(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusLenderReleaseApproved {
		return nil, fmt.Errorf("cession %s must be lender_release_approved before release", cessionID)
	}
	if !cession.BorrowerReleaseRequested {
		return nil, fmt.Errorf("cession %s has no borrower release request", cessionID)
	}
	if !cession.LenderReleaseApproved {
		return nil, fmt.Errorf("cession %s has no lender release approval", cessionID)
	}
	if !cession.InsurerNotified {
		return nil, fmt.Errorf("cession %s has not notified insurer", cessionID)
	}

	response := ctx.GetStub().InvokeChaincode(
		policyChaincodeName,
		[][]byte{[]byte("ReleaseCessionToken"), []byte(cession.TokenID)},
		ctx.GetStub().GetChannelID(),
	)
	if response.Status != shim.OK {
		return nil, fmt.Errorf("failed to release tokenized collateral: %s", response.Message)
	}

	var token CessionToken
	if err := json.Unmarshal(response.Payload, &token); err != nil {
		return nil, fmt.Errorf("failed to unmarshal released token: %v", err)
	}

	cession.Status = cessionStatusReleased
	cession.EndDate = token.EndDate

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) RequestReleaseFromBorrower(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusActive {
		return nil, fmt.Errorf("cession %s must be active before borrower release request", cessionID)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.BorrowerReleaseRequested = true
	cession.ReleaseRequestedAt = now
	cession.LenderReleaseApproved = false
	cession.LenderReleaseApprovedAt = ""
	cession.InsurerNotified = false
	cession.InsurerNotifiedAt = ""
	cession.Status = cessionStatusReleaseRequested

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) LenderApproveReleaseAndNotifyInsurer(ctx contractapi.TransactionContextInterface, cessionID string) (*CessionRecord, error) {
	if err := requireAnyMSP(ctx, "LenderMSP"); err != nil {
		return nil, err
	}

	cession, err := c.QueryCession(ctx, cessionID)
	if err != nil {
		return nil, err
	}
	if cession.Status != cessionStatusReleaseRequested {
		return nil, fmt.Errorf("cession %s must be release_requested before lender approval", cessionID)
	}
	if !cession.BorrowerReleaseRequested {
		return nil, fmt.Errorf("cession %s missing borrower release request", cessionID)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}

	cession.LenderReleaseApproved = true
	cession.LenderReleaseApprovedAt = now
	cession.InsurerNotified = true
	cession.InsurerNotifiedAt = now
	cession.Status = cessionStatusLenderReleaseApproved

	if err := c.putCession(ctx, cession); err != nil {
		return nil, err
	}

	return cession, nil
}

func (c *EnhancedCessionContract) CessionExists(ctx contractapi.TransactionContextInterface, cessionID string) (bool, error) {
	cessionBytes, err := ctx.GetStub().GetState(cessionKey(cessionID))
	if err != nil {
		return false, fmt.Errorf("failed to read cession %s: %v", cessionID, err)
	}
	return cessionBytes != nil, nil
}

func (c *EnhancedCessionContract) StoreLenderPortfolioData(ctx contractapi.TransactionContextInterface, cessionID string) error {
	if _, err := c.QueryCession(ctx, cessionID); err != nil {
		return err
	}
	if err := requireAnyMSP(ctx, "LenderMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload LenderPortfolioData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal lender portfolio data: %v", err)
	}
	payload.CessionID = cessionID

	return putPrivateJSON(ctx, lenderPortfolioCollection, cessionID, payload)
}

func (c *EnhancedCessionContract) QueryLenderPortfolioData(ctx contractapi.TransactionContextInterface, cessionID string) (*LenderPortfolioData, error) {
	if err := requireAnyMSP(ctx, "LenderMSP"); err != nil {
		return nil, err
	}

	var payload LenderPortfolioData
	if err := getPrivateJSON(ctx, lenderPortfolioCollection, cessionID, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedCessionContract) StoreDisputeData(ctx contractapi.TransactionContextInterface, disputeID string) error {
	if disputeID == "" {
		return fmt.Errorf("disputeId is required")
	}
	if err := requireAnyMSP(ctx, "InsurerMSP", "LenderMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload DisputeData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal dispute data: %v", err)
	}
	payload.DisputeID = disputeID

	if payload.CessionID != "" {
		if _, err := c.QueryCession(ctx, payload.CessionID); err != nil {
			return err
		}
	}

	return putPrivateJSON(ctx, disputeResolutionCollection, disputeID, payload)
}

func (c *EnhancedCessionContract) QueryDisputeData(ctx contractapi.TransactionContextInterface, disputeID string) (*DisputeData, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP", "LenderMSP"); err != nil {
		return nil, err
	}

	var payload DisputeData
	if err := getPrivateJSON(ctx, disputeResolutionCollection, disputeID, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedCessionContract) GetPrivateDataHash(ctx contractapi.TransactionContextInterface, collection string, key string) (string, error) {
	hashBytes, err := ctx.GetStub().GetPrivateDataHash(collection, key)
	if err != nil {
		return "", fmt.Errorf("failed to read private data hash: %v", err)
	}
	if hashBytes == nil {
		return "", fmt.Errorf("private data hash for key %s does not exist", key)
	}

	return fmt.Sprintf("%x", hashBytes), nil
}

func (c *EnhancedCessionContract) putCession(ctx contractapi.TransactionContextInterface, cession *CessionRecord) error {
	payload, err := json.Marshal(cession)
	if err != nil {
		return fmt.Errorf("failed to marshal cession: %v", err)
	}

	if err := ctx.GetStub().PutState(cessionKey(cession.CessionID), payload); err != nil {
		return fmt.Errorf("failed to store cession: %v", err)
	}

	return nil
}

func cessionKey(cessionID string) string {
	return cessionPrefix + cessionID
}

func lenderKey(lenderID string) string {
	return lenderPrefix + lenderID
}

func txTimestampRFC3339(ctx contractapi.TransactionContextInterface) (string, error) {
	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	ts := time.Unix(txTime.Seconds, int64(txTime.Nanos)).UTC()
	return ts.Format(time.RFC3339), nil
}

func validateLenderProfile(lender *LenderProfile) error {
	lender.LenderType = LenderType(strings.ToUpper(strings.TrimSpace(string(lender.LenderType))))
	if lender.Name == "" || lender.RegistrationNumber == "" || lender.NAMFISALicense == "" {
		return fmt.Errorf("name, registrationNumber and namfisaLicense are required")
	}
	if lender.LendingPolicies.RequiredCoverageBPS <= 0 || lender.LendingPolicies.RequiredCoverageBPS > 10000 {
		return fmt.Errorf("lendingPolicies.requiredCoverageBps must be between 1 and 10000")
	}

	switch lender.LenderType {
	case Bank:
		if lender.BankOfNamibiaReg == "" || lender.BankCode == "" {
			return fmt.Errorf("bankOfNamibiaReg and bankCode are required for BANK lenders")
		}
		if lender.MicrolenderLicense != "" || lender.MaxLoanAmountCents > 0 || lender.MinLoanAmountCents > 0 {
			return fmt.Errorf("microlender-only fields are not allowed for BANK lenders")
		}
	case Microlender:
		if lender.MicrolenderLicense == "" || lender.MaxLoanAmountCents <= 0 || lender.MinLoanAmountCents <= 0 {
			return fmt.Errorf("microlenderLicense, maxLoanAmountCents and minLoanAmountCents are required for MICROLENDER lenders")
		}
		if lender.BankOfNamibiaReg != "" || lender.BankCode != "" || lender.SwiftCode != "" {
			return fmt.Errorf("bank-only fields are not allowed for MICROLENDER lenders")
		}
	default:
		return fmt.Errorf("unsupported lenderType: %s. Must be BANK or MICROLENDER", lender.LenderType)
	}
	return nil
}

func (c *EnhancedCessionContract) queryPolicySnapshot(ctx contractapi.TransactionContextInterface, policyID string) (*PolicySnapshot, error) {
	response := ctx.GetStub().InvokeChaincode(
		policyChaincodeName,
		[][]byte{[]byte("QueryPolicy"), []byte(policyID)},
		ctx.GetStub().GetChannelID(),
	)
	if response.Status != shim.OK {
		return nil, fmt.Errorf("failed to query policy %s: %s", policyID, response.Message)
	}

	var policy PolicySnapshot
	if err := json.Unmarshal(response.Payload, &policy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal policy %s: %v", policyID, err)
	}
	return &policy, nil
}

func validatePolicyCoverageForCession(policy *PolicySnapshot, requiredCoverageCents int64) (int64, int64, error) {
	if policy == nil {
		return 0, 0, fmt.Errorf("policy data is required")
	}
	if policy.Status != "active" {
		return 0, 0, fmt.Errorf("policy %s is not active", policy.PolicyID)
	}
	if requiredCoverageCents <= 0 {
		return 0, 0, fmt.Errorf("required coverage must be positive")
	}

	deathCoverCents := amountToCents(policy.DeathCover)
	retrenchmentCoverCents := amountToCents(policy.RetrenchmentCover)
	if deathCoverCents <= 0 {
		return 0, 0, fmt.Errorf("policy %s is missing death cover required for cession", policy.PolicyID)
	}
	if retrenchmentCoverCents <= 0 {
		return 0, 0, fmt.Errorf("policy %s is missing retrenchment cover required for cession", policy.PolicyID)
	}

	availableCollateralCents := amountToCents(policy.AvailableValue)
	if availableCollateralCents < requiredCoverageCents {
		return 0, 0, fmt.Errorf(
			"insufficient available collateral: required %.2f, available %.2f",
			centsToAmount(requiredCoverageCents),
			centsToAmount(availableCollateralCents),
		)
	}

	lifeCoverPortionCents := minInt64(mulBPSRounded(requiredCoverageCents, 8000), deathCoverCents)
	retrenchmentPortionCents := requiredCoverageCents - lifeCoverPortionCents
	if retrenchmentCoverCents < retrenchmentPortionCents {
		return 0, 0, fmt.Errorf(
			"insufficient retrenchment cover: required %.2f, available %.2f",
			centsToAmount(retrenchmentPortionCents),
			centsToAmount(retrenchmentCoverCents),
		)
	}

	return lifeCoverPortionCents, retrenchmentPortionCents, nil
}

func amountToCents(value float64) int64 {
	return int64(math.Round(value * 100))
}

func mulBPSRounded(amountCents int64, bps int64) int64 {
	return int64(math.Round(float64(amountCents*bps) / 10000))
}

func divBPSRounded(amountCents int64, bps int64) int64 {
	if bps == 0 {
		return 0
	}
	return int64(math.Round(float64(amountCents*10000) / float64(bps)))
}

func centsToAmount(cents int64) float64 {
	return math.Round((float64(cents)/100)*100) / 100
}

func bpsToRate(bps int64) float64 {
	return math.Round((float64(bps)/100)*100) / 100
}

func estimateMonthlyPremiumSaved(totalCents int64, newCoverageCents int64) int64 {
	return (totalCents*5)/1000 - (newCoverageCents*10)/1000
}

func simpleMonthlyPayment(principalCents int64, annualRateBPS int64, termMonths int) int64 {
	if termMonths <= 0 {
		return 0
	}
	totalInterest := (principalCents * annualRateBPS * int64(termMonths)) / (10000 * 12)
	return (principalCents + totalInterest) / int64(termMonths)
}

func coalesce(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func nonZero(value int64, fallback int64) int64 {
	if value != 0 {
		return value
	}
	return fallback
}

func minInt64(a int64, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

func getTransientPayload(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	transientMap, err := ctx.GetStub().GetTransient()
	if err != nil {
		return nil, fmt.Errorf("failed to get transient data: %v", err)
	}

	privateBytes, ok := transientMap[privatePayloadTransientKey]
	if !ok || len(privateBytes) == 0 {
		return nil, fmt.Errorf("private data not found in transient map")
	}

	return privateBytes, nil
}

func putPrivateJSON(ctx contractapi.TransactionContextInterface, collection string, key string, payload interface{}) error {
	privateBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal private payload: %v", err)
	}

	if err := ctx.GetStub().PutPrivateData(collection, key, privateBytes); err != nil {
		return fmt.Errorf("failed to store private data in %s: %v", collection, err)
	}

	return nil
}

func getPrivateJSON(ctx contractapi.TransactionContextInterface, collection string, key string, target interface{}) error {
	privateBytes, err := ctx.GetStub().GetPrivateData(collection, key)
	if err != nil {
		return fmt.Errorf("failed to read private data from %s: %v", collection, err)
	}
	if privateBytes == nil {
		return fmt.Errorf("private data for key %s does not exist", key)
	}

	if err := json.Unmarshal(privateBytes, target); err != nil {
		return fmt.Errorf("failed to unmarshal private data: %v", err)
	}

	return nil
}

func requireAnyMSP(ctx contractapi.TransactionContextInterface, allowedMSPs ...string) error {
	clientMSP, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP: %v", err)
	}

	for _, mspID := range allowedMSPs {
		if clientMSP == mspID {
			return nil
		}
	}

	return fmt.Errorf("access denied for MSP %s", clientMSP)
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(EnhancedCessionContract))
	if err != nil {
		fmt.Printf("Error creating enhanced cession chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting enhanced cession chaincode: %v", err)
	}
}
