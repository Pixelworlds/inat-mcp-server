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

import { INaturalistToolGeneratorV2 } from './generate-tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  baseURL?: string;
}

interface UserInfo {
  id: number;
  login: string;
  name?: string;
  email?: string;
  observations_count: number;
  identifications_count: number;
  journal_posts_count: number;
  species_count: number;
  roles: string[];
}

interface AuthTokens {
  accessToken?: string;
  apiToken?: string;
  expiresAt?: Date;
}

class INaturalistMCPServer {
  private server: Server;
  private client: INaturalistClient;
  private oauthClient: INaturalistClient;
  private config: AuthConfig | null = null;
  private tokens: AuthTokens = {};
  private userInfo: UserInfo | null = null;
  private generator: INaturalistToolGeneratorV2;
  private isAuthenticated = false;

  constructor() {
    this.server = new Server(
      {
        name: 'inaturalist',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize clients
    this.client = new INaturalistClient({
      baseURL: 'https://api.inaturalist.org/v1',
    });
    this.oauthClient = new INaturalistClient({
      baseURL: 'https://www.inaturalist.org',
    });

    this.generator = new INaturalistToolGeneratorV2();
    this.setupHandlers();
  }

  private setupHandlers = (): void => {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsData = this.loadToolsData();
      return { tools: toolsData.tools };
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourcesData = this.loadResourcesData();
      return { resources: resourcesData.resources };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const promptsData = this.loadPromptsData();
      return { prompts: promptsData.prompts };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      return await this.handleToolCall(name, args || {});
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;
      return await this.handleResourceRead(uri);
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      return await this.handlePrompt(name, args || {});
    });
  };

  private ensureGeneratedFiles = (): void => {
    const projectRoot = path.join(__dirname, '..');
    const distDir = path.join(projectRoot, 'dist');
    const toolsPath = path.join(distDir, 'tools-generated.json');

    // Check if generated files exist, if not generate them
    if (!fs.existsSync(toolsPath)) {
      console.error('📁 Generated files not found, creating them...');
      this.generator.generateAll(projectRoot);
    }
  };

  private loadToolsData = (): any => {
    this.ensureGeneratedFiles();
    try {
      const projectRoot = path.join(__dirname, '..');
      const toolsPath = path.join(projectRoot, 'dist', 'tools-generated.json');
      return JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load tools data, generating from generator:', error);
      return this.generator.generateToolsJson();
    }
  };

  private loadResourcesData = (): any => {
    this.ensureGeneratedFiles();
    try {
      const projectRoot = path.join(__dirname, '..');
      const resourcesPath = path.join(projectRoot, 'dist', 'resources-generated.json');
      return JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load resources data, generating from generator:', error);
      return this.generator.generateResourcesJson();
    }
  };

  private loadPromptsData = (): any => {
    this.ensureGeneratedFiles();
    try {
      const projectRoot = path.join(__dirname, '..');
      const promptsPath = path.join(projectRoot, 'dist', 'prompts-generated.json');
      return JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    } catch (error) {
      console.error('Failed to load prompts data, generating from generator:', error);
      return this.generator.generatePromptsJson();
    }
  };

