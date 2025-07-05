#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema, ErrorCode, GetPromptRequestSchema, ListPromptsRequestSchema, ListResourcesRequestSchema,
    ListToolsRequestSchema, McpError, ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
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

interface UserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  observations_count: number;
  identifications_count: number;
  journal_posts_count: number;
  roles: string[];
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
  private userInfo: UserInfo | null = null;
  private server: Server;
  private tools: ToolDefinition[] = [];
  private methodDocs: Record<string, any> = {};

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: 'inaturalist',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
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
      console.error('Creating new iNaturalist client...');
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

      console.error('Client created, starting authentication...');
      await this.ensureAuthentication();
    }
    return this.client;
  }

  private async ensureAuthentication(): Promise<void> {
    console.error('ensureAuthentication called');
    console.error('Config:', {
      hasClientId: !!this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      hasUsername: !!this.config.username,
      hasPassword: !!this.config.password,
    });

    if (!this.config.clientId || !this.config.clientSecret) {
      console.error('No OAuth credentials provided - using read-only access');
      return;
    }

    try {
      if (this.isTokenValid() && this.tokenCache.accessToken && this.tokenCache.apiToken) {
        console.error('Using cached tokens (both access_token and api_token available)');
        // Don't set a specific token here - we'll handle it per request
        return;
      }

      console.error('Obtaining new tokens...');
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
      // Create a separate client for OAuth with the main iNaturalist site
      const oauthClient = new INaturalistClient({
        baseURL: 'https://www.inaturalist.org',
      });

      console.error('Attempting OAuth authentication with:', {
        baseURL: 'https://www.inaturalist.org',
        endpoint: '/oauth/token',
        grant_type: 'password',
        client_id: this.config.clientId,
        username: this.config.username,
        // Don't log password or client_secret
      });

      const tokenResponse = await oauthClient.authentication.post_oauth_token({
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

        // Set the access token on the client BEFORE calling get_users_api_token
        this.client!.setApiToken(access_token);

        console.error(`Access token obtained successfully (expires in ${expires_in} seconds)`);
        console.error(`Token type: ${token_type || 'Bearer'}`);

        // Now get the API token using the access token
        await this.getApiToken();
      } else {
        throw new Error('No access token received in OAuth response');
      }
    } catch (error) {
      console.error('Failed to refresh access token:', (error as Error).message);
      if ((error as any).response) {
        const response = (error as any).response;
        console.error('OAuth error response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          url: response.config?.url,
        });
      }
      throw error;
    }
  }

  private async getApiToken(): Promise<void> {
    try {
      const apiTokenResponse = await this.client!.authentication.get_users_api_token();

      if (apiTokenResponse.data && apiTokenResponse.data.api_token) {
        this.tokenCache.apiToken = apiTokenResponse.data.api_token;
        console.error('API token obtained successfully');
        console.error('Both tokens now available for different API endpoints');

        // Fetch user info after successful authentication
        await this.fetchUserInfo();
      }
    } catch (error) {
      console.error('Could not obtain API token (access token will be used):', (error as Error).message);
    }
  }

  private async fetchUserInfo(): Promise<void> {
    try {
      // Use the users module to get current user info
      const userResponse = await this.client!.users.get_users_edit();

      if (userResponse.data && userResponse.data.results && userResponse.data.results.length > 0) {
        const user = userResponse.data.results[0];
        this.userInfo = {
          id: user.id,
          login: user.login,
          name: user.name || null,
          email: user.email || null,
          observations_count: user.observations_count || 0,
          identifications_count: user.identifications_count || 0,
          journal_posts_count: user.journal_posts_count || 0,
          roles: user.roles || [],
        };
        console.error(`Authenticated as user: ${this.userInfo.login} (ID: ${this.userInfo.id})`);
      }
    } catch (error) {
      console.error('Could not fetch user info:', (error as Error).message);
      // Fall back to using username from config
      if (this.config.username) {
        this.userInfo = {
          id: 0,
          login: this.config.username,
          name: null,
          email: null,
          observations_count: 0,
          identifications_count: 0,
          journal_posts_count: 0,
          roles: [],
        };
      }
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

  private setAppropriateToken(module: string, method: string): void {
    // Some API endpoints require access_token, others require api_token
    // For now, we'll use api_token as the default since it has more permissions
    // You may need to adjust this based on specific endpoint requirements
    if (this.tokenCache.apiToken) {
      this.client!.setApiToken(this.tokenCache.apiToken);
      console.error(`Using api_token for ${module}.${method}`);
    } else if (this.tokenCache.accessToken) {
      this.client!.setApiToken(this.tokenCache.accessToken);
      console.error(`Using access_token for ${module}.${method}`);
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.getAvailableResources(),
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;
      return this.readResource(uri);
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.getAvailablePrompts(),
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const { name } = request.params;
      return this.getPrompt(name);
    });

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
        const errorInfo: any = {
          tool: tool.name,
          module: tool.module,
          method: (args && args.method) || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        if ((error as any).response) {
          const response = (error as any).response;
          errorInfo.httpStatus = response.status;
          errorInfo.httpStatusText = response.statusText;
        }

        console.error('Tool call error:', errorInfo);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
          if ((error as any).response) {
            const response = (error as any).response;
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            if (response.data) {
              try {
                errorMessage += `\nResponse: ${JSON.stringify(response.data, null, 2)}`;
              } catch (jsonError) {
                errorMessage += `\nResponse: [Unable to serialize response data]`;
              }
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

  private getAvailableResources() {
    const resources = [
      {
        uri: 'inaturalist://categories',
        name: 'iNaturalist API Categories',
        description: 'Overview of all available API modules and their purposes',
        mimeType: 'text/markdown',
      },
      {
        uri: 'inaturalist://examples',
        name: 'Usage Examples',
        description: 'Common usage patterns and example requests for iNaturalist API',
        mimeType: 'text/markdown',
      },
    ];

    // Add user resource if authenticated
    if (this.userInfo) {
      resources.unshift({
        uri: 'inaturalist://user',
        name: 'Current User Info',
        description: `Authenticated as ${this.userInfo.login}`,
        mimeType: 'application/json',
      });
    }

    // Add individual module resources
    const moduleNames = [...new Set(this.tools.map(t => t.module))];
    moduleNames.forEach(module => {
      resources.push({
        uri: `inaturalist://module/${module}`,
        name: `${module} Module Documentation`,
        description: `Detailed documentation for ${module} endpoints`,
        mimeType: 'text/markdown',
      });
    });

    return resources;
  }

  private async readResource(uri: string) {
    if (uri === 'inaturalist://user') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(this.userInfo || { error: 'Not authenticated' }, null, 2),
          },
        ],
      };
    }

    if (uri === 'inaturalist://categories') {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: this.generateCategoriesDoc(),
          },
        ],
      };
    }

    if (uri === 'inaturalist://examples') {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: this.generateExamplesDoc(),
          },
        ],
      };
    }

    const moduleMatch = uri.match(/^inaturalist:\/\/module\/(.+)$/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      if (!moduleName) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid module URI: ${uri}`);
      }
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: this.generateModuleDoc(moduleName),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
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

    // Set the appropriate token based on the module and method being called
    this.setAppropriateToken(tool.module, args.method);

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

    let result;
    if (Object.keys(callParams).length > 0) {
      result = await method.call(moduleObj, callParams);
    } else {
      result = await method.call(moduleObj);
    }

    // Return only the data portion to avoid circular references
    if (result && typeof result === 'object' && result.data) {
      return result.data;
    }

    return result;
  }

  private generateCategoriesDoc(): string {
    const userSection = this.userInfo
      ? `## 🧑 Authenticated User\n\n**${this.userInfo.login}** (ID: ${this.userInfo.id})\n- Observations: ${this.userInfo.observations_count}\n- Identifications: ${this.userInfo.identifications_count}\n- Journal Posts: ${this.userInfo.journal_posts_count}\n\n`
      : '## 🔐 Authentication Status\n\nNot authenticated - using read-only access\n\n';

    const modules = [...new Set(this.tools.map(t => t.module))].sort();
    const categoriesDoc = `# iNaturalist API Categories

${userSection}## 📚 Available Modules

${modules
  .map(module => {
    const tool = this.tools.find(t => t.module === module)!;
    const methodCount = tool.methods.length;
    const moduleName = module.replace(/_/g, ' ');

    // Module descriptions
    const descriptions: Record<string, string> = {
      observations: 'Core observation data - the heart of iNaturalist',
      taxa: 'Species and taxonomic hierarchy information',
      identifications: 'Community identifications and ID suggestions',
      users: 'User profiles and account information',
      projects: 'Community science projects and collections',
      places: 'Geographic locations and boundaries',
      search: 'Universal search across all content types',
      comments: 'Discussions and community interactions',
      flags: 'Content moderation and quality control',
      annotations: 'Structured observation attributes',
      controlled_terms: 'Standardized vocabulary for annotations',
      observation_fields: 'Custom data fields for observations',
      observation_field_values: 'Values for custom observation fields',
      project_observations: 'Links between observations and projects',
      observation_photos: 'Photo management for observations',
      authentication: 'OAuth and API authentication',
    };

    return `### ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
- **Module**: \`${module}\`
- **Tool**: \`${tool.name}\`
- **Methods**: ${methodCount} available
- **Purpose**: ${descriptions[module] || tool.description}

`;
  })
  .join('')}

