# CEDEX One-Pager

## Vision
CEDEX is a blockchain-backed collateral cession platform that lets borrowers unlock credit from existing insurance cover through a deterministic, auditable approval flow.

## Problem
Traditional policy-backed lending is slow, opaque, and operationally fragmented:
1. Lenders struggle to trust collateral availability in real time.
2. Borrower consent and insurer approval are hard to trace.
3. Sensitive data is often over-shared across parties.

## Solution
CEDEX coordinates borrower, insurer, and lender interactions on Hyperledger Fabric with deterministic smart-contract logic and role-based private data access.

Core workflow:
1. Lender requests cession.
2. Borrower consents.
3. Insurer approves.
4. Lender activates cession.

Status model:
1. `requested`
2. `consented`
3. `insurer_approved`
4. `active`

## Why It Matters
1. Faster loan processing through a standard on-chain flow.
2. Verifiable collateral state and immutable transaction history.
3. Better compliance posture with private collections and data hashing.
4. Lower operational risk from deterministic transitions.

## Product Snapshot
1. Hyperledger Fabric network with `InsurerMSP` and `LenderMSP`.
2. Chaincodes:
   1. `policy` for policy lifecycle, collateral calculations, and policy private data.
   2. `cession` for cession lifecycle, lender terms, and lender private portfolio data.
3. Node.js API for application access and role mapping.
4. React dashboard UI for lender, borrower, and insurer personas.
5. Hyperledger Explorer for transparent ledger visibility.

## Security and Privacy
1. Immutable ledger records for every transition.
2. Private data collections for borrower/insurer/lender sensitive records.
3. Private data hash verification for integrity proofs.
4. Access enforcement by org membership plus app-level persona controls.

## Demo Roles
1. Borrower (natural person): policy visibility + consent actions.
2. Insurer (institution): approval actions + underwriting data ownership.
3. Lender (institution): cession request/activation + portfolio management.

## Key Demo Credentials
1. `lender@cedex.local / password123`
2. `borrower@cedex.local / password123`
3. `insurer@cedex.local / password123`

## Live Demo URLs
1. Frontend: `http://127.0.0.1:5173/`
2. API Health: `http://127.0.0.1:5000/api/health`
3. Explorer: `http://127.0.0.1:8080/#/`

## MVP Status
1. End-to-end lifecycle transitions are operational.
2. Private data pathways are functional.
3. Dashboard action panels support all main transitions.
4. NAD-denominated UI values and status legends are in place.

## Next Growth Steps
1. Expand to multi-MSP topology (`PolicyholderMSP`, `BankMSP`, `RegulatorMSP`).
2. Add regulator read models and dispute workflows.
3. Add production-grade observability, backups, and SLA monitoring.
4. Integrate external KYC/credit and insurer core systems.

