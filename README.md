# CEDEX Demo Guide

## 1) What This Project Demonstrates
CEDEX is a Hyperledger Fabric demo for **policy-backed lending cessions** in Namibia.

It demonstrates:
1. Deterministic cession lifecycle on-chain (`requested -> consented -> insurer_approved -> active`).
2. Separation of borrower, insurer, and lender workflows.
3. Private data collection usage for sensitive records.
4. Full auditability through ledger history and Hyperledger Explorer.

## 2) Live Architecture (Current)
1. Channel: `cessionchannel`
2. Orgs:
   1. `InsurerMSP`
   2. `LenderMSP`
3. Chaincodes:
   1. `policy` (private policy-side data + collateral calculations)
   2. `cession` (lifecycle transitions + lender-side private portfolio)
4. App layer:
   1. Role/persona mapping for borrower, insurer, lender using current MSP setup.

## 3) Critical Roles
1. Borrower (natural person)
   1. Views personal policies.
   2. Consents to cession requests.
2. Insurer (institution)
   1. Reviews and approves borrower-consented cessions.
   2. Maintains underwriting private data.
3. Lender (institution)
   1. Requests cessions against eligible policy collateral.
   2. Activates approved cessions.
   3. Maintains lender private portfolio data.

## 4) Key Chaincode Functions
### `chaincode/policy/policy.go`
1. `CreatePolicy`
2. `GetAvailableCollateral`
3. `CalculateAvailableCollateral`
4. `StorePolicyholderPrivateData`
5. `QueryPolicyholderPrivateData`
6. `StoreMedicalUnderwritingData`
7. `QueryMedicalUnderwritingData`
8. `GetPrivateDataHash`

### `chaincode/cession/cession.go`
1. `RequestCessionApproval`
2. `BorrowerConsentCession`
3. `InsurerApproveCession`
4. `ActivateApprovedCession`
5. `ReleaseCession`
6. `StoreLenderPortfolioData`
7. `QueryLenderPortfolioData`
8. `GetPrivateDataHash`

## 5) UI Capabilities
1. Login with lender, borrower, insurer personas.
2. Dashboard action panels for all three lifecycle transitions.
3. Status legend badges (`requested`, `consented`, `insurer_approved`, `active`).
4. Policy and cession cards with improved demo styling.
5. Policy modal with borrower narrative from private data.
6. NAD denomination display (`N$`) for monetary values.

## 6) Integrations
1. Hyperledger Fabric 2.5 (orderer + peers + chaincodes).
2. Node.js API (`server.js`) + Fabric Gateway (`fabric-gateway.js`).
3. React + Vite frontend.
4. Hyperledger Explorer + PostgreSQL.
5. Docker Compose orchestration.

## 7) Quick Start
Run from repo root: `c:\Users\Ronaldo Nanub\Desktop\cedex`

1. Start Fabric + Explorer:
```powershell
docker compose up -d
```

2. Setup wallet identities:
```powershell
npm run setup-wallet
```

3. Start backend API:
```powershell
npm start
```

4. Start frontend:
```powershell
cd frontend
npm run dev
```

5. Open:
1. Frontend: `http://127.0.0.1:5173/`
2. API health: `http://127.0.0.1:5000/api/health`
3. Explorer: `http://127.0.0.1:8080/#/`

## 8) Demo Credentials
1. `lender@cedex.local / password123`
2. `borrower@cedex.local / password123`
3. `insurer@cedex.local / password123`

## 9) Demo Scenario (End-to-End)
1. Login as lender and submit a cession request.
2. Login as borrower and consent to that request.
3. Login as insurer and approve the consented request.
4. Login as lender and activate the approved cession.
5. Verify:
   1. Status progression in UI.
   2. Updated policy collateral usage.
   3. Transactions visible in Explorer.
   4. Private data reads by role work as expected.

## 10) Useful API Endpoints
1. Health: `GET /api/health`
2. Demo private profiles: `GET /api/demo/private-profiles`
3. Cession transitions:
   1. `POST /api/cessions/:cessionId/consent`
   2. `POST /api/cessions/:cessionId/approve`
   3. `POST /api/cessions/:cessionId/activate`
4. Private data:
   1. `GET /api/policies/:policyId/private/policyholder`
   2. `GET /api/policies/:policyId/private/medical`
   3. `GET /api/cessions/:cessionId/private/portfolio`

## 11) Troubleshooting
1. Frontend not loading:
   1. Ensure `npm run dev` is running in `frontend/`.
   2. Confirm `http://127.0.0.1:5173/`.
2. API unreachable:
   1. Ensure `npm start` is running in repo root.
   2. Confirm `http://127.0.0.1:5000/api/health` returns `ok`.
3. Explorer blank page:
   1. Restart explorer services:
```powershell
docker compose restart explorer-db explorer
```
4. Fabric/chaincode issues:
   1. Check container logs:
```powershell
docker logs --tail 120 peer0.insurer.cedex.com
docker logs --tail 120 peer0.lender.cedex.com
docker logs --tail 120 explorer
```

