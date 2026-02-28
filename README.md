# Solana Stablecoin Standard - SSS-2 Compliant Implementation

A complete implementation of an SSS-2 Compliant Stablecoin on Solana, following the Solana Vault Standard architecture.

## 📋 Overview

This project implements a 3-layer architecture:
- **Layer 1 — Base SDK:** Token creation with mint authority + freeze authority + metadata
- **Layer 2 — Modules:** Compliance module (transfer hook, blacklist PDAs, permanent delegate), Privacy module (confidential transfers, allowlists)
- **Layer 3 — Standard Presets:** SSS-2 (Compliant Stablecoin) for USDC/USDT-class tokens with on-chain blacklist enforcement and token seizure capabilities

Each module is independently testable and optional.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              Solana Vault Standard - SSS-2 Compliant Stablecoin          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────┐                                    │
│  │     LAYER 1 - BASE SDK      │                                    │
│  │  ┌──────────────────────┐    │                                │
│  │  │  Token Mint (SPL)   │    │                                │
│  │  │  + Mint Authority    │    │                                │
│  │  │  + Freeze Authority  │    │                                │
│  │  │  + Metadata         │    │                                │
│  │  └──────────────────────┘    │                                │
│  └───────────────────────────────┼──────────────────────────────────┐    │
│                              ↓                                  │    │
│  ┌──────────────────────┐       ↓                                  │    │
│  │   LAYER 2 - MODULES    │  ┌────────────────────────┐    │    │
│  │  ┌─────────────────┐    │  │   LAYER 3 - STANDARD   │    │
│  │  │ Compliance      │    │  │   PRESETS           │    │
│  │  │  - Transfer Hook │    │  │  ┌────────────────┐    │
│  │  │  - Blacklist PDA  │    │  │  │   SSS-2       │    │
│  │  │  - Permanent      │    │  │  │   Compliant     │    │
│  │  │    Delegate       │    │  │  │   Stablecoin   │    │
│  │  └─────────────────┘    │  │  │   What It Is    │    │
│  │  ┌─────────────────┐    │  │  └────────────────┘    │
│  │  │ Privacy (Opt)    │    │  └────────────────────────┘    │
│  │  │  - Allowlist    │    │                                │
│  │  │  - Confidential   │    │                                │
│  │  └─────────────────┘    │                                │
│  └──────────────────────┘                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 📚 Documentation

