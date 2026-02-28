# Solana Stablecoin Standard - Usage Examples

Complete examples demonstrating all features of the SSS-2 Compliant Stablecoin.

## 📚 Table of Contents

- [Setup](#setup)
- [Initialize Stablecoin](#initialize-stablecoin)
- [Initialize WITH Transfer Hook](#initialize-with-transfer-hook)
- [Mint Tokens](#mint-tokens)
- [Transfer Tokens](#transfer-tokens)
- [Transfer Hook Scenarios](#transfer-hook-scenarios)
- [Freeze/Thaw Accounts](#freezethaw-accounts)
- [Blacklist Management](#blacklist-management)
- [Seize Tokens](#seize-tokens)
- [Authority Management](#authority-management)
- [Complete Example](#complete-example)

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install @solana/web3.js @project-serum/anchor @solana/spl-token
```

### 2. Configure Connection
```typescript
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { createStablecoinSDK } from './src/sdk/stablecoin';

// Create connection to devnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Use Phantom wallet or create a keypair
const wallet = new Wallet(Keypair.generate());

// Create Anchor provider
const provider = new AnchorProvider(connection, wallet, {
  commitment: 'confirmed',
});

// Create SDK instance
const sdk = createStablecoinSDK(connection, wallet);
```

## 🚀 Initialize Stablecoin

### Basic Initialization
```typescript
const config = {
  name: 'My USD Stablecoin',
  symbol: 'MYUSD',
  uri: 'https://example.com/metadata/myusd.json',
  decimals: 9,
  enable_permanent_delegate: true,
  enable_transfer_hook: true,
  default_account_frozen: false,
  mint_authority: wallet.publicKey,
  freeze_authority: wallet.publicKey,
};

try {
  const tx = await sdk.initialize(config);
  console.log('✅ Stablecoin initialized:', tx);
} catch (error) {
  console.error('❌ Initialization failed:', error);
}
```

### Configuration with Custom Authorities
```typescript
const minterKeypair = Keypair.generate();
const freezerKeypair = Keypair.generate();

const config = {
  name: 'Enterprise Stablecoin',
  symbol: 'ENT',
  uri: 'https://example.com/metadata/ent.json',
  decimals: 6,  // Like USDC
  enable_permanent_delegate: true,
  enable_transfer_hook: true,
  default_account_frozen: false,
  mint_authority: minterKeypair.publicKey,
  freeze_authority: freezerKeypair.publicKey,
};

const tx = await sdk.initialize(config);
```

## 🔗 Initialize WITH Transfer Hook

Initialize stablecoin with real-time blacklist enforcement on EVERY transfer:

```typescript
import { initializeWithTransferHook } from './src/sdk/stablecoin';

const hookProgramId = new PublicKey('HOOKPROG11111111111111111111111');

const tx = await initializeWithTransferHook(
  connection,
  wallet,
  'My Compliant Stablecoin',
  'MCS',
  'https://example.com/metadata/mcs.json',
  9,
  hookProgramId
);

console.log('✅ Stablecoin initialized with Transfer Hook:', tx);
```

**This enables:**
- ✅ Automatic blacklist checking on EVERY transfer
- ✅ Block transfers from/to blacklisted addresses
- ✅ Real-time compliance enforcement
- ✅ No manual checks needed before transfers

## 💰 Mint Tokens

### Mint to Specific Account
```typescript
import { PublicKey } from '@solana/web3.js';

const recipient = new PublicKey('RECIPIENT_PUBLIC_KEY');
const amount = 1000000000;  // 1 token with 9 decimals

try {
  const tx = await sdk.mintTo({ to: recipient, amount });
  console.log('✅ Tokens minted:', tx);
} catch (error) {
  console.error('❌ Minting failed:', error);
}
```

### Mint Multiple Batches
```typescript
const recipients = [
  new PublicKey('ADDRESS_1'),
  new PublicKey('ADDRESS_2'),
  new PublicKey('ADDRESS_3'),
];

const amountPerRecipient = 100000000;  // 0.1 tokens

for (const recipient of recipients) {
  const tx = await sdk.mintTo({ to: recipient, amount: amountPerRecipient });
  console.log(`✅ Minted to ${recipient.toString()}:`, tx);
}
```

## 🔄 Transfer Tokens

### Basic Transfer
```typescript
const sender = new PublicKey('SENDER_ADDRESS');
const recipient = new PublicKey('RECIPIENT_ADDRESS');
const amount = 100000000;  // 0.1 tokens with 9 decimals

try {
  const tx = await sdk.transfer({
    from: sender,
    to: recipient,
    amount,
  });
  console.log('✅ Transfer succeeded:', tx);
} catch (error) {
  console.error('❌ Transfer failed:', error);
}
```

### Batch Transfers
```typescript
const transfers = [
  { from: user.publicKey, to: recipient1, amount: 100000000 },
  { from: user.publicKey, to: recipient2, amount: 200000000 },
  { from: user.publicKey, to: recipient3, amount: 50000000 },
];

for (const transfer of transfers) {
  try {
    const tx = await sdk.transfer(transfer);
    console.log(`✅ Transferred to ${transfer.to.toString()}:`, tx);
  } catch (error) {
    console.error(`❌ Transfer to ${transfer.to.toString()} failed:`, error);
  }
}
```

## 🔗 Transfer Hook Scenarios

These examples demonstrate how Transfer Hook enforces blacklist rules automatically:

### Scenario 1: Transfer to Blacklisted Address (Blocked)

```typescript
const suspiciousAddress = new PublicKey('SUSPICIOUS_ADDRESS');

// 1. Add to blacklist
await sdk.addToBlacklist({ address: suspiciousAddress });
console.log('🚫 Address blacklisted');

// 2. Try to transfer TO blacklisted address
try {
  const tx = await sdk.transfer({
    from: user.publicKey,
    to: suspiciousAddress,
    amount: 100000000,
  });
  console.log('❌ ERROR: Transfer should have been blocked!');
} catch (error) {
  console.log('✅ Transfer blocked correctly:', error.message);
  // Expected: "Address is blacklisted"
}
```

### Scenario 2: Transfer FROM Blacklisted Address (Blocked)

```typescript
const blacklistedSender = new PublicKey('BLACKLISTED_SENDER');

// 1. Add to blacklist
await sdk.addToBlacklist({ address: blacklistedSender });
console.log('🚫 Sender blacklisted');

// 2. Try to transfer FROM blacklisted address
try {
  const tx = await sdk.transfer({
    from: blacklistedSender,
    to: user.publicKey,
    amount: 100000000,
  });
  console.log('❌ ERROR: Transfer should have been blocked!');
} catch (error) {
  console.log('✅ Transfer blocked correctly:', error.message);
  // Expected: "Address is blacklisted"
}
```

### Scenario 3: Remove from Blacklist → Transfer Allowed

```typescript
const previouslyBlacklisted = new PublicKey('PREVIOUSLY_BLACKLISTED');

// 1. Add to blacklist
await sdk.addToBlacklist({ address: previouslyBlacklisted });
console.log('🚫 Address blacklisted');

// 2. Try to transfer (should fail)
try {
  await sdk.transfer({
    from: user.publicKey,
    to: previouslyBlacklisted,
    amount: 100000000,
  });
} catch (error) {
  console.log('✅ Transfer blocked (expected)');
}

// 3. Remove from blacklist
await sdk.removeFromBlacklist({ address: previouslyBlacklisted });
console.log('✅ Address removed from blacklist');

// 4. Try to transfer again (should succeed)
const tx = await sdk.transfer({
  from: user.publicKey,
  to: previouslyBlacklisted,
  amount: 100000000,
});
console.log('✅ Transfer succeeded after removal:', tx);
```

### Scenario 4: Both Addresses Blacklisted (Blocked)

```typescript
const blacklisted1 = new PublicKey('BLACKLISTED_1');
const blacklisted2 = new PublicKey('BLACKLISTED_2');

// 1. Add both to blacklist
await sdk.addToBlacklist({ address: blacklisted1 });
await sdk.addToBlacklist({ address: blacklisted2 });
console.log('🚫 Both addresses blacklisted');

// 2. Try to transfer between blacklisted addresses
try {
  const tx = await sdk.transfer({
    from: blacklisted1,
    to: blacklisted2,
    amount: 100000000,
  });
  console.log('❌ ERROR: Transfer should have been blocked!');
} catch (error) {
  console.log('✅ Transfer blocked correctly:', error.message);
}
```

### Scenario 5: Normal Transfer (Allowed)

```typescript
// 1. Ensure neither address is blacklisted
const normalSender = new PublicKey('NORMAL_SENDER');
const normalRecipient = new PublicKey('NORMAL_RECIPIENT');

// 2. Check blacklist status
const senderBlacklisted = await sdk.isBlacklisted(normalSender);
const recipientBlacklisted = await sdk.isBlacklisted(normalRecipient);

if (!senderBlacklisted && !recipientBlacklisted) {
  // 3. Transfer normally
  const tx = await sdk.transfer({
    from: normalSender,
    to: normalRecipient,
    amount: 100000000,
  });
  console.log('✅ Normal transfer succeeded:', tx);
} else {
  console.log('❌ Cannot transfer: One or both addresses are blacklisted');
}
```

### Complete Compliance Workflow

```typescript
async function compliantTransfer(
  from: PublicKey,
  to: PublicKey,
  amount: number
) {
  console.log(`\n🔄 Transferring ${amount} from ${from.toString()} to ${to.toString()}...`);

  // 1. Check blacklist status
  const fromBlacklisted = await sdk.isBlacklisted(from);
  const toBlacklisted = await sdk.isBlacklisted(to);

  // 2. Enforce rules
  if (fromBlacklisted) {
    console.log('❌ BLOCKED: Sender is blacklisted');
    return { success: false, reason: 'sender_blacklisted' };
  }

  if (toBlacklisted) {
    console.log('❌ BLOCKED: Recipient is blacklisted');
    return { success: false, reason: 'recipient_blacklisted' };
  }

  // 3. Execute transfer
  try {
    const tx = await sdk.transfer({ from, to, amount });
    console.log('✅ TRANSFER SUCCESSFUL:', tx);
    return { success: true, tx };
  } catch (error) {
    console.log('❌ TRANSFER FAILED:', error);
    return { success: false, reason: 'transfer_failed', error };
  }
}

// Usage
await compliantTransfer(
  user.publicKey,
  recipient.publicKey,
  100000000
);
```

## ❄️ Freeze/Thaw Accounts

### Freeze an Account
```typescript
const accountToFreeze = new PublicKey('ACCOUNT_TO_FREEZE');

try {
  const tx = await sdk.freezeAccount({ account: accountToFreeze });
  console.log('✅ Account frozen:', tx);
} catch (error) {
  console.error('❌ Freeze failed:', error);
}
```

### Thaw an Account
```typescript
const accountToThaw = new PublicKey('ACCOUNT_TO_THAW');

try {
  const tx = await sdk.thawAccount({ account: accountToThaw });
  console.log('✅ Account thawed:', tx);
} catch (error) {
  console.error('❌ Thaw failed:', error);
}
```

### Check Account Status
```typescript
import { getAccount } from '@solana/spl-token';

const accountInfo = await getAccount(connection, accountToCheck);

if (accountInfo.isFrozen) {
  console.log('❌ Account is frozen');
} else {
  console.log('✅ Account is not frozen');
}
```

## 🚫 Blacklist Management

### Add Address to Blacklist
```typescript
const suspiciousAddress = new PublicKey('SUSPICIOUS_ADDRESS');

try {
  const tx = await sdk.addToBlacklist({ address: suspiciousAddress });
  console.log('✅ Address blacklisted:', tx);
} catch (error) {
  console.error('❌ Blacklisting failed:', error);
}
```

### Remove Address from Blacklist
```typescript
const previouslyBlacklisted = new PublicKey('ADDRESS_TO_REMOVE');

try {
  const tx = await sdk.removeFromBlacklist({ address: previouslyBlacklisted });
  console.log('✅ Address removed from blacklist:', tx);
} catch (error) {
  console.error('❌ Removal failed:', error);
}
```

### Check if Address is Blacklisted
```typescript
const addressToCheck = new PublicKey('ADDRESS_TO_CHECK');

const isBlacklisted = await sdk.isBlacklisted(addressToCheck);

if (isBlacklisted) {
  console.log('⚠️  Address is blacklisted');
  // Prevent transfers to this address
} else {
  console.log('✅ Address is not blacklisted');
  // Allow transfers
}
```

### Batch Blacklist Operations
```typescript
const addressesToBlacklist = [
  new PublicKey('ADDR_1'),
  new PublicKey('ADDR_2'),
  new PublicKey('ADDR_3'),
];

for (const address of addressesToBlacklist) {
  try {
    await sdk.addToBlacklist({ address });
    console.log(`✅ Blacklisted ${address.toString()}`);
  } catch (error) {
    console.error(`❌ Failed to blacklist ${address.toString()}:`, error);
  }
}
```

## 🔒 Seize Tokens

### Seize Tokens from Blacklisted Account
```typescript
const blacklistedAccount = new PublicKey('BLACKLISTED_ACCOUNT');
const treasuryAccount = new PublicKey('TREASURY_ACCOUNT');
const amountToSeize = 500000000;  // 0.5 tokens

try {
  const tx = await sdk.seizeTokens({
    from: blacklistedAccount,
    treasury: treasuryAccount,
    amount: amountToSeize,
  });
  console.log('✅ Tokens seized:', tx);
} catch (error) {
  console.error('❌ Seizure failed:', error);
}
```

### Compliance Workflow
```typescript
async function complianceCheckAndSeize(
  suspiciousAddress: PublicKey,
  treasury: PublicKey
) {
  // 1. Check if blacklisted
  const isBlacklisted = await sdk.isBlacklisted(suspiciousAddress);

  if (isBlacklisted) {
    console.log('⚠️  Address is blacklisted, proceeding with seizure');

    // 2. Get account balance
    const accountInfo = await getAccount(connection, suspiciousAddress);
    const balance = accountInfo.amount;

    // 3. Seize all tokens
    try {
      const tx = await sdk.seizeTokens({
        from: suspiciousAddress,
        treasury: treasury,
        amount: balance.toNumber(),
      });

      console.log('✅ Seizure complete:', tx);
    } catch (error) {
      console.error('❌ Seizure failed:', error);
    }
  } else {
    console.log('✅ Address is compliant');
  }
}

// Usage
await complianceCheckAndSeize(
  new PublicKey('SUSPICIOUS_ADDRESS'),
  new PublicKey('TREASURY_ADDRESS')
);
```

## 🔄 Authority Management

### Update Mint Authority
```typescript
const newMinter = new PublicKey('NEW_MINTER_ADDRESS');

try {
  const tx = await sdk.updateMinter({ newAuthority: newMinter });
  console.log('✅ Mint authority updated:', tx);
} catch (error) {
  console.error('❌ Update failed:', error);
}
```

### Update Freeze Authority
```typescript
const newFreezer = new PublicKey('NEW_FREEZER_ADDRESS');

try {
  const tx = await sdk.updateFreezer({ newAuthority: newFreezer });
  console.log('✅ Freeze authority updated:', tx);
} catch (error) {
  console.error('❌ Update failed:', error);
}
```

### Multi-Sig Authority
```typescript
// For multi-sig, use the multi-sig's public key
const multiSigAddress = new PublicKey('MULTI_SIG_ADDRESS');

const config = {
  name: 'Multi-Sig Stablecoin',
  symbol: 'MSIG',
  uri: 'https://example.com/metadata/msig.json',
  decimals: 9,
  enable_permanent_delegate: true,
  enable_transfer_hook: true,
  default_account_frozen: false,
  mint_authority: multiSigAddress,  // Multi-sig controls minting
  freeze_authority: multiSigAddress,  // Multi-sig controls freezing
};

const tx = await sdk.initialize(config);
```

## 🎯 Complete Example

### Enterprise Stablecoin Setup with Transfer Hook

```typescript
import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import { initializeWithTransferHook } from './src/sdk/stablecoin';

async function setupEnterpriseStablecoin() {
  // 1. Setup connection
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const adminWallet = Keypair.generate();

  console.log('🔧 Setting up enterprise stablecoin with Transfer Hook...');
  console.log('Admin wallet:', adminWallet.publicKey.toString());

  // 2. Transfer Hook Program ID (must be deployed first!)
  const hookProgramId = new PublicKey('HOOKPROG11111111111111111111111');

  // 3. Initialize stablecoin WITH Transfer Hook
  console.log('\n🚀 Initializing stablecoin with Transfer Hook...');
  const initTx = await initializeWithTransferHook(
    connection,
    adminWallet,
    'Enterprise USD',
    'EUSD',
    'https://enterprise.com/metadata/eusd.json',
    6,  // USDC-like decimals
    hookProgramId  // ← Transfer Hook program
  );
  console.log('✅ Stablecoin initialized with Transfer Hook:', initTx);

  // 4. Create SDK
  const sdk = createStablecoinSDK(connection, adminWallet);

  // 5. Mint initial supply to treasury
  console.log('\n💰 Minting initial supply...');
  const treasury = new PublicKey('TREASURY_ADDRESS');
  const initialSupply = 1000000000;  // 1,000 EUSD

  const mintTx = await sdk.mintTo({
    to: treasury,
    amount: initialSupply,
  });
  console.log('✅ Initial supply minted:', mintTx);

  // 6. Setup compliance
  console.log('\n🚫 Setting up compliance...');

  // Blacklist known suspicious addresses
  const suspiciousAddresses = [
    new PublicKey('SUSPICIOUS_1'),
    new PublicKey('SUSPICIOUS_2'),
  ];

  for (const addr of suspiciousAddresses) {
    await sdk.addToBlacklist({ address: addr });
    console.log('✅ Blacklisted:', addr.toString());
  }

  // 7. Test Transfer Hook enforcement
  console.log('\n🧪 Testing Transfer Hook enforcement...');

  const testRecipient = Keypair.generate().publicKey;

  // Test 1: Normal transfer (should succeed)
  try {
    await sdk.transfer({
      from: treasury,
      to: testRecipient,
      amount: 1000000,  // 1 EUSD
    });
    console.log('✅ Test 1: Normal transfer - PASSED');
  } catch (error) {
    console.log('❌ Test 1: Normal transfer - FAILED', error);
  }

  // Test 2: Transfer to blacklisted address (should block)
  try {
    await sdk.transfer({
      from: treasury,
      to: suspiciousAddresses[0],
      amount: 1000000,
    });
    console.log('❌ Test 2: Transfer to blacklisted - FAILED (should have blocked)');
  } catch (error) {
    console.log('✅ Test 2: Transfer to blacklisted - BLOCKED (correct)');
  }

  // 8. Configure monitoring
  console.log('\n📊 Configuration complete!');
  console.log('Stablecoin: EUSD (with Transfer Hook)');
  console.log('Initial Supply:', initialSupply.toString());
  console.log('Treasury:', treasury.toString());
  console.log('Blacklist size:', suspiciousAddresses.length);
  console.log('Transfer Hook:', hookProgramId.toString());

  return {
    sdk,
    hookProgramId,
    config: {
      name: 'Enterprise USD',
      symbol: 'EUSD',
      decimals: 6,
    },
    treasury,
    blacklistedAddresses: suspiciousAddresses,
  };
}

// Run the setup
setupEnterpriseStablecoin()
  .then((result) => {
    console.log('\n🎉 Setup complete with Transfer Hook!', result);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
  });
```

## 🧪 Testing Examples

### Test All Features (Including Transfer Hook)

```typescript
async function testAllFeatures() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const wallet = Keypair.generate();
  const sdk = createStablecoinSDK(connection, wallet);

  console.log('🧪 Running comprehensive tests...');

  // Test 1: Initialize
  const config = {
    name: 'Test Stablecoin',
    symbol: 'TEST',
    uri: 'https://test.com/metadata.json',
    decimals: 9,
    enable_permanent_delegate: true,
    enable_transfer_hook: true,
    default_account_frozen: false,
    mint_authority: wallet.publicKey,
    freeze_authority: wallet.publicKey,
  };

  await sdk.initialize(config);
  console.log('✅ Test 1: Initialize - PASSED');

  // Test 2: Mint
  const recipient = Keypair.generate().publicKey;
  await sdk.mintTo({ to: recipient, amount: 1000000000 });
  console.log('✅ Test 2: Mint - PASSED');

  // Test 3: Blacklist
  const suspicious = Keypair.generate().publicKey;
  await sdk.addToBlacklist({ address: suspicious });
  console.log('✅ Test 3: Blacklist - PASSED');

  // Test 4: Check blacklist
  const isBlacklisted = await sdk.isBlacklisted(suspicious);
  console.assert(isBlacklisted === true, 'Blacklist check failed');
  console.log('✅ Test 4: Check Blacklist - PASSED');

  // Test 5: Remove from blacklist
  await sdk.removeFromBlacklist({ address: suspicious });
  console.log('✅ Test 5: Remove Blacklist - PASSED');

  // Test 6: Transfer Hook - Transfer to blacklisted (should block)
  const blacklisted = Keypair.generate().publicKey;
  await sdk.addToBlacklist({ address: blacklisted });

  try {
    await sdk.transfer({
      from: wallet.publicKey,
      to: blacklisted,
      amount: 1000000,
    });
    console.log('❌ Test 6: Transfer Hook (to blacklisted) - FAILED');
  } catch (error) {
    console.log('✅ Test 6: Transfer Hook (to blacklisted) - BLOCKED (correct)');
  }

  // Test 7: Transfer Hook - Transfer from blacklisted (should block)
  try {
    await sdk.transfer({
      from: blacklisted,
      to: recipient,
      amount: 1000000,
    });
    console.log('❌ Test 7: Transfer Hook (from blacklisted) - FAILED');
  } catch (error) {
    console.log('✅ Test 7: Transfer Hook (from blacklisted) - BLOCKED (correct)');
  }

  // Test 8: Transfer Hook - Normal transfer (should succeed)
  await sdk.removeFromBlacklist({ address: blacklisted });

  try {
    await sdk.transfer({
      from: wallet.publicKey,
      to: blacklisted,
      amount: 1000000,
    });
    console.log('✅ Test 8: Transfer Hook (normal) - PASSED');
  } catch (error) {
    console.log('❌ Test 8: Transfer Hook (normal) - FAILED');
  }

  console.log('\n🎉 All tests passed!');
}

testAllFeatures();
```

## 📚 Additional Resources

- [API Reference](./README.md#-api-reference)
- [Deployment Guide](./DEPLOYMENT.md) - Includes Transfer Hook deployment steps
- [Transfer Hook Documentation](./README.md#-transfer-hook-integration) - Learn how hooks work
- [Troubleshooting](./TROUBLESHOOTING.md)

---

**Happy Building! 🚀**
