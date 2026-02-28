# Deployment Guide - Solana SSS-2 Compliant Stablecoin

Complete guide for deploying SSS-2 Compliant Stablecoin to Solana devnet with Transfer Hook integration.

**Transfer Hook is OPTIONAL** - you can deploy without it for basic stablecoin functionality, or with it for real-time blacklist enforcement.

## 📋 Prerequisites

### Required Software
```bash
# Solana CLI (v1.17+)
solana --version

# Anchor Framework (v0.29.0+)
anchor --version

# Rust (v1.70+)
rustc --version

# Node.js (v18+)
node --version
```

### Solana Configuration
```bash
# Configure for devnet
solana config set --url devnet

# Generate a new keypair (if needed)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your address
solana address
```

---

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/your-repo/solana-stablecoin-standard.git
cd solana-stablecoin-standard

# Run deployment script
./deploy.sh
```

The script will:
1. ✅ Configure Solana CLI for devnet
2. ✅ Build programs
3. ✅ Deploy Transfer Hook program (optional)
4. ✅ Deploy Stablecoin program
5. ✅ Initialize stablecoin with or without hook
6. ✅ Run integration tests

### Option 2: Manual Deployment

#### Step 1: Build Programs

```bash
# Build Transfer Hook Program
cd programs/transfer-hook-program
anchor build
```

```bash
# Build Stablecoin Program
cd drafts/solana-stablecoin-standard
anchor build
```

#### Step 2: Deploy Programs to Devnet

```bash
# Deploy Transfer Hook to Devnet
cd programs/transfer-hook-program
anchor deploy --provider.cluster devnet
```

```bash
# Deploy Stablecoin to Devnet
cd drafts/solana-stablecoin-standard
anchor deploy --provider.cluster devnet
```

You should see output like:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/user/.config/solana/id.json
Deploying program "solana_stablecoin_standard"...
Program Id: STABLE111111111111111111111111111111111
```

#### Step 3: Get Program IDs

```bash
# Get Transfer Hook Program ID
anchor keys list | grep "transfer-hook-program"
```

Expected output:
```
transfer-hook-program: HOOKPROG11111111111111111111
```

```bash
# Get Stablecoin Program ID
anchor keys list | grep "solana-stablecoin-standard"
```

Expected output:
```
solana-stablecoin-standard: STABLE111111111111111111111111111111111111
```

---

## 🔗 Deploy Transfer Hook Program (OPTIONAL but RECOMMENDED)

The Transfer Hook program provides real-time blacklist enforcement on EVERY transfer.

### Step 1: Build Transfer Hook Program

```bash
cd programs/transfer-hook-program
anchor build
```

### Step 2: Deploy Transfer Hook to Devnet

```bash
cd programs/transfer-hook-program
anchor deploy --provider.cluster devnet
```

You should see output like:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/user/.config/solana/id.json
Deploying program "transfer-hook-program"...
Program Id: HOOKPROG11111111111111111111
```

### Step 3: Get Hook Program Address

```bash
anchor keys list | grep "transfer-hook-program"
```

Expected output:
```
transfer-hook-program: HOOKPROG11111111111111111111
```

**Save this address** - you'll need it when initializing the stablecoin!

---

## 🚀 Deploy Stablecoin Program

### Step 1: Build Stablecoin Program

```bash
cd drafts/solana-stablecoin-standard
anchor build
```

### Step 2: Deploy Stablecoin to Devnet

```bash
cd drafts/solana-stablecoin-standard
anchor deploy --provider.cluster devnet
```

### Step 3: Get Stablecoin Program Address

```bash
anchor keys list | grep "solana-stablecoin-standard"
```

Expected output:
```
solana-stablecoin-standard: STABLE111111111111111111111111111111111111
```

---

## 🚀 Initialize Stablecoin

### Option 1: Initialize WITHOUT Transfer Hook (Basic)

For basic stablecoin functionality without automatic blacklist enforcement:

```typescript
const config = {
  name: 'My Stablecoin',
  symbol: 'MSTBL',
  uri: 'https://example.com/metadata.json',
  decimals: 9,
  enable_permanent_delegate: true,
  enable_transfer_hook: false,  // ← No hook
  default_account_frozen: false,
  mint_authority: wallet.publicKey,
  freeze_authority: wallet.publicKey,
  transferHookProgram: null,  // ← No hook
};

const tx = await sdk.initialize(config);
```

### Option 2: Initialize WITH Transfer Hook (Recommended)

For real-time blacklist enforcement on EVERY transfer:

**Prerequisite:** Transfer Hook program must be deployed (see [Deploy Transfer Hook](#-deploy-transfer-hook-program-optional-but-recommended))

```typescript
import { initializeWithTransferHook } from './src/sdk/stablecoin';

const hookProgramId = new PublicKey('HOOKPROG11111111111111111111111');

await initializeWithTransferHook(
  connection,
  wallet,
  'My Stablecoin',
  'MSTBL',
  'https://example.com/metadata.json',
  9,
  hookProgramId  // ← Transfer hook program
);
```

### Option 3: Manual Initialization with Hook

```bash

```bash
# Initialize WITH hook program (recommended)
node scripts/initialize_with_hook.js
```