- [📖 Usage Examples](./EXAMPLES.md) - Complete examples for all features
- [🚀 Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment instructions
- [🧪 Integration Tests](./tests/stablecoin.ts) - Comprehensive test suite

## 💰 Prize Structure

**Total Prize:** $5,000 USD
- 1st Place: $2,500
- 2nd Place: $1,500
- 3rd Place: $1,000

## 🚀 Features

### Core Features
- ✅ **Token Minting:** Programmable mint authority with PDA support
- ✅ **Freeze/Thaw:** Account freezing for compliance
- ✅ **Metadata:** Token metadata integration
- ✅ **Authority Management:** Multi-sig compatible authority updates

### Compliance Features (SSS-2)
- ✅ **Blacklist PDA:** On-chain storage of blacklisted addresses
- ✅ **Transfer Hook:** Separate program that intercepts EVERY transfer before execution, checking blacklist status in real-time
- ✅ **Seize Tokens:** Forced token transfer from blacklisted accounts
- ✅ **Permanent Delegate:** Delegate authority for compliance operations

### TypeScript SDK
- ✅ **Complete API:** All Rust functions exposed via TypeScript
- ✅ **Type Safety:** Full TypeScript support
- ✅ **Wallet Integration:** Compatible with Phantom and other wallets
- ✅ **Examples:** Ready-to-use code examples

## 🔗 Transfer Hook Integration

The stablecoin supports an optional **Transfer Hook** for real-time blacklist enforcement on EVERY transfer.

### What is Transfer Hook?

A separate Solana program that intercepts EVERY transfer before it executes, checking if the sender (from) and/or recipient (to) addresses are blacklisted. This provides **real-time compliance** without requiring manual checks.

### How Transfer Hook Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Transfer Process with Hook                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User initiates transfer (from → to, amount)                     │
│                         ↓                                          │
│  2. Token-2022 intercepts and calls Transfer Hook                   │
│                         ↓                                          │
│  3. Hook Program:                                                  │
│     - Check if 'from' is blacklisted → Block if true                │
│     - Check if 'to' is blacklisted → Block if true                  │
│                         ↓                                          │
│  4. If not blocked: Allow transfer to complete                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Transfer Scenarios

| Scenario | From | To | Result |
|----------|------|-----|--------|
| Normal | ✅ | ✅ | ✅ Allowed |
| From Blacklisted | ❌ | ✅ | ❌ Blocked |
| To Blacklisted | ✅ | ❌ | ❌ Blocked |
| Both Blacklisted | ❌ | ❌ | ❌ Blocked |
| Removed from Blacklist | ✅ (was blocked) | ✅ | ✅ Allowed |

### Security Benefits

- **Real-time enforcement:** No window for blocked transfers to execute
- **Automatic:** No need to manually check blacklist before transfers
- **Transparent:** Logs show which transfers were blocked and why
- **Compliance-ready:** Meets regulatory requirements for transaction monitoring

### How to Use

1. Deploy Transfer Hook program (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. Initialize stablecoin with hook program address
3. All transfers will now be automatically checked

**Example:**
```typescript
import { initializeWithTransferHook } from './src/sdk/stablecoin';

const hookProgramId = new PublicKey('HOOKPROG11111111111111111111111');

await initializeWithTransferHook(
  connection,
  wallet,
  'My Stablecoin',
  'MYSTBL',
  'https://example.com/metadata.json',
  9,
  hookProgramId
);
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.17+
- Anchor 0.29.0+

### Clone the Repository
```bash
git clone https://github.com/your-repo/solana-stablecoin-standard.git
cd solana-stablecoin-standard
```

### Install Dependencies
```bash
# Rust dependencies (already in Cargo.toml)
cargo build --release

# Node.js dependencies
npm install

# Build the program
anchor build
```

## 🔧 Deployment

### 1. Configure Solana CLI
```bash
# Set to devnet
solana config set --url devnet

# Create a new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Airdrop SOL for deployment
solana airdrop 5
```

### 2. Deploy the Program
```bash
# Deploy to devnet
anchor deploy

# Get the program ID
anchor keys list
```

### 3. Initialize the Stablecoin
```typescript
import { createStablecoinSDK } from './src/sdk/stablecoin';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = window.solana; // Phantom wallet

const sdk = createStablecoinSDK(connection, wallet);

const config = {
  name: 'My Stablecoin',
  symbol: 'MSTBL',
  uri: 'https://example.com/metadata.json',
  decimals: 9,
  enable_permanent_delegate: true,
  enable_transfer_hook: true,
  default_account_frozen: false,
  mint_authority: wallet.publicKey,
  freeze_authority: wallet.publicKey,
};

const tx = await sdk.initialize(config);
console.log('Stablecoin initialized:', tx);
```

## 📚 Usage Examples

### Mint Tokens
```typescript
const tx = await sdk.mintTo({
  to: recipientPublicKey,
  amount: 1000000000, // 1 token with 9 decimals
});
```

### Freeze an Account
```typescript
const tx = await sdk.freezeAccount({
  account: accountToFreeze,
});
```

### Add to Blacklist
```typescript
const tx = await sdk.addToBlacklist({
  address: addressToBlacklist,
});
```

### Seize Tokens (Compliance)
```typescript
const tx = await sdk.seizeTokens({
  from: blacklistedAccount,
  treasury: treasuryAccount,
  amount: 500000000, // 0.5 tokens
});
```

### Check if Blacklisted
```typescript
const isBlacklisted = await sdk.isBlacklisted(suspiciousAddress);
if (isBlacklisted) {
  console.log('This address is blacklisted!');
}
```

## 🧪 Testing

### Run Tests
```bash
# Run unit tests
anchor test

# Run integration tests on devnet
anchor test --skip-local-validator
```

### Manual Testing
```bash
# Start local validator
solana-test-validator

# Deploy locally
anchor deploy --localnet
```

## 📊 Architecture Details

### PDAs (Program Derived Addresses)
- `stablecoin` + `mint` → StablecoinConfig
- `authority` + `mint` + `mint` → MintAuthority
- `authority` + `freeze` + `mint` → FreezeAuthority
- `blacklist` + `address` → BlacklistEntry

### Account Sizes
- `StablecoinConfig`: ~200 bytes
- `BlacklistEntry`: ~48 bytes
- Token Account: ~165 bytes (SPL Token)

### Transaction Costs
- Initialize: ~0.05 SOL
- Mint: ~0.000005 SOL
- Freeze/Thaw: ~0.000005 SOL
- Blacklist: ~0.00001 SOL
- Seize: ~0.000015 SOL

## 🔒 Security Considerations

### Authority Management
- Mint and freeze authorities are stored as PDAs
- Authorities can be updated via `updateMinter` and `updateFreezer`
- Compatible with multi-sig wallets for enterprise use

### Compliance
- Blacklist is enforced on-chain
- Seize tokens function for regulatory compliance
- Transfer Hook checks every transfer against blacklist

### Audits
This code has been designed with security best practices but has not been audited. For production use, consider:
- Professional security audit
- Bug bounty program
- Formal verification

## 🎯 Use Cases

### USDC/USDT Class Stablecoins
- Regulatory compliance for fiat-backed tokens
- On-chain blacklist enforcement
- Token seizure capabilities

### Enterprise Stablecoins
- Multi-sig authority management
- Custom compliance rules
- Permanent delegate for emergency operations

### DeFi Protocols
- Frozen collateral for lending
- Compliance for institutional investors
- Seize tokens for liquidations

## 📝 API Reference

### StablecoinSDK Class

#### Methods
- `initialize(config)` - Initialize stablecoin
- `mintTo(params)` - Mint tokens to account
- `freezeAccount(params)` - Freeze token account
- `thawAccount(params)` - Thaw frozen account
- `addToBlacklist(params)` - Add address to blacklist
- `removeFromBlacklist(params)` - Remove from blacklist
- `seizeTokens(params)` - Seize tokens from account
- `isBlacklisted(address)` - Check if address is blacklisted
- `getConfig(mint)` - Get stablecoin configuration
- `updateMinter(params)` - Update mint authority
- `updateFreezer(params)` - Update freeze authority

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Token Program](https://spl.solana.com/token)
- [Solana Vault Standard](https://github.com/solanabr/solana-stablecoin-standard)

## 💬 Support

- GitHub Issues: https://github.com/your-repo/solana-stablecoin-standard/issues
- Discord: https://discord.gg/solana
- Twitter: @Solana

---

**Built with ❤️ for the Solana Ecosystem**

*Status: MVP Complete - Ready for Devnet Testing*
