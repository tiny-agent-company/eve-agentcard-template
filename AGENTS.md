# Eve Agent App

This project uses the Eve framework. Before writing code, always read the relevant guide in `node_modules/eve/dist/docs/public/`.

The Agentcard connection in `agent/connections/agentcard.ts` is the agent's whole commerce surface. Its `buy` tool is conversational: pass the user's request through in their own words and thread the returned `conversation_id` on follow-ups. Checkout requires the user's explicit confirmation of the shown total, enforced server-side by Agentcard. Docs: https://docs.agentcard.sh