  private authenticateWithCredentials = async (): Promise<void> => {
    if (!this.config) {
      throw new Error('No authentication configuration provided');
    }

    console.error('🔐 Starting authentication flow...');

    try {
      // Step 1: Get access token using Resource Owner Password Credentials Flow
      console.error('📡 Step 1: Requesting access token...');
      const tokenResponse = await this.oauthClient.oauth.oauth_token_exchange({
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: this.config.username,
        password: this.config.password,
      });

      if (!tokenResponse.data?.access_token) {
        throw new Error('Failed to obtain access token from OAuth response');
      }

      this.tokens.accessToken = tokenResponse.data.access_token;
      this.tokens.expiresAt = new Date(Date.now() + (tokenResponse.data.expires_in || 3600) * 1000);
      console.error(`✅ Access token obtained (expires: ${this.tokens.expiresAt.toISOString()})`);

      // Step 2: Get API token using the access token
      console.error('📡 Step 2: Requesting API token...');

      // Create authenticated client for API token request (use main site, not API subdomain)
      const authClient = new INaturalistClient('https://www.inaturalist.org', this.tokens.accessToken);

      const apiTokenResponse = await authClient.users.get_jwt_api_token();

      if (!apiTokenResponse.data?.api_token) {
        throw new Error('Failed to obtain API token from users/api_token response');
      }

      this.tokens.apiToken = apiTokenResponse.data.api_token;
      console.error('✅ API token obtained');

      // Step 3: Configure main client with API token
      this.client = new INaturalistClient('https://api.inaturalist.org/v1', this.tokens.apiToken);

      // Step 4: Preload user information
      console.error('📡 Step 3: Loading user information...');
      await this.loadUserInfo();

      this.isAuthenticated = true;
      console.error(`🎉 Authentication complete! Logged in as: ${this.userInfo?.login} (ID: ${this.userInfo?.id})`);
    } catch (error) {
      console.error('❌ Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  private loadUserInfo = async (): Promise<void> => {
    try {
      const userResponse = await this.client.users.users_me();

      if (userResponse.data?.results?.[0]) {
        const user = userResponse.data.results[0];
        this.userInfo = {
          id: user.id,
          login: user.login,
          name: user.name || undefined,
          email: user.email || undefined,
          observations_count: user.observations_count || 0,
          identifications_count: user.identifications_count || 0,
          journal_posts_count: user.journal_posts_count || 0,
          species_count: user.species_count || 0,
          roles: user.roles || [],
        };
        console.error(
          `👤 User loaded: ${this.userInfo.login} (${this.userInfo.observations_count} observations, ${this.userInfo.species_count} species)`
        );
      } else {
        throw new Error('Invalid user response format');
      }
    } catch (error) {
      console.error('⚠️  Failed to load user info:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };

  private handleToolCall = async (toolName: string, args: any): Promise<any> => {
    try {
      // Validate authentication for tools that require it
      if (!this.isAuthenticated && this.requiresAuthentication(toolName, args.method)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Authentication required for ${toolName}.${args.method}. Please provide valid credentials.`
        );
      }

      const categoryInfo = this.generator.getCategoryInfo(toolName);
      if (!categoryInfo) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${toolName}`);
      }

      const { method, parameters = {} } = args;
      if (!method) {
        throw new McpError(ErrorCode.InvalidRequest, 'Method parameter is required');
      }

      const methodInfo = categoryInfo.methods.find(m => m.name === method);
      if (!methodInfo) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown method '${method}' for tool '${toolName}'. Available methods: ${categoryInfo.methods
            .map(m => m.name)
            .join(', ')}`
        );
      }

      console.error(`🔧 Calling ${toolName}.${method} with params:`, parameters);

      // Get the appropriate module
      const module = (this.client as any)[toolName];
      if (!module) {
        throw new McpError(ErrorCode.InternalError, `Module '${toolName}' not found in client`);
      }

      // Get the method function
      const methodFn = module[method];
      if (typeof methodFn !== 'function') {
        throw new McpError(ErrorCode.InternalError, `Method '${method}' not found in module '${toolName}'`);
      }

      // Call the method
      let result;
      if (Object.keys(parameters).length > 0) {
        result = await methodFn.call(module, parameters);
      } else {
        result = await methodFn.call(module);
      }

      // Return clean data
      if (result && typeof result === 'object' && result.data) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorInfo: any = {
        tool: toolName,
        method: args.method || 'unknown',
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
              errorMessage += `\nResponse: ${String(response.data)}`;
            }
          }
        }
      }

      throw new McpError(ErrorCode.InternalError, `Error calling ${toolName}.${args.method}: ${errorMessage}`);
    }
  };

  private requiresAuthentication = (toolName: string, method: string): boolean => {
    // Methods that require authentication
    const authRequiredMethods = [
      'observation_create',
      'observation_update',
      'observation_delete',
      'observations_fave',
      'observations_unfave',
      'identification_create',
      'identification_update',
      'identification_delete',
      'comment_create',
      'comment_update',
      'comment_delete',
      'projects_join',
      'projects_leave',
      'project_add',
      'project_remove',
      'user_update',
      'users_me',
      'flag_create',
      'flag_update',
      'flag_delete',
    ];

    return authRequiredMethods.includes(method);
  };

  private handleResourceRead = async (uri: string): Promise<any> => {
    if (uri.startsWith('inaturalist://docs/')) {
      const docPath = uri.replace('inaturalist://docs/', '');
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: this.generateDocumentation(docPath),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
  };

  private generateDocumentation = (docPath: string): string => {
    if (docPath === 'overview') {
      return this.generateOverviewDoc();
    }

    if (docPath === 'authentication') {
      return this.generateAuthDoc();
    }

    if (docPath === 'examples') {
      return this.generateExamplesDoc();
    }

    const parts = docPath.split('/');
    if (parts.length === 1 && parts[0]) {
      // Category documentation
      return this.generateCategoryDoc(parts[0]);
    } else if (parts.length === 2 && parts[0] && parts[1]) {
      // Method documentation
      return this.generateMethodDoc(parts[0], parts[1]);
    }

    return `# Documentation\n\nDocumentation for ${docPath} is not available.`;
  };

  private generateOverviewDoc = (): string => {
    const categories = this.generator.getAllCategories();
    const categoryList = Array.from(categories.entries())
      .map(([name, info]) => `- **${name}**: ${info.description}`)
      .join('\n');

    return `# iNaturalist API Overview

The iNaturalist MCP Server provides access to the comprehensive iNaturalist API, enabling you to interact with one of the world's largest citizen science platforms for biodiversity observation and identification.

## Available Categories

${categoryList}

## Authentication

This server automatically handles authentication using OAuth 2.0 Resource Owner Password Credentials Flow. When configured with valid credentials, it:

1. Obtains an access token using your username/password
2. Exchanges the access token for an API token
3. Preloads your user information
4. Uses the API token for all subsequent requests

## Data Quality

iNaturalist observations have three quality grades:
- **Research Grade**: Observations with community agreement on identification and metadata
- **Needs ID**: Observations that need community input for identification
- **Casual**: Observations that don't meet research grade criteria

## Getting Started

Use the available tools to:
1. Search for observations in your area
2. Explore species information and taxonomy
3. Join citizen science projects
4. Contribute identifications to help the community
5. Track biodiversity trends over time

For detailed information about each tool and method, see the category-specific documentation.`;
  };

  private generateAuthDoc = (): string => {
    return `# Authentication Guide

## Overview

The iNaturalist MCP Server uses OAuth 2.0 Resource Owner Password Credentials Flow for authentication. This process is handled automatically when you provide valid credentials.

## Authentication Flow

1. **Access Token Request**: Server exchanges your username/password for an access token
2. **API Token Request**: Server uses the access token to obtain a permanent API token
3. **User Info Loading**: Server preloads your user information for context

## Required Credentials

- **Client ID**: Your iNaturalist application client ID
- **Client Secret**: Your iNaturalist application client secret
- **Username**: Your iNaturalist username
- **Password**: Your iNaturalist password

## Authentication Status

${
  this.isAuthenticated
    ? `✅ **Authenticated** as ${this.userInfo?.login} (ID: ${this.userInfo?.id})
- Observations: ${this.userInfo?.observations_count}
- Identifications: ${this.userInfo?.identifications_count}
- Species: ${this.userInfo?.species_count}`
    : `❌ **Not Authenticated** - Running in read-only mode`
}

## Read-Only vs Authenticated Mode

**Read-Only Mode** (no credentials):
- Search observations, taxa, places, projects
- View public user profiles
- Access all public data

**Authenticated Mode** (with credentials):
- All read-only functionality
- Create/update/delete your observations
- Add identifications and comments
- Join/leave projects
- Update your profile
- Access private data

## Security Notes

- Credentials are only used during initialization
- API tokens are stored in memory only
- No credentials are logged or persisted to disk`;
  };

  private generateExamplesDoc = (): string => {
    return `# Usage Examples

## Common Patterns

### 1. Exploring Local Wildlife

\`\`\`json
{
  "tool": "observations",
  "method": "observation_search",
  "parameters": {
    "place_id": 97394,
    "quality_grade": "research",
    "per_page": 20,
    "order_by": "created_at"
  }
}
\`\`\`

### 2. Species Identification

\`\`\`json
{
  "tool": "taxa",
  "method": "taxon_search",
  "parameters": {
    "q": "monarch butterfly",
    "rank": "species"
  }
}
\`\`\`

### 3. Joining a Project

\`\`\`json
{
  "tool": "projects",
  "method": "project_search",
  "parameters": {
    "q": "city nature challenge",
    "type": "collection"
  }
}
\`\`\`

### 4. Adding an Identification

\`\`\`json
{
  "tool": "identifications",
  "method": "identification_create",
  "parameters": {
    "observation_id": 123456789,
    "taxon_id": 48662,
    "body": "This appears to be a Monarch butterfly based on the distinctive orange and black wing pattern."
  }
}
\`\`\`

### 5. Tracking Species Over Time

\`\`\`json
{
  "tool": "observations",
  "method": "observation_histogram",
  "parameters": {
    "taxon_id": 48662,
    "date_field": "observed",
    "interval": "month",
    "place_id": 97394
  }
}
\`\`\`

## Error Handling

All methods return structured responses. Common error scenarios:

- **401 Unauthorized**: Authentication required for the requested action
- **404 Not Found**: Resource (observation, taxon, etc.) doesn't exist
- **422 Unprocessable Entity**: Invalid parameters provided
- **429 Too Many Requests**: Rate limit exceeded

## Best Practices

1. **Use specific searches**: Include place_id, taxon_id, or other filters to get relevant results
2. **Respect rate limits**: Don't make too many requests in quick succession
3. **Check quality grades**: Use "research" grade for scientific analysis
4. **Provide context**: Include helpful descriptions when creating identifications
5. **Be respectful**: Follow community guidelines when commenting or flagging`;
  };

  private generateCategoryDoc = (categoryName: string): string => {
    const category = this.generator.getCategoryInfo(categoryName);
    if (!category) {
      return `# ${categoryName}\n\nCategory not found.`;
    }

    const methodsList = category.methods
      .map(
        method =>
          `## ${method.name}\n\n${method.description}\n\n**Parameters**: ${
            method.parameters.join(', ') || 'None'
          }\n\n**Example**:\n\`\`\`json\n${JSON.stringify(method.example, null, 2)}\n\`\`\``
      )
      .join('\n\n');

    return `# ${category.name.charAt(0).toUpperCase() + category.name.slice(1)}

${category.description}

## Available Methods

${methodsList}`;
  };

  private generateMethodDoc = (categoryName: string, methodName: string): string => {
    const category = this.generator.getCategoryInfo(categoryName);
    if (!category) {
      return `# ${methodName}\n\nCategory ${categoryName} not found.`;
    }

    const method = category.methods.find(m => m.name === methodName);
    if (!method) {
      return `# ${methodName}\n\nMethod not found in category ${categoryName}.`;
    }

    return `# ${method.name}

${method.description}

## Parameters

${
  method.parameters.length > 0
    ? method.parameters.map(param => `- **${param}**`).join('\n')
    : 'This method takes no parameters.'
}

## Example Usage

\`\`\`json
{
  "tool": "${categoryName}",
  "method": "${method.name}",
  "parameters": ${JSON.stringify(method.example, null, 2)}
}
\`\`\`

## Authentication

${
  this.requiresAuthentication(categoryName, methodName)
    ? '🔐 **Authentication Required** - You must be logged in to use this method.'
    : '🌐 **Public Access** - This method can be used without authentication.'
}`;
  };

  private handlePrompt = async (name: string, args: any): Promise<any> => {
    switch (name) {
      case 'explore_observations':
        return this.handleExploreObservationsPrompt(args);
      case 'identify_species':
        return this.handleIdentifySpeciesPrompt(args);
      case 'join_project':
        return this.handleJoinProjectPrompt(args);
      case 'track_species':
        return this.handleTrackSpeciesPrompt(args);
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
    }
  };

  private handleExploreObservationsPrompt = async (args: any): Promise<any> => {
    const { location, species, quality = 'research' } = args;

    let prompt = "I'll help you explore nature observations";

    if (location) {
      prompt += ` in ${location}`;
    }
    if (species) {
      prompt += ` for ${species}`;
    }

    prompt += `. Let me search for ${quality} grade observations and show you what's been discovered!\n\n`;

    // Build search parameters
    const searchParams: any = {
      quality_grade: quality,
      per_page: 20,
      order_by: 'created_at',
      order: 'desc',
    };

    if (species) {
      prompt += `First, let me find the taxon information for "${species}":\n\n`;
    }

    if (location) {
      prompt += `I'll search for observations in ${location}. `;
    }

    prompt += "Here's what I'll do:\n\n";
    prompt += '1. Search for recent observations\n';
    prompt += '2. Show you the species found\n';
    prompt += '3. Highlight any interesting discoveries\n';
    prompt += '4. Provide links to view the observations\n\n';
    prompt += `Use the **observations** tool with method **observation_search** and these parameters:\n\`\`\`json\n${JSON.stringify(
      searchParams,
      null,
      2
    )}\n\`\`\``;

    return {
      description: `Exploring ${species || 'nature'} observations${location ? ` in ${location}` : ''}`,
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  };

  private handleIdentifySpeciesPrompt = async (args: any): Promise<any> => {
    const { observation_id, description, location } = args;

    let prompt = "I'll help you identify this species! ";

    if (observation_id) {
      prompt += `Let me look at observation #${observation_id} and provide identification assistance.\n\n`;
      prompt += "Here's my approach:\n\n";
      prompt += '1. Get the observation details and photos\n';
      prompt += '2. Analyze the visual characteristics\n';
      prompt += '3. Consider the location and habitat\n';
      prompt += '4. Search for similar species\n';
      prompt += '5. Provide identification suggestions\n\n';
      prompt += `Start by using the **observations** tool with method **observation_details** and parameter:\n\`\`\`json\n{"id": ${observation_id}}\n\`\`\``;
    } else {
      prompt += "Based on your description, I'll help narrow down the possibilities.\n\n";

      if (description) {
        prompt += `Description: "${description}"\n`;
      }
      if (location) {
        prompt += `Location: ${location}\n`;
      }

      prompt += "\nI'll search for species that match your description and location. ";
      prompt += 'Use the **taxa** tool with method **taxon_search** to find potential matches.';
    }

    return {
      description: `Identifying species${
        observation_id ? ` from observation #${observation_id}` : ' from description'
      }`,
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  };

  private handleJoinProjectPrompt = async (args: any): Promise<any> => {
    const { interest, location } = args;

    let prompt = `I'll help you find and join citizen science projects related to ${interest}! `;

    if (location) {
      prompt += `I'll focus on projects in ${location} as well as global projects you can participate in.\n\n`;
    } else {
      prompt += "I'll show you both local and global projects you can join.\n\n";
    }

    prompt += "Here's what I'll do:\n\n";
    prompt += '1. Search for projects related to your interest\n';
    prompt += '2. Show you project details and requirements\n';
    prompt += '3. Help you understand how to contribute\n';
    prompt += '4. Assist with joining projects that interest you\n\n';

    const searchParams: any = {
      q: interest,
      per_page: 20,
      type: 'collection',
    };

    prompt += `Use the **projects** tool with method **project_search** and these parameters:\n\`\`\`json\n${JSON.stringify(
      searchParams,
      null,
      2
    )}\n\`\`\`\n\n`;
    prompt += 'After finding interesting projects, I can help you join them using the **projects_join** method!';

    return {
      description: `Finding ${interest} projects${location ? ` in ${location}` : ''}`,
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  };

  private handleTrackSpeciesPrompt = async (args: any): Promise<any> => {
    const { species, location, time_period } = args;

    let prompt = `I'll help you track observations and trends for ${species}`;

    if (location) {
      prompt += ` in ${location}`;
    }
    if (time_period) {
      prompt += ` over ${time_period}`;
    }

    prompt += '!\n\n';

    prompt += "Here's my analysis approach:\n\n";
    prompt += '1. Find the taxon information for the species\n';
    prompt += '2. Search for observations with temporal filters\n';
    prompt += '3. Generate histogram data to show trends\n';
    prompt += '4. Analyze seasonal patterns and hotspots\n';
    prompt += '5. Provide insights about population trends\n\n';

    prompt += `First, let me find the taxon ID for "${species}":\n\n`;
    prompt += `Use the **taxa** tool with method **taxon_search** and parameter:\n\`\`\`json\n{"q": "${species}", "rank": "species"}\n\`\`\`\n\n`;
    prompt +=
      "Then I'll use the taxon_id to search for observations and generate trend data using the **observations** tool with methods like **observation_search** and **observation_histogram**.";

    return {
      description: `Tracking ${species} trends${location ? ` in ${location}` : ''}${
        time_period ? ` over ${time_period}` : ''
      }`,
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  };

  public async initialize(config?: AuthConfig): Promise<void> {
    if (config) {
      this.config = config;
      console.error('🚀 Initializing iNaturalist MCP Server with authentication...');
      await this.authenticateWithCredentials();
    } else {
      console.error('🌐 Initializing iNaturalist MCP Server in read-only mode...');
      console.error(
        '💡 Provide credentials for full functionality including creating observations, identifications, and comments.'
      );
    }
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🎯 iNaturalist MCP Server is running and ready for requests!');
  }
}

export { INaturalistMCPServer };
export type { AuthConfig, UserInfo };
