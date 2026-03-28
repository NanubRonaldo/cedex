package main

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	policyPrefix = "POLICY_"
	tokenPrefix  = "TOKEN_"
	defaultRequiredCoverageBPS = int64(4830)
	lifeCoverSplitBPS          = int64(8000)
	policyholderPrivateCollection = "PolicyholderPrivate"
	medicalUnderwritingCollection = "MedicalUnderwriting"
	premiumPaymentCollection      = "PremiumPaymentPrivate"
	regulatoryReportingCollection = "RegulatoryReporting"
	privatePayloadTransientKey    = "private_data"
)

type PolicyAsset struct {
	PolicyID               string   `json:"policyId"`
	HolderName             string   `json:"holderName"`
	HolderID               string   `json:"holderId"`
	Insurer                string   `json:"insurer"`
	ProductType            string   `json:"productType"`
	TotalValue             float64  `json:"totalValue"`
	AvailableValue         float64  `json:"availableValue"`
	CededValue             float64  `json:"cededValue"`
	DeathCover             float64  `json:"deathCover"`
	DisabilityCover        float64  `json:"disabilityCover"`
	CriticalIllnessCover   float64  `json:"criticalIllnessCover"`
	RetrenchmentCover      float64  `json:"retrenchmentCover"`
	ActiveCessions         []string `json:"activeCessions"`
	TotalCessions          int      `json:"totalCessions"`
	Status                 string   `json:"status"`
	CreatedAt              string   `json:"createdAt"`
	UpdatedAt              string   `json:"updatedAt"`
}

type CessionToken struct {
	TokenID              string  `json:"tokenId"`
	PolicyID             string  `json:"policyId"`
	LoanID               string  `json:"loanId"`
	LenderID             string  `json:"lenderId"`
	LenderType           string  `json:"lenderType,omitempty"`
	BorrowerID           string  `json:"borrowerId"`
	LoanAmount           float64 `json:"loanAmount"`
	LoanAmountCents      int64   `json:"loanAmountCents"`
	Amount               float64 `json:"amount"`
	AmountCents          int64   `json:"amountCents"`
	TotalSecured         float64 `json:"totalSecured"`
	TotalSecuredCents    int64   `json:"totalSecuredCents"`
	LifeCoverPortion     float64 `json:"lifeCoverPortion"`
	LifeCoverPortionCents int64  `json:"lifeCoverPortionCents"`
	RetrenchmentPortion  float64 `json:"retrenchmentPortion"`
	RetrenchmentPortionCents int64 `json:"retrenchmentPortionCents"`
	RequiredCoverageBPS  int64   `json:"requiredCoverageBps"`
	PriorityRank         int     `json:"priorityRank"`
	Status               string  `json:"status"`
	StartDate            string  `json:"startDate"`
	EndDate              string  `json:"endDate"`
	CreatedAt            string  `json:"createdAt"`
}

type TokenCreateRequest struct {
	TokenID     string  `json:"tokenId"`
	PolicyID    string  `json:"policyId"`
	LoanID      string  `json:"loanId"`
	LenderID    string  `json:"lenderId"`
	LenderType  string  `json:"lenderType,omitempty"`
	BorrowerID  string  `json:"borrowerId"`
	LoanAmount  float64 `json:"loanAmount"`
	Amount      float64 `json:"amount"`
	RequiredCoverageBPS int64 `json:"requiredCoverageBps,omitempty"`
	StartDate   string  `json:"startDate"`
}

type CollateralCalculation struct {
	Eligible             bool    `json:"eligible"`
	Message              string  `json:"message"`
	LoanAmount           float64 `json:"loanAmount"`
	LoanAmountCents      int64   `json:"loanAmountCents"`
	CreditLifeRequired   float64 `json:"creditLifeRequired"`
	CreditLifeRequiredCents int64 `json:"creditLifeRequiredCents"`
	LifeCoverPortion     float64 `json:"lifeCoverPortion"`
	LifeCoverPortionCents int64  `json:"lifeCoverPortionCents"`
	RetrenchmentPortion  float64 `json:"retrenchmentPortion"`
	RetrenchmentPortionCents int64 `json:"retrenchmentPortionCents"`
	AvailableCollateral  float64 `json:"availableCollateral"`
	AvailableCollateralCents int64 `json:"availableCollateralCents"`
	Savings              float64 `json:"savings"`
	SavingsCents         int64   `json:"savingsCents"`
	SavingsPercentage    float64 `json:"savingsPercentage"`
	RequiredCoverageBPS  int64   `json:"requiredCoverageBps"`
}