## 🚀 Quick Start

To use any module, call the corresponding tool with:
- \`method\`: The specific endpoint to call
- \`params\`: Parameters for that endpoint

Example:
\`\`\`json
{
  "tool": "observations_manage",
  "method": "get_observations",
  "params": {
    "q": "butterfly",
    "place_id": "1",
    "per_page": 10
  }
}
\`\`\`

For detailed documentation on each module, see the individual module resources.`;

    return categoriesDoc;
  }

  private generateModuleDoc(moduleName: string): string {
    const tool = this.tools.find(t => t.module === moduleName);
    if (!tool) {
      return `# Module Not Found\n\nNo module named '${moduleName}' exists.`;
    }

    const moduleTitle = moduleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let doc = `# ${moduleTitle} Module

**Tool Name**: \`${tool.name}\`
**Available Methods**: ${tool.methods.length}

## Description

${tool.description}

## Available Methods

`;

    tool.methods.forEach(method => {
      const methodDoc = this.methodDocs[`${moduleName}.${method}`] || {};
      const description = methodDoc.description || `Execute ${method} operation`;

      doc += `### \`${method}\`

${description}

`;

      // Add parameter information if available
      if (methodDoc.parameters) {
        doc += '**Parameters**:\n';
        Object.entries(methodDoc.parameters).forEach(([param, info]: [string, any]) => {
          doc += `- \`${param}\`: ${info.description || 'No description'}\n`;
        });
        doc += '\n';
      }

      // Add example if available
      if (methodDoc.example) {
        doc += `**Example**:
\`\`\`json
${JSON.stringify(methodDoc.example, null, 2)}
\`\`\`

`;
      }
    });

    // Add common parameters section
    doc += `## Common Parameters

Most methods support these parameters:

- \`q\`: Search query string
- \`per_page\`: Results per page (max 200, default 30)
- \`page\`: Page number for pagination
- \`order\`: Sort order (asc/desc)
- \`order_by\`: Field to sort by
- \`locale\`: Language for localized content

### Geographic Filters
- \`place_id\`: Filter by place ID
- \`lat\`, \`lng\`, \`radius\`: Point radius search
- \`swlat\`, \`swlng\`, \`nelat\`, \`nelng\`: Bounding box search

### Temporal Filters
- \`created_after\`, \`created_before\`: Filter by creation date
- \`observed_after\`, \`observed_before\`: Filter by observation date
- \`updated_after\`, \`updated_before\`: Filter by update date

### User Filters
- \`user_id\`: Filter by user ID
- \`user_login\`: Filter by username
`;

    return doc;
  }

  private generateExamplesDoc(): string {
    const userNote = this.userInfo
      ? `**Note**: You are authenticated as **${this.userInfo.login}**, so you can perform both read and write operations.\n\n`
      : '**Note**: You are not authenticated, so only read operations will work.\n\n';

    return `# iNaturalist API Usage Examples

${userNote}## Common Use Cases

### 1. Search for Observations

Find butterfly observations in California:
\`\`\`json
{
  "tool": "observations_manage",
  "method": "get_observations",
  "params": {
    "q": "butterfly",
    "place_id": "14",
    "quality_grade": "research",
    "per_page": 20
  }
}
\`\`\`

### 2. Get Species Information

Look up information about a specific taxon:
\`\`\`json
{
  "tool": "taxa_manage",
  "method": "get_taxa",
  "params": {
    "q": "Danaus plexippus",
    "rank": "species"
  }
}
\`\`\`

### 3. Search Projects

Find citizen science projects about birds:
\`\`\`json
{
  "tool": "projects_manage",
  "method": "get_projects",
  "params": {
    "q": "bird",
    "type": "collection",
    "per_page": 10
  }
}
\`\`\`

### 4. Get User Observations

Get observations by a specific user:
\`\`\`json
{
  "tool": "observations_manage",
  "method": "get_observations",
  "params": {
    "user_login": "${this.userInfo?.login || 'username'}",
    "order": "desc",
    "order_by": "created_at"
  }
}
\`\`\`

### 5. Geographic Search

Find all observations within a bounding box:
\`\`\`json
{
  "tool": "observations_manage",
  "method": "get_observations",
  "params": {
    "swlat": 32.5,
    "swlng": -117.5,
    "nelat": 34.0,
    "nelng": -116.0,
    "iconic_taxa": ["Aves", "Mammalia"]
  }
}
\`\`\`

### 6. Get Identifications for an Observation

\`\`\`json
{
  "tool": "identifications_manage",
  "method": "get_identifications",
  "params": {
    "observation_id": "123456",
    "current": true
  }
}
\`\`\`

### 7. Universal Search

Search across all content types:
\`\`\`json
{
  "tool": "search_manage",
  "method": "get_search",
  "params": {
    "q": "monarch butterfly",
    "per_page": 10
  }
}
\`\`\`

## Authentication-Required Examples

${
  this.userInfo
    ? `### Post a Comment
\`\`\`json
{
  "tool": "comments_manage",
  "method": "post_comments",
  "params": {
    "comment": {
      "parent_type": "Observation",
      "parent_id": "123456",
      "body": "Great find! The wing pattern is distinctive."
    }
  }
}
\`\`\`

### Create an Identification
\`\`\`json
{
  "tool": "identifications_manage",
  "method": "post_identifications",
  "params": {
    "identification": {
      "observation_id": "123456",
      "taxon_id": "48662",
      "body": "Based on the wing pattern, this appears to be a Monarch."
    }
  }
}
\`\`\``
    : 'To perform write operations like posting comments or identifications, you need to be authenticated.'
}

