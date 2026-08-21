This is an [Agentcard](https://agentcard.sh) agent template for [eve](https://eve.dev): an agent with a wallet. It can shop and check out at real merchants (DoorDash, Good Eggs, flights), pay at any other checkout with a single-use virtual card, take the user's own card, and manage the cash that funds all of it.

The whole integration is one connection file, `agent/connections/agentcard.ts`:

```ts
import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

const APPROVAL_GATED = ["create_card", "get_card_details", "remove_added_card"];

export default defineMcpClientConnection({
  url: "https://mcp.agentcard.sh/mcp",
  description:
    "Agentcard: the agent's wallet. Shop and check out at real merchants (DoorDash, Good Eggs, flights) with the conversational `buy` tool (thread conversation_id on follow-ups), issue a single-use virtual card to pay at any checkout, let the user add their own card, and manage the cash that funds it: balance, top-ups, transactions, KYC, human support.",
  auth: connect(process.env.AGENTCARD_CONNECTOR ?? "mcp.agentcard.sh/agentcard"),
  tools: {
    allow: [
      // Shopping
      "buy", "get_instructions", "buy_list_merchants", "buy_connect",
      "buy_connect_status", "buy_unlink_merchant", "manage_subscription",
      // Cash
      "get_balance", "add_funds", "list_transactions",
      // Issued cards: pay at any checkout
      "create_card", "get_card_details", "get_card_balance", "list_cards", "close_card",
      // The user's own card, no prefunding or KYC
      "add_card", "list_added_cards", "remove_added_card", "get_wallet_link",
      // Account
      "whoami", "start_kyc", "get_kyc_status",
      "submit_kyc_document", "check_kyc_document", "submit_kyc_fields",
      // Human support
      "start_support_chat", "send_support_message", "read_support_chat",
    ],
  },
  approval: ({ toolName }) =>
    APPROVAL_GATED.includes(toolName.split("__").pop() ?? toolName) ? "user-approval" : "not-applicable",
});
```

Already have an eve agent? Run `eve add connection/agentcard` (see the [eve integration page](https://eve.dev/integrations/agentcard)), or copy that file into `agent/connections/`.

## Getting Started

You need Node 24 or newer (eve's requirement).

First, link the project and create the Agentcard connector. Agentcard is a [first-party Vercel Connect integration](https://vercel.com/connect/agentcard):

```bash
vercel link
vercel connect create agentcard
vercel env pull
```

If the connector UID the create command prints differs from the template default (`mcp.agentcard.sh/agentcard`), set it as `AGENTCARD_CONNECTOR` (or edit the default in `agent/connections/agentcard.ts`).

Then, run the development server:

```bash
pnpm install
pnpm dev
```

Try it in the dev TUI:

> order my usual burrito bowl from DoorDash

The first Agentcard call sends the user a sign-in link and parks the turn. Vercel Connect stores and refreshes the token; credentials never enter model context. New users are onboarded by Agentcard on first sign-in.

You can start editing the agent by modifying `agent/agent.ts`. Its behavior is defined in `agent/instructions.md`, and the Agentcard connection lives in `agent/connections/agentcard.ts`. The agent auto-updates as you edit the files.

## How it works

- **Shopping is one conversational tool.** `buy` handles search, cart, confirmation, and payment on the server. The agent passes the user's words through and threads `conversation_id` on follow-ups. There is no cart state to manage in your agent.
- **Paying anywhere else is a card away.** For checkouts the agent drives itself, `create_card` issues a single-use virtual card for the exact amount and `get_card_details` reveals it at fill time. Both pause for the user's approval (the eve approval policy above), and cards close themselves after one authorized payment.
- **Users can bring their own card.** `add_card` runs a hosted enrollment for the user's Visa or Mastercard, so there is nothing to prefund and no KYC. Unenrolling (`remove_added_card`) pauses for the user's approval, since re-adding repeats the ceremony.
- **The wallet comes along.** `get_balance`, `add_funds`, and `list_transactions` cover the money questions: what is in the wallet, topping it up (a payment link the user opens themselves), and what was spent. If a checkout is short on funds, `buy` hands back a funding link on its own.
- **Checkout is consent-gated server-side.** A `buy` purchase only executes after the user explicitly confirms the shown total inside the conversation. This is enforced by Agentcard's API, not by prompt.
- **The footguns stay out.** The filter excludes `approve_request` (an agent must never satisfy an approval meant for the human), `revoke_connection`, plan and settings writes, and withdrawals. Drop the `tools` filter for the complete account surface.

Agentcard's own production buy agent runs on eve too, so this is the integration path we use ourselves.

## Learn More

To learn more, take a look at the following resources:

- [Agentcard documentation](https://docs.agentcard.sh) - the `buy` tool contract and the rest of the MCP surface.
- [eve documentation](https://eve.dev/docs) - learn about eve features and API.
- [Vercel Connect](https://vercel.com/connect/agentcard) - manages the Agentcard connection's credentials in this template.
