import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";
import { once } from "eve/tools/approval";

// AGENTCARD_CONNECTOR is the UID returned by Vercel Connect. For local setup,
// create a connector with `vercel connect create https://mcp.agentcard.sh/mcp --name agentcard`.
const agentcardConnector =
  process.env.AGENTCARD_CONNECTOR ?? "mcp.agentcard.sh/agentcard";

export default defineMcpClientConnection({
  url: "https://mcp.agentcard.sh/mcp",
  description:
    "Agentcard: shop and check out at real merchants (DoorDash, Good Eggs, flights) paying with a single-use virtual card. Conversational: call `buy` with the user's request and thread conversation_id on follow-ups.",
  auth: connect(agentcardConnector),
  // Smallest safe surface: the buy conversation plus merchant discovery and
  // linking. Drop the filter for the full Agentcard account surface (wallet,
  // cards, transactions, support).
  tools: { allow: ["buy", "get_instructions", "buy_list_merchants", "buy_connect", "buy_connect_status"] },
  // Ask the human once per session before the first Agentcard call. Checkout
  // itself is additionally consent-gated server-side: a purchase only executes
  // after the user confirms the shown total inside the buy conversation.
  approval: once(),
});
