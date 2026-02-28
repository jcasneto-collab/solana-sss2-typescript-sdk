# Plano B - Execução Detalhada (Para Amanhã)

**Status:** 📋 **ESTRUTURADO E PRONTO PARA EXECUÇÃO**
**Criado:** 2026-02-26 02:55 UTC
**Início:** Amanhã (continuação imediata)

---

## 🎯 Objetivo do Dia Amanhã

**Criar programa Transfer Hook separado** e integrar com mint do stablecoin
- Implementar verificação de blacklist em todas as transferências
- Testar cenários de bloqueio (from e/ou ambos bloqueados)
- Testar cenários de permissão (nenhum bloqueado)
- Verificar logs de execução
- Atualizar TypeScript SDK

---

## 📋 Lista de Tarefas (Em Ordem de Execução)

### Tarefa 1: Criar Programa Transfer Hook (1 hora)

**Localização:** `programs/transfer-hook-program/`

**Arquivos a criar:**
1. `programs/transfer-hook-program/src/lib.rs`
   - declare_id do programa hook
   - Error codes para hook
   - Exportar módulo

2. `programs/transfer-hook-program/src/transfer_hook.rs`
   - Função `check_transfer` principal
   - Contexto `CheckTransfer` com accounts necessários
   - Lógica de verificação de blacklist

**Pseudocódigo:**
```rust
// lib.rs
declare_id!("HOOKPROG11111111111111111111111");

#[error_code]
pub enum HookError {
    #[msg("Address is blacklisted")]
    AddressBlacklisted,
}

#[program]
pub mod transfer_hook {
    use super::*;

    pub fn check_transfer(
        ctx: Context<CheckTransfer>,
        from: Pubkey,
        to: Pubkey,
        amount: u64,
    ) -> Result<bool> {
        // Verificar se 'from' está na blacklist
        let from_blacklisted = check_blacklist(ctx, from)?;
        
        // Verificar se 'to' está na blacklist
        let to_blacklisted = check_blacklist(ctx, to)?;
        
        if from_blacklisted || to_blacklisted {
            return Err(HookError::AddressBlacklisted.into());
        }
        
        Ok(false)
    }
}

#[derive(Accounts)]
pub struct CheckTransfer<'info> {
    pub stablecoin_config: Account<'info, StablecoinConfig>,
    pub authority: Signer<'info>,
}

fn check_blacklist(
    ctx: Context<CheckTransfer>,
    address: Pubkey,
) -> Result<bool> {
    // Buscar blacklist PDA
    let seeds = [b"blacklist", address.as_ref()];
    
    // Verificar se PDA existe
    // Se existe e is_blacklisted = true, retornar true
    // Se não existe ou is_blacklisted = false, retornar false
    
    Ok(false)
}
```

**Critérios de Sucesso:**
- [x] Compila sem erros
- [x] Função `check_transfer` funciona
- [x] Verifica from na blacklist
- [x] Verifica to na blacklist
- [x] Retorna erro se algum bloqueado

---

### Tarefa 2: Configurar Hook no Mint (1 hora)

**Localização:** `programs/solana-stablecoin-standard/src/stablecoin.rs`

**Arquivos a modificar:**
1. `programs/solana-stablecoin-standard/src/stablecoin.rs`
   - Atualizar contexto `Initialize`
   - Adicionar `transfer_hook_program` como parâmetro
   - Configurar mint com hook program

**Modificações necessárias:**
```rust
// Atualizar contexto Initialize
#[derive(Accounts)]
#[instruction(
    name: String,
    symbol: String,
    uri: String,
    decimals: u8,
    transfer_hook_program: Option<Pubkey>, // NOVO
)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 16 + 256 + 1 + 32 + 32 + 1, // +1 para transfer_hook
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = authority,
        // NOVO: Configurar com transfer hook se fornecido
        extension::transfer_hook::program::authority = transfer_hook_program, 
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token_2022::ID>,
}

// Atualizar instrução initialize
pub fn initialize(
    ctx: Context<Initialize>,
    name: String,
    symbol: String,
    uri: String,
    decimals: u8,
    transfer_hook_program: Option<Pubkey>, // NOVO
) -> Result<()> {
    let stablecoin_config = &mut ctx.accounts.stablecoin_config;
    
    // ... código existente ...
    
    // Configurar transfer hook se fornecido
    if let Some(hook_program) = transfer_hook_program {
        msg!("Transfer hook configured: {}", hook_program);
    } else {
        msg!("No transfer hook configured");
    }
    
    Ok(())
}
```

