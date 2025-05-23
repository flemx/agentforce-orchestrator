import type { AIMessage } from '@langchain/core/messages';
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from '@langchain/openai';

import { MessagesAnnotation, StateGraph } from '@langchain/langgraph';
// import { ToolNode } from "@langchain/langgraph/prebuilt";

type MyState = MessagesAnnotation.State & {
  apiKey?: string;
  awaitingKey?: boolean; // helper flag
};

// 1) Asks for key if we don't have one
function getApiKey(state: MyState) {
  if (state.apiKey) return { messages: [] }; // nothing to do
  state.awaitingKey = true;
  return {
    messages: {
      role: 'assistant',
      content: '🔐 Please provide your OpenAI API key.',
    },
  };
}

// 2) Stores the key when the user replies
function setApiKey(state: MyState) {
  const last = state.messages[state.messages.length - 1];
  if (state.awaitingKey && last?.role === 'user') {
    state.apiKey = last.content.trim();
    state.awaitingKey = false;
  }
  return { messages: [] };
}

// const tools = [
//   new TavilySearchResults({ maxResults: 3, }),
// ];

// Define the function that calls the model
async function callModel(state: MyState) {
  /**
   * Call the LLM powering our agent.
   * Feel free to customize the prompt, model, and other logic!
   */
  const model = new ChatOpenAI({
    model: 'gpt-4o',
    openAIApiKey: state.apiKey, // <-- runtime key!
  });

  const response = await model.invoke([
    {
      role: 'system',
      content: `You are a helpful assistant. The current date is ${new Date().getTime()}.`,
    },
    ...state.messages,
  ]);

  // MessagesAnnotation supports returning a single message or array of messages
  return { messages: response };
}

// Define the function that determines whether to continue or not
function routeModelOutput(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  // if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
  //   return "tools";
  // }
  // Otherwise end the graph.
  return '__end__';
}

// Define a new graph.
// See https://langchain-ai.github.io/langgraphjs/how-tos/define-state/#getting-started for
// more on defining custom graph states.
const workflow = new StateGraph<MyState>(MessagesAnnotation)
  .addNode('getApiKey', getApiKey)
  .addNode('setApiKey', setApiKey)
  .addNode('callModel', callModel)
  .addEdge('__start__', 'getApiKey')
  .addEdge('getApiKey', 'setApiKey')
  .addEdge('setApiKey', 'callModel')
  .addConditionalEdges('callModel', routeModelOutput, ['__end__']);

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  // if you want to update the state before calling the tools
  // interruptBefore: [],
});
