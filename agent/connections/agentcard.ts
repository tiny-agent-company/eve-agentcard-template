import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";
import { once } from "eve/tools/approval";

// AGENTCARD_CONNECTOR is the UID returned by Vercel Connect. Agentcard is a
// first-party connector (https://vercel.com/connect/agentcard): create one
// with `vercel connect create agentcard` and use the UID it prints.
const agentcardConnector =
  process.env.AGENTCARD_CONNECTOR ?? "mcp.agentcard.sh/agentcard";

export default defineMcpClientConnection({
  url: "https://mcp.agentcard.sh/mcp",
  description:
    "Agentcard: shop and check out at real merchants (DoorDash, Good Eggs, flights) paying with a single-use virtual card, plus the wallet that funds it (balance, top-ups, transactions). Conversational: call `buy` with the user's request and thread conversation_id on follow-ups.",
  auth: connect(agentcardConnector),
  // The surface designed for third-party agents: the buy conversation,
  // merchant discovery and linking, and the wallet that funds it. Excluded on
  // principle: card credentials (get_card_details puts the card number and CVV
  // in the transcript), card management, spend self-approval, plans, and
  // revoke_connection. Drop the filter for the full Agentcard account surface.
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
  // Ask the human once per session before the first Agentcard call. Checkout
  // itself is additionally consent-gated server-side: a purchase only executes
  // after the user confirms the shown total inside the buy conversation.
  approval: once(),
});