type PolicyCollateralStatus struct {
	PolicyID               string  `json:"policyId"`
	HolderName             string  `json:"holderName"`
	TotalValue             float64 `json:"totalValue"`
	AvailableValue         float64 `json:"availableValue"`
	CededValue             float64 `json:"cededValue"`
	UtilizationPercentage  float64 `json:"utilizationPercentage"`
	AvailablePercentage    float64 `json:"availablePercentage"`
	ActiveCessions         int     `json:"activeCessions"`
	TotalCessions          int     `json:"totalCessions"`
	Status                 string  `json:"status"`
}

type AvailableCapacity struct {
	PolicyID                 string  `json:"policyId"`
	AvailableCollateral      float64 `json:"availableCollateral"`
	PotentialLoanAmount      float64 `json:"potentialLoanAmount"`
	PotentialCreditLifeCover float64 `json:"potentialCreditLifeCover"`
	LoanToValueRatio         float64 `json:"loanToValueRatio"`
	RemainingCapacity        float64 `json:"remainingCapacity"`
}

type PolicyholderPrivateData struct {
	IDNumber         string  `json:"idNumber"`
	PassportNumber   string  `json:"passportNumber"`
	DateOfBirth      string  `json:"dateOfBirth"`
	PhysicalAddress  string  `json:"physicalAddress"`
	EmailAddress     string  `json:"emailAddress"`
	PhoneNumber      string  `json:"phoneNumber"`
	BankAccount      string  `json:"bankAccount"`
	TaxID            string  `json:"taxId"`
	CreditScore      int     `json:"creditScore"`
	IncomeLevel      string  `json:"incomeLevel"`
	EmployerName     string  `json:"employerName"`
	EmploymentStatus string  `json:"employmentStatus"`
	YearsEmployed    int     `json:"yearsEmployed"`
	MonthlyIncome    float64 `json:"monthlyIncome"`
	Dependents       int     `json:"dependents"`
	MaritalStatus    string  `json:"maritalStatus"`
}

type MedicalUnderwritingData struct {
	PolicyID               string   `json:"policyId"`
	PolicyholderID         string   `json:"policyholderId"`
	PreExistingConditions  []string `json:"preExistingConditions"`
	CurrentMedications     []string `json:"currentMedications"`
	SmokingStatus          string   `json:"smokingStatus"`
	AlcoholConsumption     string   `json:"alcoholConsumption"`
	BMI                    float64  `json:"bmi"`
	UnderwritingClass      string   `json:"underwritingClass"`
	MortalityRating        int      `json:"mortalityRating"`
	RiskScore              float64  `json:"riskScore"`
	LastMedicalExam        string   `json:"lastMedicalExam"`
	ExamResultsHash        string   `json:"examResultsHash"`
	AttendingPhysician     string   `json:"attendingPhysician"`
	ConsentDate            string   `json:"consentDate"`
	ConsentExpiry          string   `json:"consentExpiry"`
}

type PremiumPaymentData struct {
	PolicyID            string             `json:"policyId"`
	PaymentID           string             `json:"paymentId"`
	PaymentAmount       float64            `json:"paymentAmount"`
	PaymentDate         string             `json:"paymentDate"`
	PaymentMethod       string             `json:"paymentMethod"`
	BankReference       string             `json:"bankReference"`
	BasePremium         float64            `json:"basePremium"`
	RiderPremiums       map[string]float64 `json:"riderPremiums"`
	TotalPremium        float64            `json:"totalPremium"`
	LatePaymentPenalty  float64            `json:"latePaymentPenalty"`
	GracePeriodEnd      string             `json:"gracePeriodEnd"`
	LapseDate           string             `json:"lapseDate"`
	BankAccountMask     string             `json:"bankAccountMask"`
	TransactionHash     string             `json:"transactionHash"`
}

