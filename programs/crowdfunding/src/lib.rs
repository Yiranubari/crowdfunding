use anchor_lang::prelude::*;

declare_id!("7nambqXraRSemsidx7EBqxYQkhepXa3zV6TUvNuWWCuh");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create(ctx: Context<Create>, name: String, description: String) => Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.amount_donated = 0;
        campaign.admin = ctx.accounts.user.key;
        Ok(())
    }
}

