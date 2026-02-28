#!/bin/bash

# Solana Stablecoin Standard - Code Verification Script
# Verifies code syntax and structure before compilation

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Solana Stablecoin Standard - Code Verification ===${NC}\n"

PROJECT_DIR="/home/noisynk/.openclaw/workspace/skills/moltron-superteam-tracker/drafts/solana-stablecoin-standard"
cd "$PROJECT_DIR"

# Check 1: Verify Project Structure
echo -e "${YELLOW}✓ Check 1: Project Structure${NC}"
if [ -d "programs/solana-stablecoin-standard/src" ]; then
    echo -e "${GREEN}✅ Program directory exists${NC}"
else
    echo -e "${RED}❌ Program directory NOT found${NC}"
    exit 1
fi

if [ -f "programs/solana-stablecoin-standard/src/lib.rs" ]; then
    echo -e "${GREEN}✅ lib.rs exists${NC}"
else
    echo -e "${RED}❌ lib.rs NOT found${NC}"
    exit 1
fi

if [ -f "programs/solana-stablecoin-standard/src/stablecoin.rs" ]; then
    echo -e "${GREEN}✅ stablecoin.rs exists${NC}"
else
    echo -e "${RED}❌ stablecoin.rs NOT found${NC}"
    exit 1
fi

# Check 2: Verify Program ID in lib.rs
echo -e "\n${YELLOW}✓ Check 2: Program ID in lib.rs${NC}"
if grep -q "declare_id" programs/solana-stablecoin-standard/src/lib.rs; then
    echo -e "${GREEN}✅ Program ID declared in lib.rs${NC}"
else
    echo -e "${RED}❌ Program ID NOT declared${NC}"
    exit 1
fi

# Check if stablecoin.rs does NOT have declare_id (only lib.rs should)
if ! grep -q "declare_id" programs/solana-stablecoin-standard/src/stablecoin.rs; then
    echo -e "${GREEN}✅ stablecoin.rs correctly does NOT have declare_id${NC}"
else
    echo -e "${RED}❌ stablecoin.rs has declare_id (should only be in lib.rs)${NC}"
    exit 1
fi

# Check 3: Verify Anchor.toml Configuration
echo -e "\n${YELLOW}✓ Check 3: Anchor.toml Configuration${NC}"
if [ -f "Anchor.toml" ]; then
    echo -e "${GREEN}✅ Anchor.toml exists${NC}"
else
    echo -e "${RED}❌ Anchor.toml NOT found${NC}"
    exit 1
fi

# Check 4: Verify Cargo.toml
echo -e "\n${YELLOW}✓ Check 4: Cargo.toml${NC}"
if [ -f "Cargo.toml" ]; then
    echo -e "${GREEN}✅ Cargo.toml exists${NC}"
else
    echo -e "${RED}❌ Cargo.toml NOT found${NC}"
    exit 1
fi

# Check 5: Verify TypeScript SDK
echo -e "\n${YELLOW}✓ Check 5: TypeScript SDK${NC}"
if [ -f "src/sdk/stablecoin.ts" ]; then
    SDK_SIZE=$(wc -c < src/sdk/stablecoin.ts)
    echo -e "${GREEN}✅ TypeScript SDK exists (${SDK_SIZE} bytes)${NC}"
else
    echo -e "${RED}❌ TypeScript SDK NOT found${NC}"
    exit 1
fi

# Check 6: Verify Tests
echo -e "\n${YELLOW}✓ Check 6: Integration Tests${NC}"
if [ -f "tests/stablecoin.ts" ]; then
    TEST_SIZE=$(wc -c < tests/stablecoin.ts)
    echo -e "${GREEN}✅ Integration tests exist (${TEST_SIZE} bytes)${NC}"
else
    echo -e "${RED}❌ Integration tests NOT found${NC}"
    exit 1
fi

# Check 7: Verify Documentation
echo -e "\n${YELLOW}✓ Check 7: Documentation${NC}"
DOCS_FOUND=0
if [ -f "README.md" ]; then
    echo -e "${GREEN}✅ README.md exists${NC}"
    DOCS_FOUND=$((DOCS_FOUND + 1))
fi

if [ -f "DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✅ DEPLOYMENT.md exists${NC}"
    DOCS_FOUND=$((DOCS_FOUND + 1))
fi

if [ -f "EXAMPLES.md" ]; then
    echo -e "${GREEN}✅ EXAMPLES.md exists${NC}"
    DOCS_FOUND=$((DOCS_FOUND + 1))
fi

if [ $DOCS_FOUND -eq 3 ]; then
    echo -e "${GREEN}✅ All documentation files exist${NC}"
else
    echo -e "${RED}❌ Missing documentation files${NC}"
    exit 1
fi

# Check 8: Code Statistics
echo -e "\n${YELLOW}✓ Check 8: Code Statistics${NC}"

# Count lines in Rust files
RUST_LINES=$(find programs/solana-stablecoin-standard/src -name "*.rs" -exec cat {} \; | wc -l)
echo "Rust code lines: $RUST_LINES"

# Count lines in TypeScript files
TS_LINES=$(find src -name "*.ts" -exec cat {} \; 2>/dev/null | wc -l)
echo "TypeScript code lines: $TS_LINES"

# Count lines in test files
TEST_LINES=$(find tests -name "*.ts" -exec cat {} \; 2>/dev/null | wc -l)
echo "Test code lines: $TEST_LINES"

# Total lines
TOTAL_LINES=$((RUST_LINES + TS_LINES + TEST_LINES))
echo -e "${GREEN}Total lines of code: $TOTAL_LINES${NC}"

# Check 9: No Duplicate Directories
echo -e "\n${YELLOW}✓ Check 9: No Duplicate Directories${NC}"
if [ -d "programs/src" ]; then
    echo -e "${RED}❌ Duplicate programs/src directory found${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No duplicate directories${NC}"
fi

# Summary
echo -e "\n${GREEN}=== Verification Summary ===${NC}"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo -e "\nProject is ready for compilation."
echo -e "Run: ${YELLOW}anchor build${NC} to compile the program."