type RegulatoryReportData struct {
	ReportID            string   `json:"reportId"`
	ReportType          string   `json:"reportType"`
	TotalPolicies       int      `json:"totalPolicies"`
	TotalValue          float64  `json:"totalValue"`
	TotalCessions       int      `json:"totalCessions"`
	CessedValue         float64  `json:"cessedValue"`
	AMLStatus           string   `json:"amlStatus"`
	KYCDocuments        []string `json:"kycDocuments"`
	SanctionsCheck      bool     `json:"sanctionsCheck"`
	ConcentrationRisk   float64  `json:"concentrationRisk"`
	LiquidityRatio      float64  `json:"liquidityRatio"`
	CapitalReserve      float64  `json:"capitalReserve"`
	AuditorNotes        string   `json:"auditorNotes"`
	ReportDate          string   `json:"reportDate"`
	ApprovedBy          string   `json:"approvedBy"`
}

type EnhancedPolicyContract struct {
	contractapi.Contract
}

func (c *EnhancedPolicyContract) RegisterPolicy(ctx contractapi.TransactionContextInterface, policyJSON string) (*PolicyAsset, error) {
	var policy PolicyAsset
	if err := json.Unmarshal([]byte(policyJSON), &policy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal policy: %v", err)
	}

	if policy.PolicyID == "" {
		return nil, fmt.Errorf("policyId is required")
	}
	if policy.HolderName == "" {
		return nil, fmt.Errorf("holderName is required")
	}
	if policy.TotalValue <= 0 {
		return nil, fmt.Errorf("policy total value must be positive")
	}

	exists, err := c.PolicyExists(ctx, policy.PolicyID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("policy %s already exists", policy.PolicyID)
	}

	if policy.DeathCover == 0 && policy.DisabilityCover == 0 &&
		policy.CriticalIllnessCover == 0 && policy.RetrenchmentCover == 0 {
		policy.DeathCover = round2(policy.TotalValue * 0.55)
		policy.DisabilityCover = round2(policy.TotalValue * 0.20)
		policy.CriticalIllnessCover = round2(policy.TotalValue * 0.15)
		policy.RetrenchmentCover = round2(policy.TotalValue * 0.10)
	}

	policy.AvailableValue = round2(policy.TotalValue)
	policy.CededValue = 0
	policy.ActiveCessions = []string{}
	policy.TotalCessions = 0
	if policy.Status == "" {
		policy.Status = "active"
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}
	policy.CreatedAt = now
	policy.UpdatedAt = now

	if err := c.putPolicy(ctx, &policy); err != nil {
		return nil, err
	}

	return &policy, nil
}

func (c *EnhancedPolicyContract) CreatePolicy(ctx contractapi.TransactionContextInterface, policyJSON string) (*PolicyAsset, error) {
	return c.RegisterPolicy(ctx, policyJSON)
}

func (c *EnhancedPolicyContract) QueryPolicy(ctx contractapi.TransactionContextInterface, policyID string) (*PolicyAsset, error) {
	policyBytes, err := ctx.GetStub().GetState(policyKey(policyID))
	if err != nil {
		return nil, fmt.Errorf("failed to read policy: %v", err)
	}
	if policyBytes == nil {
		return nil, fmt.Errorf("policy %s does not exist", policyID)
	}

	var policy PolicyAsset
	if err := json.Unmarshal(policyBytes, &policy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal policy: %v", err)
	}
	normalizePolicy(&policy)

	return &policy, nil
}

