import type { AIMessage } from '@langchain/core/messages';
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from '@langchain/openai';
import { MessagesAnnotation, StateGraph, Annotation } from '@langchain/langgraph';
import type { RunnableConfig } from "@langchain/core/runnables";
// import { ToolNode } from "@langchain/langgraph/prebuilt";

const ConfigSchema = Annotation.Root({
  openai_key: Annotation<string>
});

// const tools = [
//   new TavilySearchResults({ maxResults: 3, }),
// ];

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State, config: RunnableConfig) {
  /**
   * Call the LLM powering our agent.
   * Feel free to customize the prompt, model, and other logic!
   */
  const openai_key = config.configurable?.openai_key ?? process.env.OPENAI_API_KEY;
  console.log("Open API Key is: ", openai_key);
  const model = new ChatOpenAI({
    model: 'gpt-4o',
    apiKey: openai_key
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

// // Define the function that determines whether to continue or not
// function routeModelOutput(state: typeof MessagesAnnotation.State) {
//   const messages = state.messages;
//   const lastMessage: AIMessage = messages[messages.length - 1];
//   // If the LLM is invoking tools, route there.
//   // if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
//   //   return "tools";
//   // }
//   // Otherwise end the graph.
//   return '__end__';
// }

// Define a new graph.
// See https://langchain-ai.github.io/langgraphjs/how-tos/define-state/#getting-started for
// more on defining custom graph states.
const workflow = new StateGraph(MessagesAnnotation, ConfigSchema)
  .addNode('callModel', callModel)
  .addEdge('__start__', 'callModel')


// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  // if you want to update the state before calling the tools
  // interruptBefore: [],
});
