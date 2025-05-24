// src/components/SetApiKey.tsx  (client component)
"use client";
import { useState } from "react";

export default function SetApiKey({
  assistantId,
  onDone,
}: {
  assistantId: string;
  onDone: () => void;
}) {
  const [key, setKey] = useState("");

  async function handleSave() {
    if (!key) return;
    // (a) call the dev server directly  ───────────────────────────
    console.log(`CHECK API_URL: ${process.env.NEXT_PUBLIC_API_URL!}`);
    await fetch(`https://agentforceorchestrator-jltw--2024--55edb8f4.local-credentialless.webcontainer.io/assistants/${assistantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openai_api_key: key }),
    });

    /*  alternatively, (b) use the SDK  ───────────────────────────
    import { createClient } from "@langchain/langgraph";
    const client = createClient({ baseUrl: "http://localhost:2024" });
    await client.assistants.update(assistantId, { openaiApiKey: key });
    */

    sessionStorage.setItem("openai_key", key); // keep it for later UI logic
    onDone();
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="mb-2">🔐 OpenAI Key required</h2>
      <input
        type="password"
        value={key}
        placeholder="sk-..."
        onChange={(e) => setKey(e.target.value)}
        className="border px-2 py-1 mr-2"
      />
      <button onClick={handleSave} className="px-3 py-1 bg-blue-500 text-white">
        Save
      </button>
    </div>
  );
}