func (c *EnhancedPolicyContract) GetAllPolicies(ctx contractapi.TransactionContextInterface) ([]*PolicyAsset, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange(policyPrefix, policyPrefix+"\uffff")
	if err != nil {
		return nil, fmt.Errorf("failed to get policies: %v", err)
	}
	defer resultsIterator.Close()

	var policies []*PolicyAsset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate policies: %v", err)
		}

		var policy PolicyAsset
		if err := json.Unmarshal(queryResponse.Value, &policy); err != nil {
			continue
		}
		normalizePolicy(&policy)
		policies = append(policies, &policy)
	}

	sort.Slice(policies, func(i, j int) bool {
		return policies[i].PolicyID < policies[j].PolicyID
	})

	return policies, nil
}

func (c *EnhancedPolicyContract) GetAvailableCollateral(ctx contractapi.TransactionContextInterface) ([]*PolicyAsset, error) {
	policies, err := c.GetAllPolicies(ctx)
	if err != nil {
		return nil, err
	}

	var available []*PolicyAsset
	for _, policy := range policies {
		if policy.Status == "active" && policy.AvailableValue > 0 {
			available = append(available, policy)
		}
	}

	return available, nil
}

func (c *EnhancedPolicyContract) CalculateAvailableCollateral(ctx contractapi.TransactionContextInterface, policyID string, loanAmountValue string) (*CollateralCalculation, error) {
	policy, err := c.QueryPolicy(ctx, policyID)
	if err != nil {
		return nil, err
	}

	loanAmount, err := strconv.ParseFloat(loanAmountValue, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid loan amount: %v", err)
	}
	if loanAmount <= 0 {
		return nil, fmt.Errorf("loan amount must be positive")
	}

	return c.buildCollateralCalculation(policy, loanAmount, defaultRequiredCoverageBPS), nil
}

func (c *EnhancedPolicyContract) CreateCessionToken(ctx contractapi.TransactionContextInterface, tokenJSON string) (*CessionToken, error) {
	var request TokenCreateRequest
	if err := json.Unmarshal([]byte(tokenJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal token request: %v", err)
	}

	if request.PolicyID == "" {
		return nil, fmt.Errorf("policyId is required")
	}

	policy, err := c.QueryPolicy(ctx, request.PolicyID)
	if err != nil {
		return nil, err
	}
	if policy.Status != "active" {
		return nil, fmt.Errorf("policy %s is not active", request.PolicyID)
	}

	coverageBPS := request.RequiredCoverageBPS
	if coverageBPS == 0 {
		coverageBPS = defaultRequiredCoverageBPS
	}
	if coverageBPS <= 0 || coverageBPS > 10000 {
		return nil, fmt.Errorf("requiredCoverageBps must be between 1 and 10000")
	}

	loanAmountCents := amountToCents(request.LoanAmount)
	totalSecuredCents := amountToCents(request.Amount)

	switch {
	case loanAmountCents > 0 && totalSecuredCents == 0:
		totalSecuredCents = mulBPSRounded(loanAmountCents, coverageBPS)
	case totalSecuredCents > 0 && loanAmountCents == 0:
		loanAmountCents = divBPSRounded(totalSecuredCents, coverageBPS)
	case totalSecuredCents <= 0 && loanAmountCents <= 0:
		return nil, fmt.Errorf("loanAmount or amount is required")
	}

	calculation := c.buildCollateralCalculation(policy, centsToAmount(loanAmountCents), coverageBPS)
	if !calculation.Eligible {
		return nil, fmt.Errorf(calculation.Message)
	}

	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}
	token := &CessionToken{
		TokenID:                request.TokenID,
		PolicyID:               request.PolicyID,
		LoanID:                 request.LoanID,
		LenderID:               request.LenderID,
		LenderType:             request.LenderType,
		BorrowerID:             request.BorrowerID,
		LoanAmount:             centsToAmount(loanAmountCents),
		LoanAmountCents:        loanAmountCents,
		Amount:                 centsToAmount(calculation.CreditLifeRequiredCents),
		AmountCents:            calculation.CreditLifeRequiredCents,
		TotalSecured:           centsToAmount(calculation.CreditLifeRequiredCents),
		TotalSecuredCents:      calculation.CreditLifeRequiredCents,
		LifeCoverPortion:       centsToAmount(calculation.LifeCoverPortionCents),
		LifeCoverPortionCents:  calculation.LifeCoverPortionCents,
		RetrenchmentPortion:    centsToAmount(calculation.RetrenchmentPortionCents),
		RetrenchmentPortionCents: calculation.RetrenchmentPortionCents,
		RequiredCoverageBPS:    coverageBPS,
		PriorityRank:           len(policy.ActiveCessions) + 1,
		Status:                 "active",
		StartDate:              coalesceTimestamp(request.StartDate, now),
		EndDate:                "",
		CreatedAt:              now,
	}

	if token.TokenID == "" {
		token.TokenID = tokenIDFromTimestamp(ctx)
	}
	if token.LoanID == "" {
		token.LoanID = fmt.Sprintf("LOAN-%s", ctx.GetStub().GetTxID())
	}

	policy.AvailableValue = centsToAmount(amountToCents(policy.AvailableValue) - token.TotalSecuredCents)
	policy.CededValue = centsToAmount(amountToCents(policy.CededValue) + token.TotalSecuredCents)
	policy.ActiveCessions = append(policy.ActiveCessions, token.TokenID)
	policy.TotalCessions++
	policy.UpdatedAt = now

	if err := c.putPolicy(ctx, policy); err != nil {
		return nil, err
	}
	if err := c.putToken(ctx, token); err != nil {
		return nil, err
	}

	return token, nil
}

