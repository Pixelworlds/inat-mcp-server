#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { INaturalistClient } from '@richard-stovall/inat-typescript-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ToolDefinition {
  name: string;
  description: string;
  module: string;
  methods: string[];
  inputSchema: any;
}

interface ToolsData {
  tools: ToolDefinition[];
  methodDocs: Record<string, any>;
  totalTools: number;
}

interface TokenCache {
  accessToken: string | null;
  apiToken: string | null;
  expiresAt: number | null;
  lastRefresh: number | null;
}

interface ServerConfig {
  baseURL: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

class INaturalistMCPServer {
  private config: ServerConfig;
  private client: INaturalistClient | null = null;
  private tokenCache: TokenCache = {
    accessToken: null,
    apiToken: null,
    expiresAt: null,
    lastRefresh: null,
  };
  private server: Server;
  private tools: ToolDefinition[] = [];
  private methodDocs: Record<string, any> = {};

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: 'inat-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.loadTools();
    this.setupHandlers();
  }

  private loadTools(): void {
    try {
      const toolsPath = path.join(__dirname, 'tools-generated.json');
      const toolsData: ToolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
      this.tools = toolsData.tools;
      this.methodDocs = toolsData.methodDocs;
    } catch (error) {
      console.error('Failed to load tools:', error);
      throw new Error('Tools not found. Run yarn generate-tools first.');
    }
  }

  async ensureClient(): Promise<INaturalistClient> {
    if (!this.client) {
      //
      if (this.config.clientId && this.config.clientSecret) {
        if (!this.config.username || !this.config.password) {
          throw new Error(
            'Resource Owner Password Credentials Flow requires both username and password. ' +
              'Authorization Code Flow, PKCE, and Assertion Flow are not supported.'
          );
        }
      }

      this.client = new INaturalistClient({
        baseURL: this.config.baseURL || 'https://api.inaturalist.org/v1',
      });

      await this.ensureAuthentication();
    }
    return this.client;
  }

  private async ensureAuthentication(): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret) {
      console.error('No OAuth credentials provided - using read-only access');
      return;
    }

    try {
      if (this.isTokenValid()) {
        console.error('Using cached access token');
        this.client!.setApiToken(this.tokenCache.accessToken!);
        return;
      }

      console.error('Obtaining new access token...');
      await this.refreshAccessToken();
    } catch (error) {
      console.error('Authentication failed:', (error as Error).message);
      console.error('Falling back to read-only access');
    }
  }

  private isTokenValid(): boolean {
    if (!this.tokenCache.accessToken || !this.tokenCache.expiresAt) {
      return false;
    }

    const now = Date.now();
    const expiresAt = this.tokenCache.expiresAt;
    const bufferTime = 5 * 60 * 1000;

    return now < expiresAt - bufferTime;
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const tokenResponse = await this.client!.authentication.post_oauth_token({
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: this.config.username,
        password: this.config.password,
      });

      if (tokenResponse.data && tokenResponse.data.access_token) {
        const { access_token, expires_in, token_type } = tokenResponse.data;

        this.tokenCache.accessToken = access_token;
        this.tokenCache.expiresAt = Date.now() + expires_in * 1000;
        this.tokenCache.lastRefresh = Date.now();

        this.client!.setApiToken(access_token);

        console.error(`Access token obtained successfully (expires in ${expires_in} seconds)`);
        console.error(`Token type: ${token_type || 'Bearer'}`);

        //
        await this.getApiToken();
      } else {
        throw new Error('No access token received in OAuth response');
      }
    } catch (error) {
      console.error('Failed to refresh access token:', (error as Error).message);
      throw error;
    }
  }

  private async getApiToken(): Promise<void> {
    try {
      const apiTokenResponse = await this.client!.authentication.get_users_api_token();

      if (apiTokenResponse.data && apiTokenResponse.data.api_token) {
        this.tokenCache.apiToken = apiTokenResponse.data.api_token;
        console.error('API token obtained for enhanced access');
      }
    } catch (error) {
      console.error('Could not obtain API token (access token will be used):', (error as Error).message);
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret) {
      return;
    }

    if (!this.isTokenValid()) {
      console.error('Token expired or invalid, refreshing...');
      await this.refreshAccessToken();
    }
  }

  private getTokenStatus(): string {
    if (!this.tokenCache.accessToken) {
      return 'No token cached';
    }

    const now = Date.now();
    const expiresAt = this.tokenCache.expiresAt!;
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= 0) {
      return 'Token expired';
    }

    const minutes = Math.floor(timeUntilExpiry / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `Token valid for ${hours}h ${minutes % 60}m`;
    } else {
      return `Token valid for ${minutes}m`;
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.find(t => t.name === name);
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }

      try {
        const result = await this.callModularTool(tool, args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error('Tool call error:', {
          tool: tool.name,
          module: tool.module,
          args,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
          if ((error as any).response) {
            const response = (error as any).response;
            errorMessage = `HTTP ${response.status}: ${response.statusText}\n`;
            if (response.data) {
              errorMessage += `Response: ${JSON.stringify(response.data, null, 2)}`;
            }
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Error calling ${tool.name}.${(args && args.method) || 'unknown'}: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private getAvailableTools() {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  private async callModularTool(tool: ToolDefinition, args: any = {}) {
    const client = await this.ensureClient();

    await this.ensureValidToken();

    if (!args.method) {
      throw new Error(`Missing required parameter 'method'. Available methods: ${tool.methods.join(', ')}`);
    }

    if (!tool.methods.includes(args.method)) {
      throw new Error(`Invalid method '${args.method}'. Available methods: ${tool.methods.join(', ')}`);
    }

    const moduleObj = (client as any)[tool.module];

    if (!moduleObj) {
      throw new Error(`Module ${tool.module} not found`);
    }

    const method = moduleObj[args.method];
    if (!method || typeof method !== 'function') {
      throw new Error(`Method ${args.method} not found in module ${tool.module}`);
    }

    console.error(`Calling ${tool.module}.${args.method} with params:`, args.params);

    const { method: _, params = {}, ...otherArgs } = args;
    const callParams = { ...params, ...otherArgs };

    if (Object.keys(callParams).length > 0) {
      return await method.call(moduleObj, callParams);
    } else {
      return await method.call(moduleObj);
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('iNaturalist MCP server v0.1.0 started');
    console.error(`Total tools: ${this.tools.length} modules`);
    console.error(`Base URL: ${this.config.baseURL || 'https://api.inaturalist.org/v1'}`);

    if (this.config.clientId && this.config.clientSecret) {
      console.error(
        `Authentication: OAuth Resource Owner Password Credentials Flow (client_id: ${this.config.clientId})`
      );
      if (this.config.username) {
        console.error(`OAuth User: ${this.config.username}`);
      }
      console.error(
        'OAuth Flow: Resource Owner Password Credentials ONLY (Authorization Code, PKCE, and Assertion flows are disabled)'
      );
      console.error('Token Management: Automatic caching and refresh enabled');
    } else {
      console.error('Authentication: None (read-only access)');
    }
  }
}

export { INaturalistMCPServer, type ServerConfig, type ToolDefinition };
