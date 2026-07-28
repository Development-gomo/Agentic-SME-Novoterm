import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SERVER_URL = "http://localhost:3131/mcp";

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));
  const client = new Client({ name: "novoterm-verification-client", version: "1.0.0" });

  console.log("Connecting (real handshake: initialize + capability negotiation)...");
  await client.connect(transport);
  console.log("Connected. Server info:", client.getServerVersion());

  console.log("\n--- tools/list (real client call) ---");
  const toolsList = await client.listTools();
  console.log(`Discovered ${toolsList.tools.length} tools:`, toolsList.tools.map((t) => t.name).join(", "));

  console.log("\n--- tools/call: get_company ---");
  const companyResult = await client.callTool({ name: "get_company", arguments: {} });
  const companyData = JSON.parse(companyResult.content[0].text);
  console.log("Company name:", companyData.name, "| CEO:", companyData.about?.ceo?.name);

  console.log("\n--- tools/call: get_service (real slug) ---");
  const serviceResult = await client.callTool({ name: "get_service", arguments: { slug: "premiumoversattning" } });
  const serviceData = JSON.parse(serviceResult.content[0].text);
  console.log("Service:", serviceData.title, "| benefits:", serviceData.benefits.length, "| process steps:", serviceData.process.length);

  console.log("\n--- tools/call: get_service (invalid slug, expect isError) ---");
  const badResult = await client.callTool({ name: "get_service", arguments: { slug: "does-not-exist" } });
  console.log("isError:", badResult.isError, "| message:", badResult.content[0].text);

  console.log("\n--- tools/call: get_service (missing required arg) ---");
  // Per the MCP spec, tool-execution failures are reported via isError: true in a
  // normal JSON-RPC result, not a protocol-level error — so this resolves rather
  // than throws. The input-validation rejection happens before the tool handler runs.
  const missingArgResult = await client.callTool({ name: "get_service", arguments: {} });
  const rejectedCorrectly = missingArgResult.isError === true;
  console.log(rejectedCorrectly ? "Correctly rejected:" : "FAILED TO REJECT:", missingArgResult.content[0].text.slice(0, 100));
  if (!rejectedCorrectly) throw new Error("Server accepted a call missing a required argument");

  await client.close();
  console.log("\nClient closed cleanly.");
}

main().catch((err) => {
  console.error("CLIENT TEST FAILED:", err);
  process.exit(1);
});
