This is an [Agentcard](https://agentcard.sh) shopping agent template for [eve](https://eve.dev): an agent with a wallet that can shop and check out at real merchants (DoorDash, Good Eggs, flights), paying with a single-use virtual card created at checkout.

The whole integration is one connection file:

```ts
// agent/connections/agentcard.ts
import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";
import { once } from "eve/tools/approval";

export default defineMcpClientConnection({
  url: "https://mcp.agentcard.sh/mcp",
  description:
    "Agentcard: shop and check out at real merchants (DoorDash, Good Eggs, flights) paying with a single-use virtual card, plus the wallet that funds it (balance, top-ups, transactions). Conversational: call `buy` with the user's request and thread conversation_id on follow-ups.",
  auth: connect(process.env.AGENTCARD_CONNECTOR ?? "mcp.agentcard.sh/agentcard"),
  tools: {
    allow: [
      "buy",
      "get_instructions",
      "buy_list_merchants",
      "buy_connect",
      "buy_connect_status",
      "get_balance",
      "add_funds",
      "list_transactions",
    ],
  },
  approval: once(),
});
```

Already have an eve agent? Run `eve add connection/agentcard` (see the [eve integration page](https://eve.dev/integrations/agentcard)), or copy that file into `agent/connections/`.

## Getting Started

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

- **One conversational tool.** `buy` handles search, cart, confirmation, and payment on the server. The agent passes the user's words through and threads `conversation_id` on follow-ups. There is no cart state to manage in your agent.
- **The wallet comes along.** `get_balance`, `add_funds`, and `list_transactions` cover the money questions around shopping: what is in the wallet, topping it up (a payment link the user opens themselves), and what was spent. If a checkout is short on funds, `buy` hands back a funding link on its own.
- **Checkout is consent-gated server-side.** A purchase only executes after the user explicitly confirms the shown total inside the conversation. This is enforced by Agentcard's API, not by prompt.
- **Single-use cards.** Each checkout pays with a virtual card created for that purchase and closed after it, so no long-lived card credential exists anywhere in the loop.
- **Defense in depth.** The connection allows only the shopping and wallet tools, keeping card credentials and card management out of the agent's reach, and adds a `once()` approval gate so a human approves before the first Agentcard call in a session. Drop the `tools` filter for the full account surface.

Agentcard's own production buy agent runs on eve too, so this is the integration path we use ourselves.

## Learn More

To learn more, take a look at the following resources:

- [Agentcard documentation](https://docs.agentcard.sh) - the `buy` tool contract and the rest of the MCP surface.
- [eve documentation](https://eve.dev/docs) - learn about eve features and API.
- [Vercel Connect](https://vercel.com/connect/agentcard) - manages the Agentcard connection's credentials in this template.