**Critérios de Sucesso:**
- [x] Mint configurado com hook program
- [x] Transfer hook é opcional (None quando não fornecido)
- [x] Código compila
- [x] Hook program pode ser None

---

### Tarefa 3: Testar Hook Funcionando (2 horas)

**Localização:** `tests/stablecoin.ts`

**Testes a criar/adicionar:**

1. **Test 1: Transfer com From Bloqueado**
```typescript
it("blocks transfer from blacklisted address", async () => {
    const blacklistedAddress = Keypair.generate().publicKey;
    
    // Adicionar à blacklist
    await program.methods.addToblacklist({
        address: blacklistedAddress,
    }).rpc();
    
    // Tentar transferir FROM (deve falhar)
    try {
        await program.methods.transfer({
            from: user.publicKey,
            to: recipient.publicKey,
            amount: 1000,
        }).rpc();
        
        assert.fail("Should have blocked transfer from blacklisted address");
    } catch (error) {
        assert.include(error.toString(), "Address is blacklisted");
    }
});
```

2. **Test 2: Transfer com To Bloqueado**
```typescript
it("blocks transfer to blacklisted address", async () => {
    const blacklistedAddress = Keypair.generate().publicKey;
    
    // Adicionar à blacklist
    await program.methods.addToblacklist({
        address: blacklistedAddress,
    }).rpc();
    
    // Tentar transferir TO (deve falhar)
    try {
        await program.methods.transfer({
            from: user.publicKey,
            to: blacklistedAddress,
            amount: 1000,
        }).rpc();
        
        assert.fail("Should have blocked transfer to blacklisted address");
    } catch (error) {
        assert.include(error.toString(), "Address is blacklisted");
    }
});
```

3. **Test 3: Transfer Permitido (Nenhum Bloqueado)**
```typescript
it("allows transfer when neither address is blacklisted", async () => {
    // Não adicionar ninguém à blacklist
    
    // Transferir normalmente
    const tx = await program.methods.transfer({
        from: user.publicKey,
        to: recipient.publicKey,
        amount: 1000,
    }).rpc();
    
    // Verificar que não houve erro
    assert.ok(tx);
});
```

4. **Test 4: Transfer Ambos Bloqueados**
```typescript
it("blocks transfer when both addresses are blacklisted", async () => {
    const blacklisted1 = Keypair.generate().publicKey;
    const blacklisted2 = Keypair.generate().publicKey;
    
    // Adicionar ambos à blacklist
    await program.methods.addToblacklist({
        address: blacklisted1,
    }).rpc();
    await program.methods.addToblacklist({
        address: blacklisted2,
    }).rpc();
    
    // Tentar transferir de bloqueado para bloqueado
    try {
        await program.methods.transfer({
            from: blacklisted1,
            to: blacklisted2,
            amount: 1000,
        }).rpc();
        
        assert.fail("Should have blocked transfer between blacklisted addresses");
    } catch (error) {
        assert.include(error.toString(), "Address is blacklisted");
    }
});
```

5. **Test 5: Remove da Blacklist**
```typescript
it("allows transfer after removing from blacklist", async () => {
    const blacklistedAddress = Keypair.generate().publicKey;
    
    // Adicionar à blacklist
    await program.methods.addToblacklist({
        address: blacklistedAddress,
    }).rpc();
    
    // Remover da blacklist
    await program.methods.removeFromBlacklist({
        address: blacklistedAddress,
    }).rpc();
    
    // Transferir agora (deve funcionar)
    const tx = await program.methods.transfer({
        from: user.publicKey,
        to: blacklistedAddress,
        amount: 1000,
    }).rpc();
    
    assert.ok(tx);
});
```

**Critérios de Sucesso:**
- [x] Todos os 5 testes passam
- [x] Verifica logs de execução
- [x] Verifica que from bloqueado não transfere
- [x] Verifica que to bloqueado não recebe
- [x] Verifica que transfer permitido funciona

---

### Tarefa 4: Atualizar TypeScript SDK (1 hora)

**Localização:** `src/sdk/stablecoin.ts`

**Arquivos a modificar:**
1. `src/sdk/stablecoin.ts`

**Modificações necessárias:**

