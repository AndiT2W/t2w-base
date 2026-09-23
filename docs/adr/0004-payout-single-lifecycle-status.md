# Single payout lifecycle status

Payout mail delivery and bank payment are represented by one `status`, while `MAIL_GESENDET` and `AUSBEZAHLT` remain separate milestones because a sent email does not prove that money was transferred. The previous parallel mail/payment fields allowed contradictory combinations; a single lifecycle removes those combinations, and transient `VERSAND_LAEUFT` preserves atomic automation claiming. Workflow, retry, error, and external-message metadata belong to the shared `AutomationClaim`, not to `Payout`.