func (c *EnhancedPolicyContract) ReleaseCessionToken(ctx contractapi.TransactionContextInterface, tokenID string) (*CessionToken, error) {
	token, err := c.GetCessionToken(ctx, tokenID)
	if err != nil {
		return nil, err
	}
	if token.Status != "active" {
		return nil, fmt.Errorf("token %s is not active (status: %s)", tokenID, token.Status)
	}

	policy, err := c.QueryPolicy(ctx, token.PolicyID)
	if err != nil {
		return nil, err
	}

	tokenSecuredCents := token.TotalSecuredCents
	if tokenSecuredCents == 0 {
		tokenSecuredCents = amountToCents(token.TotalSecured)
	}

	policy.AvailableValue = centsToAmount(amountToCents(policy.AvailableValue) + tokenSecuredCents)
	policy.CededValue = centsToAmount(amountToCents(policy.CededValue) - tokenSecuredCents)
	if policy.CededValue < 0 {
		policy.CededValue = 0
	}

	var remaining []string
	for _, id := range policy.ActiveCessions {
		if id != tokenID {
			remaining = append(remaining, id)
		}
	}
	policy.ActiveCessions = remaining
	normalizePolicy(policy)
	now, err := txTimestampRFC3339(ctx)
	if err != nil {
		return nil, err
	}
	policy.UpdatedAt = now

	token.Status = "released"
	token.EndDate = now

	if err := c.putPolicy(ctx, policy); err != nil {
		return nil, err
	}
	if err := c.putToken(ctx, token); err != nil {
		return nil, err
	}

	return token, nil
}

func (c *EnhancedPolicyContract) GetPolicyCollateralStatus(ctx contractapi.TransactionContextInterface, policyID string) (*PolicyCollateralStatus, error) {
	policy, err := c.QueryPolicy(ctx, policyID)
	if err != nil {
		return nil, err
	}

	status := &PolicyCollateralStatus{
		PolicyID:              policy.PolicyID,
		HolderName:            policy.HolderName,
		TotalValue:            policy.TotalValue,
		AvailableValue:        policy.AvailableValue,
		CededValue:            policy.CededValue,
		UtilizationPercentage: 0,
		AvailablePercentage:   0,
		ActiveCessions:        len(policy.ActiveCessions),
		TotalCessions:         policy.TotalCessions,
		Status:                policy.Status,
	}

	if policy.TotalValue > 0 {
		status.UtilizationPercentage = round2((policy.CededValue / policy.TotalValue) * 100)
		status.AvailablePercentage = round2((policy.AvailableValue / policy.TotalValue) * 100)
	}

	return status, nil
}

