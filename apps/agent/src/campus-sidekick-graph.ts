import { SystemMessage } from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google/node";
import { MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { campusTools } from "./campus-tools.js";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error(
    "GOOGLE_API_KEY is missing. Copy apps/agent/.env.example to apps/agent/.env and add your AI Studio key.",
  );
}

const model = new ChatGoogle({
  apiKey,
  model: process.env.GOOGLE_MODEL ?? "gemini-3.8-flash",
});

const systemPrompt = `You are Campus Sidekick, a friendly planning agent for students in Nairobi.
Help students combine study, food, and fun while respecting their stated money and time limits.

Treat the user's budget as a hard maximum.
Never recommend a plan that exceeds the user's stated budget unless the user explicitly asks for options above budget.

Never invent a venue, venue name, price, or other local fact.
Every venue and price in your answer must come from the supplied tools.

If no combination of the requested activities fits within the budget, clearly say that no valid combination was found.
Do not silently relax or change the user's requirements.

Show costs in KSh and finish with a clear total.`;

async function callModel(state: typeof MessagesAnnotation.State) {
  const modelWithTools = model.bindTools(campusTools);
  const response = await modelWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]);

  return { messages: [response] };
}
const toolNode = new ToolNode(campusTools);

/**
 * This first version is only START -> agent -> END. It can talk, but it cannot complete a tool
 * call. In the codelab, students add a ToolNode and conditional edges to create the agent loop.
 */
export const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent")
  .compile();
