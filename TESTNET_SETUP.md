# Testnet Setup Guide

This guide walks you through setting up your environment to run Veil against the Stellar testnet.

## Prerequisites

- [Rust](https://rustup.rs/) with the `wasm32-unknown-unknown` target
- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

## Step 1: Install the Stellar CLI

The Stellar CLI is required to interact with the network, deploy contracts, and manage accounts.

```bash
cargo install stellar-cli --locked
```

Verify the installation:

```bash
stellar --version
```

## Step 2: Create and Fund a Testnet Account

Generate a new keypair and fund it with testnet XLM using Friendbot.

```bash
# Generate a new keypair
stellar keys generate --global veil-testnet --network testnet

# Fund the account with testnet XLM
stellar keys fund veil-testnet --network testnet
```

Keep the secret key safe. You'll need it for deploying contracts.

## Step 3: Build the Contract

```bash
cd contracts/invisible_wallet
cargo build --target wasm32-unknown-unknown --release
```

## Step 4: Deploy the Factory Contract

Create the deploy_factory.sh script if it doesn't exist, then run it:

```bash
# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create the deploy script (example)
cat > scripts/deploy_factory.sh << 'EOF'
#!/bin/bash
set -e

source .env.local

CONTRACT_WASM="../contracts/invisible_wallet/target/wasm32-unknown-unknown/release/invisible_wallet.wasm"

# Deploy the contract
stellar contract deploy \
  --wasm "$CONTRACT_WASM" \
  --source veil-testnet \
  --network testnet \
  --ignore-checks
EOF

chmod +x scripts/deploy_factory.sh

# Run the deploy script
./scripts/deploy_factory.sh
```

The script will output the factory contract address. Copy this value.

## Step 5: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and fill in the FACTORY_ADDRESS with the value from Step 4
```

Your `.env.local` should look like:

```bash
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_FACTORY_ADDRESS=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
FACTORY_ADDRESS=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Step 6: Build the SDK

```bash
cd sdk
npm install
npm run build
```

## Step 7: Run the Smoke Test

Create the smoke_test.ts script if it doesn't exist:

```bash
cat > scripts/smoke_test.ts << 'EOF'
import "dotenv/config";
import { Server } from "stellar-sdk";

const RPC_URL = process.env.RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;

if (!FACTORY_ADDRESS) {
  console.error("ERROR: FACTORY_ADDRESS not set in environment");
  process.exit(1);
}

async function main() {
  console.log("Testing RPC connection...");
  const server = new Server(RPC_URL);
  
  try {
    const health = await server.getHealth();
    console.log("RPC Health:", health);
  } catch (error) {
    console.error("Failed to connect to RPC:", error);
    process.exit(1);
  }

  console.log("\nVerifying factory contract exists...");
  try {
    const contract = await server.getContract(FACTORY_ADDRESS);
    console.log("Factory contract found:", FACTORY_ADDRESS);
  } catch (error) {
    console.error("Factory contract not found:", error);
    process.exit(1);
  }

  console.log("\n✅ Smoke test passed!");
  console.log("RPC URL:", RPC_URL);
  console.log("Network:", NETWORK_PASSPHRASE);
  console.log("Factory Address:", FACTORY_ADDRESS);
}

main();
EOF
```

Run the smoke test:

```bash
# If using ts-node
npx ts-node scripts/smoke_test.ts

# Or compile and run
npx tsc scripts/smoke_test.ts --outDir dist && node dist/smoke_test.js
```

## Step 8: Run the Demo App

```bash
cd frontend/website
npm install
npm run dev
```

Open http://localhost:3000 in your browser. The demo app will use the environment variables from `.env.local`.

## Troubleshooting

### "Connection refused" errors
- Verify your RPC_URL is correct: `https://soroban-testnet.stellar.org`
- Check your internet connection

### "Account not found" errors
- Ensure you funded your account with Friendbot in Step 2

### Contract deployment fails
- Ensure you have enough testnet XLM balance
- Verify the WASM file exists at the expected path

## Cleaning Up

To remove testnet accounts and reset:

```bash
stellar keys rm veil-testnet
```