func (c *EnhancedPolicyContract) GetCessionToken(ctx contractapi.TransactionContextInterface, tokenID string) (*CessionToken, error) {
	tokenBytes, err := ctx.GetStub().GetState(tokenKey(tokenID))
	if err != nil {
		return nil, fmt.Errorf("failed to read token: %v", err)
	}
	if tokenBytes == nil {
		return nil, fmt.Errorf("token %s does not exist", tokenID)
	}

	var token CessionToken
	if err := json.Unmarshal(tokenBytes, &token); err != nil {
		return nil, fmt.Errorf("failed to unmarshal token: %v", err)
	}

	return &token, nil
}

func (c *EnhancedPolicyContract) GetPolicyCessions(ctx contractapi.TransactionContextInterface, policyID string) ([]*CessionToken, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange(tokenPrefix, tokenPrefix+"\uffff")
	if err != nil {
		return nil, fmt.Errorf("failed to get tokens: %v", err)
	}
	defer resultsIterator.Close()

	var tokens []*CessionToken
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate tokens: %v", err)
		}

		var token CessionToken
		if err := json.Unmarshal(queryResponse.Value, &token); err != nil {
			continue
		}
		if token.PolicyID == policyID {
			tokens = append(tokens, &token)
		}
	}

	sort.Slice(tokens, func(i, j int) bool {
		return tokens[i].PriorityRank < tokens[j].PriorityRank
	})

	return tokens, nil
}

func (c *EnhancedPolicyContract) GetAvailableCapacity(ctx contractapi.TransactionContextInterface, policyID string) (*AvailableCapacity, error) {
	policy, err := c.QueryPolicy(ctx, policyID)
	if err != nil {
		return nil, err
	}

	capacity := &AvailableCapacity{
		PolicyID:                 policy.PolicyID,
		AvailableCollateral:      round2(policy.AvailableValue),
		PotentialLoanAmount:      0,
		PotentialCreditLifeCover: round2(policy.AvailableValue),
		LoanToValueRatio:         0,
		RemainingCapacity:        round2(policy.AvailableValue),
	}

	if policy.AvailableValue > 0 {
		capacity.PotentialLoanAmount = centsToAmount(divBPSRounded(amountToCents(policy.AvailableValue), defaultRequiredCoverageBPS))
	}
	if policy.TotalValue > 0 {
		capacity.LoanToValueRatio = round2((policy.CededValue / policy.TotalValue) * 100)
	}

	return capacity, nil
}

func (c *EnhancedPolicyContract) PolicyExists(ctx contractapi.TransactionContextInterface, policyID string) (bool, error) {
	policyBytes, err := ctx.GetStub().GetState(policyKey(policyID))
	if err != nil {
		return false, fmt.Errorf("failed to read policy %s: %v", policyID, err)
	}
	return policyBytes != nil, nil
}

func (c *EnhancedPolicyContract) StorePolicyholderPrivateData(ctx contractapi.TransactionContextInterface, policyID string) error {
	if _, err := c.QueryPolicy(ctx, policyID); err != nil {
		return err
	}
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload PolicyholderPrivateData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal policyholder private data: %v", err)
	}

	return putPrivateJSON(ctx, policyholderPrivateCollection, policyID, payload)
}

func (c *EnhancedPolicyContract) QueryPolicyholderPrivateData(ctx contractapi.TransactionContextInterface, policyID string) (*PolicyholderPrivateData, error) {
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	var payload PolicyholderPrivateData
	if err := getPrivateJSON(ctx, policyholderPrivateCollection, policyID, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedPolicyContract) StoreMedicalUnderwritingData(ctx contractapi.TransactionContextInterface, policyID string) error {
	if _, err := c.QueryPolicy(ctx, policyID); err != nil {
		return err
	}
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload MedicalUnderwritingData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal medical underwriting data: %v", err)
	}
	payload.PolicyID = policyID

	return putPrivateJSON(ctx, medicalUnderwritingCollection, policyID, payload)
}