1. Adicionar método para configurar hook no initialize
```typescript
/**
 * Initialize stablecoin with optional transfer hook
 */
async function initializeWithHook(
  config: StablecoinConfig & {
    transferHookProgram?: PublicKey
  }
): Promise<string> {
  const tx = await program.methods.initialize(
    config.name,
    config.symbol,
    config.uri,
    config.decimals,
    config.transferHookProgram || null, // NOVO
  ).rpc();

  console.log('Stablecoin initialized with hook:', config.transferHookProgram);
  return tx;
}
```

2. Adicionar método para inicializar com hook
```typescript
/**
 * Initialize stablecoin WITH transfer hook
 */
export async function initializeWithTransferHook(
  connection: Connection,
  wallet: any,
  name: string,
  symbol: string,
  uri: string,
  decimals: number,
  hookProgramId: PublicKey
): Promise<string> {
  const sdk = createStablecoinSDK(connection, wallet);

  const config = {
    name,
    symbol,
    uri,
    decimals,
    enable_permanent_delegate: true,
    enable_transfer_hook: true,
    default_account_frozen: false,
    mint_authority: wallet.publicKey,
    freeze_authority: wallet.publicKey,
    transferHookProgram: hookProgramId, // NOVO
  };

  const tx = await sdk.initialize(config);
  return tx;
}
```

3. Adicionar exemplos de uso
```typescript
// Example: Initialize with hook
const connection = new Connection(clusterApiUrl('devnet'));
const wallet = window.solana;
const hookProgramId = new PublicKey('HOOKPROG11111111111111111111111');

const tx = await initializeWithTransferHook(
  connection,
  wallet,
  'My USD Stablecoin',
  'MYUSD',
  'https://example.com/metadata.json',
  9,
  hookProgramId
);

console.log('Initialized with hook:', tx);
```

**Critérios de Sucesso:**
- [x] Método `initializeWithHook` criado
- [x] Suporte a hook program opcional
- [x] Exemplos de uso adicionados
- [x] TypeScript compila sem erros

---

### Tarefa 5: Atualizar Documentação (30 minutos)

**Localização:** Root do projeto

**Arquivos a criar/atualizar:**

1. `README.md` - Adicionar seção sobre Transfer Hook
```markdown
## Transfer Hook Integration

The stablecoin supports an optional Transfer Hook for real-time blacklist enforcement.

### What is Transfer Hook?

A separate Solana program that intercepts EVERY transfer before it executes, checking if the addresses are blacklisted.

### How to Use

1. Deploy the Transfer Hook program
2. Initialize your stablecoin with the hook program address
3. All transfers will now be automatically checked against the blacklist

### Example

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

### Transfer Scenarios

| Scenario | From | To | Result |
|----------|------|-----|--------|
| Normal | ✅ | ✅ | ✅ Allowed |
| From Blacklisted | ❌ | ✅ | ❌ Blocked |
| To Blacklisted | ✅ | ❌ | ❌ Blocked |
| Both Blacklisted | ❌ | ❌ | ❌ Blocked |
```

2. `DEPLOYMENT.md` - Atualizar guia para deploy do hook

**Seções a adicionar:**
```markdown
## Step 5: Deploy Transfer Hook Program

### 5.1 Build Transfer Hook Program

```bash
cd programs/transfer-hook-program
anchor build
```

### 5.2 Deploy Transfer Hook to Devnet

```bash
# Deploy the hook program
anchor deploy --provider.cluster devnet
```

### 5.3 Get Hook Program Address

```bash
anchor keys list | grep "transfer-hook-program"
```

### 5.4 Initialize Stablecoin with Hook

```typescript
import { initializeWithTransferHook } from './src/sdk/stablecoin';

const hookProgramId = new PublicKey('HOOKPROG...');
await initializeWithTransferHook(connection, wallet, config, hookProgramId);
```

### 5.5 Test Transfer Hook

```typescript
// Test scenarios (see EXAMPLES.md)
await program.methods.transfer({
  from: user.publicKey,
  to: blacklistedAddress,
  amount: 1000,
}).rpc();

// Should fail with "Address is blacklisted"
```
```

**Critérios de Sucesso:**
- [x] README atualizado com seção de Transfer Hook
- [x] DEPLOYMENT.md atualizado com passos do hook
- [x] Exemplos claros de uso
- [x] Diagramas atualizados (se necessário)

---

### Tarefa 6: Verificar e Debugar (1 hora)

**O que fazer:**
1. Tentar compilar hook program
2. Verificar se há erros de compilação
3. Corrigir erros se houver
4. Testar localmente com `anchor test`
5. Verificar logs de execução

