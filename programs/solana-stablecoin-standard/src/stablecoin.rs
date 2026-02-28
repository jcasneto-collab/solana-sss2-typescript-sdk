// Solana Stablecoin Standard - SSS-2 Compliant Implementation
// Migrating to Token-2022 with Transfer Hook

use anchor_lang::prelude::*;
use anchor_spl::token_2022::{
    self,
    extensions::{
        transfer_hook::TransferHook,
        mint::Mint,
    },
    state::Mint,
    instruction::TransferChecked,
};

// Re-export error codes from lib.rs
use super::StablecoinError;

#[program]
pub mod stablecoin {
    use super::*;

    /// Initialize SSS-2 Compliant Stablecoin with Token-2022
    /// Creates mint with transfer hook for blacklist enforcement
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        // Validate string lengths
        require!(name.len() <= 32, StablecoinError::NameTooLong);
        require!(symbol.len() <= 16, StablecoinError::SymbolTooLong);
        require!(uri.len() <= 256, StablecoinError::UriTooLong);
        
        stablecoin_config.name = name;
        stablecoin_config.symbol = symbol;
        stablecoin_config.uri = uri;
        stablecoin_config.decimals = decimals;
        stablecoin_config.mint_authority = ctx.accounts.authority.key();
        stablecoin_config.freeze_authority = ctx.accounts.authority.key();
        stablecoin_config.bump = ctx.bumps.stablecoin_config;

        msg!("Stablecoin initialized with Token-2022: {}", stablecoin_config.symbol);
        Ok(())
    }
        stablecoin_config.uri = uri;
        stablecoin_config.decimals = decimals;
        stablecoin_config.mint_authority = ctx.accounts.authority.key();
        stablecoin_config.freeze_authority = ctx.accounts.authority.key();
        stablecoin_config.bump = ctx.bumps.stablecoin_config;

        msg!("Stablecoin initialized with Token-2022: {}", stablecoin_config.symbol);
        Ok(())
    }

    /// Mint new tokens to a recipient account
    /// Uses Token-2022 Mint extension
    pub fn mint_to(
        ctx: Context<MintTo>,
        amount: u64,
    ) -> Result<()> {
        let cpi_accounts = token_2022::instruction::MintTo {
            token_program: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            ),
            amount,
        )?;
        
        msg!("Minted {} tokens to {}", amount, ctx.accounts.to.key());
        Ok(())
    }

    /// Freeze a token account (compliance)
    /// Uses Token-2022 Freeze extension
    pub fn freeze_account(ctx: Context<FreezeAccount>) -> Result<()> {
        let cpi_accounts = token_2022::instruction::FreezeAccount {
            token_program: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            account: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        token_2022::freeze_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            ),
        )?;
        
        msg!("Froze account {}", ctx.accounts.token_account.key());
        Ok(())
    }

    /// Thaw a frozen token account
    /// Uses Token-2022 Thaw extension
    pub fn thaw_account(ctx: Context<ThawAccount>) -> Result<()> {
        let cpi_accounts = token_2022::instruction::ThawAccount {
            token_program: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            account: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        token_2022::thaw_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            ),
        )?;
        
        msg!("Thawed account {}", ctx.accounts.token_account.key());
        Ok(())
    }

    /// Add an address to blacklist (compliance)
    /// Stores blacklist status in PDA for Transfer Hook
    pub fn add_to_blacklist(
        ctx: Context<ModifyBlacklist>, 
        address: Pubkey
    ) -> Result<()> {
        let blacklist_entry = &mut ctx.accounts.blacklist_entry;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        blacklist_entry.address = address;
        blacklist_entry.is_blacklisted = true;
        blacklist_entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Added address {} to blacklist (for Transfer Hook)", address);
        Ok(())
    }

    /// Remove an address from blacklist
    pub fn remove_from_blacklist(
        ctx: Context<ModifyBlacklist>, 
        address: Pubkey
    ) -> Result<()> {
        let blacklist_entry = &mut ctx.accounts.blacklist_entry;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        blacklist_entry.address = address;
        blacklist_entry.is_blacklisted = false;
        blacklist_entry.timestamp = Clock::get()?.unix_timestamp;

        msg!("Removed address {} from blacklist", address);
        Ok(())
    }

    /// Seize tokens from a blacklisted account (compliance)
    /// Freeze + Transfer to treasury
    pub fn seize_tokens(
        ctx: Context<SeizeTokens>,
        amount: u64,
    ) -> Result<()> {
        // First freeze the account
        let freeze_cpi = token_2022::instruction::FreezeAccount {
            token_program: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            account: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        token_2022::freeze_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                freeze_cpi,
            ),
        )?;

        // Then transfer to treasury
        let transfer_cpi = token_2022::instruction::TransferChecked {
            token_program: ctx.accounts.token_program.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
            amount: ctx.accounts.amount,
            decimals: ctx.accounts.mint.decimals,
        };
        
        token_2022::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                transfer_cpi,
            ),
            amount,
        )?;

        msg!("Seized {} tokens from {} to treasury", amount, ctx.accounts.from.key());
        Ok(())
    }

    /// Update mint authority (multi-sig compatible)
    pub fn update_minter(
        ctx: Context<UpdateAuthority>,
        new_mint_authority: Pubkey,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        require!(
            ctx.accounts.authority.key() == stablecoin_config.mint_authority,
            StablecoinError::UnauthorizedAccess
        );

        stablecoin_config.mint_authority = new_mint_authority;
        msg!("Updated mint authority to {}", new_mint_authority);
        Ok(())
    }

    /// Update freeze authority (multi-sig compatible)
    pub fn update_freezer(
        ctx: Context<UpdateAuthority>,
        new_freeze_authority: Pubkey,
    ) -> Result<()> {
        let stablecoin_config = &mut ctx.accounts.stablecoin_config;
        
        require!(
            ctx.accounts.authority.key() == stablecoin_config.freeze_authority,
            StablecoinError::UnauthorizedAccess
        );

        stablecoin_config.freeze_authority = new_freeze_authority;
        msg!("Updated freeze authority to {}", new_freeze_authority);
        Ok(())
    }
}