func (c *EnhancedPolicyContract) QueryMedicalUnderwritingData(ctx contractapi.TransactionContextInterface, policyID string) (*MedicalUnderwritingData, error) {
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	var payload MedicalUnderwritingData
	if err := getPrivateJSON(ctx, medicalUnderwritingCollection, policyID, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedPolicyContract) StorePremiumPaymentData(ctx contractapi.TransactionContextInterface, policyID string, paymentID string) error {
	if _, err := c.QueryPolicy(ctx, policyID); err != nil {
		return err
	}
	if paymentID == "" {
		return fmt.Errorf("paymentId is required")
	}
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload PremiumPaymentData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal premium payment data: %v", err)
	}
	payload.PolicyID = policyID
	payload.PaymentID = paymentID
	if payload.RiderPremiums == nil {
		payload.RiderPremiums = map[string]float64{}
	}

	return putPrivateJSON(ctx, premiumPaymentCollection, premiumPaymentKey(policyID, paymentID), payload)
}

func (c *EnhancedPolicyContract) QueryPremiumPaymentData(ctx contractapi.TransactionContextInterface, policyID string, paymentID string) (*PremiumPaymentData, error) {
	if err := requireMSP(ctx, "InsurerMSP"); err != nil {
		return nil, err
	}

	var payload PremiumPaymentData
	if err := getPrivateJSON(ctx, premiumPaymentCollection, premiumPaymentKey(policyID, paymentID), &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedPolicyContract) StoreRegulatoryReport(ctx contractapi.TransactionContextInterface, reportID string) error {
	if reportID == "" {
		return fmt.Errorf("reportId is required")
	}
	if err := requireAnyMSP(ctx, "InsurerMSP", "LenderMSP"); err != nil {
		return err
	}

	privateBytes, err := getTransientPayload(ctx)
	if err != nil {
		return err
	}

	var payload RegulatoryReportData
	if err := json.Unmarshal(privateBytes, &payload); err != nil {
		return fmt.Errorf("failed to unmarshal regulatory report data: %v", err)
	}
	payload.ReportID = reportID

	return putPrivateJSON(ctx, regulatoryReportingCollection, reportID, payload)
}

func (c *EnhancedPolicyContract) QueryRegulatoryReport(ctx contractapi.TransactionContextInterface, reportID string) (*RegulatoryReportData, error) {
	if err := requireAnyMSP(ctx, "InsurerMSP", "LenderMSP"); err != nil {
		return nil, err
	}

	var payload RegulatoryReportData
	if err := getPrivateJSON(ctx, regulatoryReportingCollection, reportID, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *EnhancedPolicyContract) GetPrivateDataHash(ctx contractapi.TransactionContextInterface, collection string, key string) (string, error) {
	hashBytes, err := ctx.GetStub().GetPrivateDataHash(collection, key)
	if err != nil {
		return "", fmt.Errorf("failed to read private data hash: %v", err)
	}
	if hashBytes == nil {
		return "", fmt.Errorf("private data hash for key %s does not exist", key)
	}

	return fmt.Sprintf("%x", hashBytes), nil
}

func (c *EnhancedPolicyContract) putPolicy(ctx contractapi.TransactionContextInterface, policy *PolicyAsset) error {
	normalizePolicy(policy)
	payload, err := json.Marshal(policy)
	if err != nil {
		return fmt.Errorf("failed to marshal policy: %v", err)
	}

	if err := ctx.GetStub().PutState(policyKey(policy.PolicyID), payload); err != nil {
		return fmt.Errorf("failed to store policy: %v", err)
	}

	return nil
}

func (c *EnhancedPolicyContract) putToken(ctx contractapi.TransactionContextInterface, token *CessionToken) error {
	payload, err := json.Marshal(token)
	if err != nil {
		return fmt.Errorf("failed to marshal token: %v", err)
	}

	if err := ctx.GetStub().PutState(tokenKey(token.TokenID), payload); err != nil {
		return fmt.Errorf("failed to store token: %v", err)
	}

	return nil
}

func (c *EnhancedPolicyContract) buildCollateralCalculation(policy *PolicyAsset, loanAmount float64, requiredCoverageBPS int64) *CollateralCalculation {
	loanAmountCents := amountToCents(loanAmount)
	creditLifeRequiredCents := mulBPSRounded(loanAmountCents, requiredCoverageBPS)
	existingCoverCents := amountToCents(policy.DeathCover + policy.DisabilityCover + policy.CriticalIllnessCover)
	lifeCoverPortionCents := minInt64(mulBPSRounded(creditLifeRequiredCents, lifeCoverSplitBPS), existingCoverCents)
	retrenchmentPortionCents := creditLifeRequiredCents - lifeCoverPortionCents
	availableCollateralCents := amountToCents(policy.AvailableValue)

	eligible := policy.Status == "active" && availableCollateralCents >= creditLifeRequiredCents
	message := "Policy has sufficient programmable collateral"
	if !eligible {
		message = fmt.Sprintf(
			"Insufficient available collateral. Required: %.2f, Available: %.2f",
			centsToAmount(creditLifeRequiredCents),
			centsToAmount(availableCollateralCents),
		)
	}

	return &CollateralCalculation{
		Eligible:                 eligible,
		Message:                  message,
		LoanAmount:               centsToAmount(loanAmountCents),
		LoanAmountCents:          loanAmountCents,
		CreditLifeRequired:       centsToAmount(creditLifeRequiredCents),
		CreditLifeRequiredCents:  creditLifeRequiredCents,
		LifeCoverPortion:         centsToAmount(lifeCoverPortionCents),
		LifeCoverPortionCents:    lifeCoverPortionCents,
		RetrenchmentPortion:      centsToAmount(retrenchmentPortionCents),
		RetrenchmentPortionCents: retrenchmentPortionCents,
		AvailableCollateral:      centsToAmount(availableCollateralCents),
		AvailableCollateralCents: availableCollateralCents,
		Savings:                  centsToAmount(lifeCoverPortionCents),
		SavingsCents:             lifeCoverPortionCents,
		SavingsPercentage:        80,
		RequiredCoverageBPS:      requiredCoverageBPS,
	}
}

func policyKey(policyID string) string {
	return policyPrefix + policyID
}

func tokenKey(tokenID string) string {
	return tokenPrefix + tokenID
}

func tokenIDFromTimestamp(ctx contractapi.TransactionContextInterface) string {
	return fmt.Sprintf("CT-%s", ctx.GetStub().GetTxID())
}

func txTimestampRFC3339(ctx contractapi.TransactionContextInterface) (string, error) {
	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to get transaction timestamp: %v", err)
	}

	ts := time.Unix(txTime.Seconds, int64(txTime.Nanos)).UTC()
	return ts.Format(time.RFC3339), nil
}

func coalesceTimestamp(value string, fallback string) string {
	if value != "" {
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

func amountToCents(value float64) int64 {
	return int64(math.Round(value * 100))
}

func centsToAmount(cents int64) float64 {
	return round2(float64(cents) / 100)
}

func mulBPSRounded(value int64, bps int64) int64 {
	return (value*bps + 5000) / 10000
}

func divBPSRounded(value int64, bps int64) int64 {
	if bps <= 0 {
		return 0
	}
	return (value*10000 + (bps / 2)) / bps
}

func round2(value float64) float64 {
	rounded, _ := strconv.ParseFloat(fmt.Sprintf("%.2f", value), 64)
	return rounded
}

func normalizePolicy(policy *PolicyAsset) {
	if policy.ActiveCessions == nil {
		policy.ActiveCessions = []string{}
	}
}

func premiumPaymentKey(policyID string, paymentID string) string {
	return fmt.Sprintf("%s::%s", policyID, paymentID)
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

func requireMSP(ctx contractapi.TransactionContextInterface, allowedMSP string) error {
	return requireAnyMSP(ctx, allowedMSP)
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
	chaincode, err := contractapi.NewChaincode(new(EnhancedPolicyContract))
	if err != nil {
		fmt.Printf("Error creating enhanced policy chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting enhanced policy chaincode: %v", err)
	}
}