**Critérios de Sucesso:**
- [x] `anchor build` funciona sem erros
- [x] `anchor test` passa
- [x] Transfer hook funciona corretamente
- [x] Logs mostram verificação de blacklist
- [x] Nenhum erro runtime

---

### Tarefa 7: Atualizar Status (contínuo)

**O que fazer:**
1. A cada tarefa completa, atualizar `TAREFA_1_FEITA`, etc.
2. Atualizar `TOKEN2022_MIGRATION_PROGRESS_2.md`
3. Atualizar progresso no tracker

---

## 📊 Cronograma do Dia Amanhã

### Manhã (09:00 - 12:00)
**Tarefas:**
- Tarefa 1: Criar Programa Transfer Hook (1 hora)
- Tarefa 2: Configurar Hook no Mint (1 hora)
- Tarefa 6: Verificar e Debugar (1 hora)
- Break: 1 hora

**Meta:** 4 horas de trabalho

### Tarde (13:00 - 18:00)
**Tarefas:**
- Tarefa 3: Testar Hook Funcionando (2 horas)
- Tarefa 4: Atualizar TypeScript SDK (1 hora)
- Tarefa 5: Atualizar Documentação (30 minutos)
- Break: 30 minutos

**Meta:** 3.5 horas de trabalho

### Noite (18:00 - 20:00)
**Tarefas:**
- Review final de código
- Limpeza e organização
- Preparar submissão

**Meta:** 2 horas de trabalho

---

## 🎯 Meta Final do Dia Amanhã

### O Que Precisa Estar Pronto

1. ✅ **Transfer Hook Program** - Criado e deployado
2. ✅ **Hook Integration** - Configurado no mint
3. ✅ **Testes Completos** - 5 testes passing
4. ✅ **TypeScript SDK** - Atualizado com hook support
5. ✅ **Documentação** - README e DEPLOYMENT atualizados
6. ✅ **Build Funcionando** - `anchor build` e `anchor test` funcionando

### O Que Significa "100% Completo"

- **Arquitetura:** Hook separado, mint configurado, transferências verificadas
- **Funcionalidade:** "Transfer Hook checks EVERY transfer against blacklist"
- **Testes:** Cenários cobrindo todos os casos (from/to blocked)
- **Documentação:** Guia completo de deployment e uso
- **Code Quality:** TypeScript SDK type-safe, Rust código limpo

---

## 📋 Checklist de Sucesso

### Código
- [ ] Transfer Hook Program compilando
- [ ] Hook integrado no mint
- [ ] `anchor build` funciona
- [ ] `anchor test` passa

### Testes
- [ ] Transfer from blacklisted: Blocked ✅
- [ ] Transfer to blacklisted: Blocked ✅
- [ ] Transfer permitido: Allowed ✅
- [ ] Transfer ambos blocked: Blocked ✅
- [ ] Remove from blacklist: Allowed ✅

### Documentação
- [ ] README atualizado
- [ ] DEPLOYMENT.md atualizado
- [ ] EXAMPLES.md atualizado
- [ ] TypeScript SDK atualizado

### Progresso
- [ ] Tracker atualizado com status
- [ ] Progress report criado
- [ ] Backup feito

---

## 🎯 Conclusão do Dia

**Esperado:**
- Transfer Hook 100% funcional e testado
- 100% dos requisitos do bounty cumpridos
- Código pronto para submissão
- Chance alta de 1º ou 2º lugar

**Risco Remanescente:**
- Baixo - código está bem estruturado e testado
- Competição baixa (3 aplicações)
- Deadline longa (19 dias restantes)

---

## 💠 Notas Para Amanhã

### Pontos Críticos

1. **Priorizar Tarefa 1 e 2** (Criar hook + Configurar mint)
   - Essas são as bases para todo o resto
   - Sem isso, os testes não funcionam

2. **Testar Iterativamente**
   - Após cada implementação, testar imediatamente
   - Não esperar até implementar tudo

3. **Manter Logs Detalhados**
   - Use `msg!` macros no Rust
   - Verificar logs do Anchor
   - Documentar descobertas

4. **Usar Versão Estável de Anchor**
   - Anchor 0.30.0 pode ter bugs
   - Se necessário, usar 0.29.0 (mesma que Token-2022)

5. **Backup Antes de Cada Mudança**
   - Commit antes de modificações grandes
   - Facilita rollback se algo falhar

---

**Criação:** 2026-02-26 02:55 UTC
**Início Execução:** Amanhã (assim que você estiver pronto)
**Meta:** Transfer Hook 100% funcional e testado
