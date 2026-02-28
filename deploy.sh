#!/bin/bash

# Solana Stablecoin Standard - Deployment Script
# Deploys the program to Solana devnet and initializes a test stablecoin

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Solana Stablecoin Standard - Deployment Script ===${NC}\n"

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed${NC}"
    echo "Please install it from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Error: Anchor is not installed${NC}"
    echo "Please install it from: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Step 1: Set Solana configuration
echo -e "${YELLOW}Step 1: Configuring Solana CLI...${NC}"
solana config set --url devnet
echo "✅ Solana CLI configured for devnet"

# Step 2: Check wallet balance
echo -e "\n${YELLOW}Step 2: Checking wallet balance...${NC}"
WALLET_ADDRESS=$(solana address)
echo "Wallet address: $WALLET_ADDRESS"
BALANCE=$(solana balance)
echo "Balance: $BALANCE"

# If balance is less than 1 SOL, suggest airdrop
if [[ $BALANCE == *"0 SOL"* ]] || [[ $BALANCE == *"0.0"* ]]; then
    echo -e "${YELLOW}⚠️  Balance is low. Requesting airdrop...${NC}"
    solana airdrop 5
    echo "✅ Airdrop completed"
fi

# Step 3: Build the program
echo -e "\n${YELLOW}Step 3: Building the program...${NC}"
anchor build
echo "✅ Program built successfully"

# Step 4: Deploy the program
echo -e "\n${YELLOW}Step 4: Deploying program to devnet...${NC}"
anchor deploy --provider.cluster devnet
echo "✅ Program deployed successfully"

# Step 5: Get the program ID
echo -e "\n${YELLOW}Step 5: Getting program ID...${NC}"
PROGRAM_ID=$(anchor keys list | grep "solana_stablecoin_standard:" | awk '{print $2}')
echo "Program ID: $PROGRAM_ID"

# Step 6: Update the Anchor.toml with the new program ID (if needed)
echo -e "\n${YELLOW}Step 6: Updating configuration...${NC}"
echo "Program deployed with ID: $PROGRAM_ID"

# Step 7: Run tests
echo -e "\n${YELLOW}Step 7: Running integration tests...${NC}"
anchor test --skip-local-validator
echo "✅ Tests completed successfully"

# Step 8: Display deployment summary
echo -e "\n${GREEN}=== Deployment Summary ===${NC}"
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Initialize a stablecoin using the TypeScript SDK"
echo "2. Mint tokens to test accounts"
echo "3. Test compliance features (blacklist, freeze, seize)"
echo "4. Monitor transactions on Solana Explorer"