## Tips

1. **Pagination**: Use \`page\` and \`per_page\` for large result sets
2. **Localization**: Use \`locale\` parameter for localized names (e.g., "es" for Spanish)
3. **Quality**: Filter by \`quality_grade\` for research-grade observations
4. **Dates**: Use ISO 8601 format for date filters (e.g., "2024-01-01")
5. **Rate Limits**: Be mindful of API rate limits, especially for authenticated requests`;
  }

  private getAvailablePrompts() {
    const prompts = [
      {
        name: 'inaturalist_search',
        description: 'Search for observations, taxa, or other iNaturalist content',
        arguments: [
          {
            name: 'query',
            description: 'What to search for',
            required: true,
          },
          {
            name: 'type',
            description: 'Type of content (observations, taxa, projects, users)',
            required: false,
          },
          {
            name: 'filters',
            description: 'Additional filters (location, date, quality, etc.)',
            required: false,
          },
        ],
      },
    ];

    if (this.userInfo) {
      prompts.push({
        name: 'my_observations',
        description: `Get observations by ${this.userInfo.login}`,
        arguments: [
          {
            name: 'filters',
            description: 'Optional filters (taxon, place, date range)',
            required: false,
          },
        ],
      });
    }

    return prompts;
  }

  private async getPrompt(name: string) {
    if (name === 'inaturalist_search') {
      return {
        name: 'inaturalist_search',
        description: 'Search for observations, taxa, or other iNaturalist content',
        arguments: [
          {
            name: 'query',
            description: 'What to search for',
            required: true,
          },
          {
            name: 'type',
            description: 'Type of content (observations, taxa, projects, users)',
            required: false,
          },
          {
            name: 'filters',
            description: 'Additional filters (location, date, quality, etc.)',
            required: false,
          },
        ],
        messages: [
          {
            role: 'user',
            content:
              'Search for {{query}} {{#if type}}in {{type}}{{/if}} {{#if filters}}with filters: {{filters}}{{/if}}',
          },
          {
            role: 'assistant',
            content: `I'll search iNaturalist for that. ${
              this.userInfo ? `Searching as ${this.userInfo.login}.` : 'Searching with read-only access.'
            }`,
          },
        ],
      };
    }

    if (name === 'my_observations' && this.userInfo) {
      return {
        name: 'my_observations',
        description: `Get observations by ${this.userInfo.login}`,
        arguments: [
          {
            name: 'filters',
            description: 'Optional filters (taxon, place, date range)',
            required: false,
          },
        ],
        messages: [
          {
            role: 'user',
            content: 'Get my observations {{#if filters}}with filters: {{filters}}{{/if}}',
          },
          {
            role: 'assistant',
            content: `I'll retrieve observations for ${this.userInfo.login} (${this.userInfo.observations_count} total observations).`,
          },
        ],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
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
      console.error(
        'Token Management: Dual-token system (access_token + api_token) with automatic caching and refresh'
      );
    } else {
      console.error('Authentication: None (read-only access)');
    }
  }
}

export { INaturalistMCPServer, type ServerConfig, type ToolDefinition };
