import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ChatCompletionTool } from 'groq-sdk/resources/chat/completions';

const mcpEndpoint = process.env.SANITY_MCP_ENDPOINT_URL;
const mcpToken = process.env.SANITY_MCP_TOKEN;
const mcpToolPrefix = 'sanityContext_';

type McpTool = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};
type ChatToolParameters = NonNullable<ChatCompletionTool['function']>['parameters'];

export function isSanityContextConfigured(): boolean {
  return Boolean(mcpEndpoint);
}

function getMcpClient(): { client: Client; transport: StreamableHTTPClientTransport } {
  if (!mcpEndpoint) {
    throw new Error('SANITY_MCP_ENDPOINT_URL is not configured.');
  }
  if (!mcpToken) {
    throw new Error('SANITY_MCP_TOKEN is required when using the server-side Sanity Context connection.');
  }

  const headers: HeadersInit = { Authorization: `Bearer ${mcpToken}` };
  const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint), {
    requestInit: { headers },
  });
  const client = new Client(
    { name: 'boardgame-rule-agent', version: '1.0.0' },
    { capabilities: {} },
  );

  return { client, transport };
}

export async function connectSanityContext(): Promise<{
  client: Client;
  tools: ChatCompletionTool[];
  close: () => Promise<void>;
}> {
  const { client, transport } = getMcpClient();
  await client.connect(transport);
  const result = await client.listTools();
  const tools = (result.tools as McpTool[]).map((tool) => ({
    type: 'function' as const,
    function: {
      name: `${mcpToolPrefix}${tool.name}`,
      description: tool.description || `Sanity Context tool: ${tool.name}`,
      parameters: tool.inputSchema as ChatToolParameters,
    },
  }));

  return {
    client,
    tools,
    close: async () => {
      await client.close();
    },
  };
}

export async function callSanityContextTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!name.startsWith(mcpToolPrefix)) {
    throw new Error(`Invalid Sanity Context tool name: ${name}`);
  }

  return await client.callTool({
    name: name.slice(mcpToolPrefix.length),
    arguments: args,
  });
}
