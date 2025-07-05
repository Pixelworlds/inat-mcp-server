#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the tools data from dist directory
const toolsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'tools-generated.json'), 'utf8'));

// Generate the single-file server with modular tools
const serverCode = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { INaturalistClient } from '@richard-stovall/inat-typescript-client';

// Embedded modular tool definitions
const TOOLS = ${JSON.stringify(toolsData.tools, null, 2)};

// Method documentation for help
const METHOD_DOCS = ${JSON.stringify(toolsData.methodDocs, null, 2)};

class INaturalistMCPServer {
  constructor(config) {
    this.config = config;
    this.client = null;
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

    this.setupHandlers();
  }

  ensureClient() {
    if (!this.client) {
      // Validate that we only use Resource Owner Password Credentials Flow
      if (this.config.clientId && this.config.clientSecret) {
        // If OAuth credentials are provided, username and password are REQUIRED
        // for Resource Owner Password Credentials Flow
        if (!this.config.username || !this.config.password) {
          throw new Error(
            'Resource Owner Password Credentials Flow requires both username and password. ' +
            'Authorization Code Flow, PKCE, and Assertion Flow are not supported.'
          );
        }
      }
      
      this.client = new INaturalistClient({
        baseURL: this.config.baseURL || 'https://api.inaturalist.org/v1',
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        username: this.config.username,
        password: this.config.password,
        // ENFORCE Resource Owner Password Credentials Flow ONLY
        grantType: 'password'
      });
    }
    return this.client;
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAvailableTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = TOOLS.find(t => t.name === name);
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, \`Tool \${name} not found\`);
      }

      try {
        const result = await this.callModularTool(tool, args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        console.error('Tool call error:', {
          tool: tool.name,
          module: tool.module,
          args,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Extract more details from axios errors
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
          if (error.response) {
            const response = error.response;
            errorMessage = \`HTTP \${response.status}: \${response.statusText}\\n\`;
            if (response.data) {
              errorMessage += \`Response: \${JSON.stringify(response.data, null, 2)}\`;
            }
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: \`Error calling \${tool.name}.\${args.method || 'unknown'}: \${errorMessage}\`
          }],
        };
      }
    });
  }

  getAvailableTools() {
    return TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async callModularTool(tool, args) {
    const client = this.ensureClient();
    
    // Validate method parameter
    if (!args.method) {
      throw new Error(\`Missing required parameter 'method'. Available methods: \${tool.methods.join(', ')}\`);
    }
    
    if (!tool.methods.includes(args.method)) {
      throw new Error(\`Invalid method '\${args.method}'. Available methods: \${tool.methods.join(', ')}\`);
    }
    
    // Get the module
    const moduleObj = client[tool.module];

    if (!moduleObj) {
      throw new Error(\`Module \${tool.module} not found\`);
    }

    // Get the method
    const method = moduleObj[args.method];
    if (!method || typeof method !== 'function') {
      throw new Error(\`Method \${args.method} not found in module \${tool.module}\`);
    }

    // Call the method with params (if provided)
    console.error(\`Calling \${tool.module}.\${args.method} with params:\`, args.params);
    
    // Extract params, excluding the method field
    const { method: _, params = {}, ...otherArgs } = args;
    const callParams = { ...params, ...otherArgs };
    
    // Only pass parameters if there are any
    if (Object.keys(callParams).length > 0) {
      return await method.call(moduleObj, callParams);
    } else {
      return await method.call(moduleObj);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('iNaturalist MCP server v0.1.0 started');
    console.error(\`Total tools: \${TOOLS.length} modules\`);
    console.error(\`Base URL: \${this.config.baseURL || 'https://api.inaturalist.org/v1'}\`);
    
    // Show authentication status
    if (this.config.clientId && this.config.clientSecret) {
      console.error(\`Authentication: OAuth Resource Owner Password Credentials Flow (client_id: \${this.config.clientId})\`);
      if (this.config.username) {
        console.error(\`OAuth User: \${this.config.username}\`);
      }
      console.error('OAuth Flow: Resource Owner Password Credentials ONLY (Authorization Code, PKCE, and Assertion flows are disabled)');
    } else {
      console.error('Authentication: None (read-only access)');
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    baseURL: 'https://api.inaturalist.org/v1',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url':
      case '-u':
        config.baseURL = args[++i];
        break;
      case '--client-id':
        config.clientId = args[++i];
        break;
      case '--client-secret':
        config.clientSecret = args[++i];
        break;
      case '--username':
        config.username = args[++i];
        break;
      case '--password':
        config.password = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function showHelp() {
  console.log(\`
iNaturalist MCP Server v0.1.0

Usage: inat-mcp-server [options]

AUTHENTICATION: This server ONLY supports Resource Owner Password Credentials Flow.
Authorization Code Flow, PKCE, and Assertion Flow are NOT supported.

Options:
  -u, --base-url <url>      iNaturalist API base URL (default: https://api.inaturalist.org/v1)
  --client-id <id>          iNaturalist OAuth client ID (Resource Owner Password Credentials Flow)
  --client-secret <secret>  iNaturalist OAuth client secret (Resource Owner Password Credentials Flow)
  --username <username>     iNaturalist username (REQUIRED for Resource Owner Password Credentials Flow)
  --password <password>     iNaturalist password (REQUIRED for Resource Owner Password Credentials Flow)
  -h, --help                Show this help message

Environment Variables:
  INATURALIST_BASE_URL      iNaturalist API base URL
  INAT_CLIENT_ID            iNaturalist OAuth client ID (Resource Owner Password Credentials Flow)
  INAT_CLIENT_SECRET        iNaturalist OAuth client secret (Resource Owner Password Credentials Flow)
  INAT_USERNAME             iNaturalist username (REQUIRED for Resource Owner Password Credentials Flow)
  INAT_PASSWORD             iNaturalist password (REQUIRED for Resource Owner Password Credentials Flow)

Examples:
  # Basic usage (read-only access)
  inat-mcp-server

  # With OAuth credentials for full access (Resource Owner Password Credentials Flow ONLY)
  inat-mcp-server --client-id your-client-id --client-secret your-client-secret --username your-username --password your-password

  # Using environment variables
  export INAT_CLIENT_ID=your-client-id
  export INAT_CLIENT_SECRET=your-client-secret
  export INAT_USERNAME=your-username
  export INAT_PASSWORD=your-password
  inat-mcp-server

  # Custom API base URL
  inat-mcp-server --base-url https://api.inaturalist.org/v1

Tool Usage:
  Each tool represents a module and accepts a 'method' parameter to specify the operation.
  
  Example: observations_manage
  - method: "get_observations" - Search observations
  - method: "get_observations_id" - Get a specific observation
  - method: "get_observations_taxon_stats" - Get taxon statistics from observations
  
  Parameters are passed in the 'params' object:
  {
    "method": "get_observations",
    "params": {
      "q": "Pinus",
      "place_id": "1",
      "per_page": 10
    }
  }

Available Tools:
\${TOOLS.map(tool => \`  - \${tool.name}: \${tool.description}\`).join('\\n')}

Based on @richard-stovall/inat-typescript-client v0.1.1
\`);
}

// Main entry point
async function main() {
  const config = parseArgs();
  
  // Use environment variables as fallback
  config.baseURL = config.baseURL || process.env.INATURALIST_BASE_URL || 'https://api.inaturalist.org/v1';
  config.clientId = config.clientId || process.env.INAT_CLIENT_ID || '';
  config.clientSecret = config.clientSecret || process.env.INAT_CLIENT_SECRET || '';
  config.username = config.username || process.env.INAT_USERNAME || '';
  config.password = config.password || process.env.INAT_PASSWORD || '';

  // Create and start server
  const server = new INaturalistMCPServer(config);
  await server.start();
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write the single-file server to dist directory
fs.writeFileSync(path.join(distDir, 'index.js'), serverCode);
console.log('Built dist/index.js successfully');
console.log(`Total tools: ${toolsData.totalTools} modules`);