// ============================================================================
// Contexts (Account Validation)
// ============================================================================

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String, decimals: u8, transfer_hook_program: Option<Pubkey>)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 16 + 256 + 1 + 32 + 32 + 1, // discriminator + strings + decimals + authorities + bump
        seeds = [b"stablecoin", mint.key().as_ref()],
        bump
    )]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(
        init,
        payer = payer,
        space = 32 + 1, // program key + discriminator
        seeds = [b"transfer_hook", transfer_hook_program.as_ref()],
        bump
    )]
    pub transfer_hook_program: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = authority,
        // NOVO: Configurar mint com hook program se fornecido
        extension::transfer_hook::TransferHook {
            program: transfer_hook_program,
            authority: mint_authority,
        },
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub transfer_hook_program: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token_2022::ID>,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = authority,
    )]
    pub to: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token_2022::ID>,
}

#[derive(Accounts)]
pub struct FreezeAccount<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, token_2022::ID>,
}

#[derive(Accounts)]
pub struct ThawAccount<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, token_2022::ID>,
}

#[derive(Accounts)]
pub struct ModifyBlacklist<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 1 + 8, // discriminator + address + bool + timestamp
        seeds = [b"blacklist", address.as_ref()],
        bump
    )]
    pub blacklist_entry: Account<'info, BlacklistEntry>,

    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SeizeTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub from_authority: Signer<'info>,

    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, token_2022::ID>,
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(mut)]
    pub stablecoin_config: Account<'info, StablecoinConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// Data Structures
// ============================================================================

#[account]
pub struct StablecoinConfig {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub mint_authority: Pubkey,
    pub freeze_authority: Pubkey,
    pub bump: u8,
}

#[account]
pub struct BlacklistEntry {
    pub address: Pubkey,
    pub is_blacklisted: bool,
    pub timestamp: i64,
}
