import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

// AGENTCARD_CONNECTOR is the UID returned by Vercel Connect. Agentcard is a
// first-party connector (https://vercel.com/connect/agentcard): create one
// with `vercel connect create agentcard` and use the UID it prints.
const agentcardConnector =
  process.env.AGENTCARD_CONNECTOR ?? "mcp.agentcard.sh/agentcard";

// The two calls where money or card credentials move into the agent's hands.
// Everything else runs without a prompt; checkout consent is enforced
// server-side inside the `buy` conversation regardless.
const APPROVAL_GATED = ["create_card", "get_card_details"];

export default defineMcpClientConnection({
  url: "https://mcp.agentcard.sh/mcp",
  description:
    "Agentcard: the agent's wallet. Shop and check out at real merchants (DoorDash, Good Eggs, flights) with the conversational `buy` tool (thread conversation_id on follow-ups), issue a single-use virtual card to pay at any checkout, let the user add their own card, and manage the cash that funds it: balance, top-ups, transactions, KYC, human support.",
  auth: connect(agentcardConnector),
  // The full wallet, minus the footguns. Excluded on principle: approve_request
  // (the agent must never satisfy an approval meant for the human),
  // revoke_connection (severs this very connection), plans/billing, settings
  // writes, and withdrawals (the hosted wallet is the surface for moving money
  // out). Drop the filter for the complete Agentcard account surface.
  tools: {
    allow: [
      // Shopping
      "buy",
      "get_instructions",
      "buy_list_merchants",
      "buy_connect",
      "buy_connect_status",
      "buy_unlink_merchant",
      "manage_subscription",
      // Cash
      "get_balance",
      "add_funds",
      "list_transactions",
      // Issued cards: pay at any checkout
      "create_card",
      "get_card_details",
      "get_card_balance",
      "list_cards",
      "close_card",
      // The user's own card, no prefunding or KYC
      "add_card",
      "list_added_cards",
      "remove_added_card",
      "get_wallet_link",
      // Account (KYC is conversational and photo-first: start_kyc returns the
      // exact next steps, submit_kyc_document carries the ID photo or hands
      // out an upload link as the fallback)
      "whoami",
      "start_kyc",
      "get_kyc_status",
      "submit_kyc_document",
      "check_kyc_document",
      "submit_kyc_fields",
      // Human support
      "start_support_chat",
      "send_support_message",
      "read_support_chat",
    ],
  },
  // toolName arrives qualified (agentcard__create_card), so match the tail.
  approval: ({ toolName }) =>
    APPROVAL_GATED.some((t) => toolName.endsWith(t)) ? "user-approval" : "not-applicable",
});