Expected output:
```
✅ Stablecoin initialized: 5zB8...
✅ Transfer hook configured: HOOKPROG...
```

---

## 🧪 Testing Transfer Hook

### Test Scenarios

#### Test 1: Transfer with From Blacklisted (Should Block)

```typescript
const blacklistedAddress = Keypair.generate().publicKey;

// Add to blacklist
await sdk.addToBlacklist({ address: blacklistedAddress });

// Try to transfer FROM blacklisted address
try {
  await sdk.transfer({
    from: blacklistedAddress,
    to: recipient.publicKey,
    amount: 1000,
  });
  console.log('❌ Should have blocked!');
} catch (error) {
  console.log('✅ Correctly blocked:', error.message);
  // Expected: "Address is blacklisted"
}
```

#### Test 2: Transfer with To Blacklisted (Should Block)

```typescript
const blacklistedAddress = Keypair.generate().publicKey;

// Add to blacklist
await sdk.addToBlacklist({ address: blacklistedAddress });

// Try to transfer TO blacklisted address
try {
  await sdk.transfer({
    from: user.publicKey,
    to: blacklistedAddress,
    amount: 1000,
  });
  console.log('❌ Should have blocked!');
} catch (error) {
  console.log('✅ Correctly blocked:', error.message);
  // Expected: "Address is blacklisted"
}
```

#### Test 3: Normal Transfer (Should Allow)

```typescript
// No addresses blacklisted
const tx = await sdk.transfer({
  from: user.publicKey,
  to: recipient.publicKey,
  amount: 1000,
});

console.log('✅ Transfer succeeded:', tx);
```

#### Test 4: Remove from Blacklist (Should Allow)

```typescript
const blacklistedAddress = Keypair.generate().publicKey;

// Add to blacklist
await sdk.addToBlacklist({ address: blacklistedAddress });

// Remove from blacklist
await sdk.removeFromBlacklist({ address: blacklistedAddress });

// Now transfer should succeed
const tx = await sdk.transfer({
  from: user.publicKey,
  to: blacklistedAddress,
  amount: 1000,
});

console.log('✅ Transfer succeeded after removal:', tx);
```

---

## 🧪 Testing

### Run All Tests

```bash
cd drafts/solana-stablecoin-standard

# Run tests on devnet
anchor test --skip-local-validator
```

This will test:
- ✅ Transfer Hook functionality (if deployed)
- ✅ Stablecoin with/without Transfer Hook integration
- ✅ Blacklist enforcement (from/to blacklisted)
- ✅ All transfer scenarios
- ✅ Seize tokens functionality
- ✅ Authority management

### Run Transfer Hook Tests Only

If you only want to test the Transfer Hook:

```bash
cd programs/transfer-hook-program

# Run hook tests
anchor test --skip-local-validator
```

### Test Summary

| Test | Expected Result |
|------|----------------|
| Initialize stablecoin | ✅ Pass |
| Mint tokens | ✅ Pass |
| Transfer with From blacklisted | ❌ Block (correct) |
| Transfer with To blacklisted | ❌ Block (correct) |
| Normal transfer | ✅ Pass |
| Remove from blacklist → transfer | ✅ Pass |
| Seize tokens | ✅ Pass |
| Freeze/thaw account | ✅ Pass |

---

## 📊 Post-Deployment Verification

### Check Program Information

```bash
# Check Stablecoin program
solana program show STABLE111111111111111111111111111111111111111
```

### Check Program Logs

```bash
# View program logs
solana logs STABLE111111111111111111111111111111111111111111
```

### Monitor Transactions

```bash
# Use Solana Explorer
https://explorer.solana.com/address/STABLE111111111111111111111111111111111111?cluster=devnet
```

---

## 🔧 Troubleshooting

### Issue: Insufficient Funds

```bash
# Request more SOL
solana airdrop 5
```

### Issue: Build Errors

```bash
# Clean build artifacts
anchor clean

# Rebuild
anchor build
```

### Issue: Deployment Fails

```bash
# Check cluster connection
solana cluster health

# Verify program IDs
anchor keys list
```

### Issue: Test Failures

```bash
# Check local validator is running
solana-test-validator

# Use verbose output
anchor test -- --nocapture
```

---

## 🔒 Security Considerations

### Mainnet Deployment Checklist

- [ ] Code audited by professional security firm
- [ ] Comprehensive test coverage (>90%)
- [ ] Bug bounty program launched
- [ ] Multi-sig authority configured
- [ ] Emergency procedures documented
- [ ] Monitoring and alerting set up
- [ ] Gradual rollout plan prepared

### Key Management

- Use hardware wallets for authority keys
- Store private keys securely (never commit to git)
- Implement key rotation procedures
- Use multi-sig for critical operations

---

## 📚 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Token Program](https://spl.solana.com/token)
- [Solana Token-2022 Extensions](https://spl.solana.com/token-2022)
- [Devnet Faucet](https://faucet.solana.com/)

## 🆘 Support

If you encounter issues:
1. Check [troubleshooting section](#-troubleshooting)
2. Search [GitHub Issues](https://github.com/your-repo/solana-stablecoin-standard/issues)
3. Join [Solana Discord](https://discord.gg/solana)
4. Open a new issue with detailed logs

---

**Deployment completed! 🎉**
