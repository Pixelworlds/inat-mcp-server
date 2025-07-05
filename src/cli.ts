#!/usr/bin/env node
import { INaturalistMCPServer, ServerConfig } from './server.js';

const parseArgs = (): ServerConfig => {
  const args = process.argv.slice(2);
  const config: ServerConfig = {
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
        config.baseURL = args[++i] || config.baseURL;
        break;
      case '--client-id':
        config.clientId = args[++i] || '';
        break;
      case '--client-secret':
        config.clientSecret = args[++i] || '';
        break;
      case '--username':
        config.username = args[++i] || '';
        break;
      case '--password':
        config.password = args[++i] || '';
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
};

const showHelp = (): void => {
  console.log(`
iNaturalist MCP Server v0.1.0

Usage: inat-mcp-server [options]

AUTHENTICATION: This server ONLY supports Resource Owner Password Credentials Flow.
Authorization Code Flow, PKCE, and Assertion Flow are NOT supported.
TOKEN MANAGEMENT: Access tokens are automatically cached and refreshed as needed.

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

Based on @richard-stovall/inat-typescript-client v0.1.1
`);
};

const main = async (): Promise<void> => {
  const config = parseArgs();

  config.baseURL = config.baseURL || process.env.INATURALIST_BASE_URL || 'https://api.inaturalist.org/v1';
  config.clientId = config.clientId || process.env.INAT_CLIENT_ID || '';
  config.clientSecret = config.clientSecret || process.env.INAT_CLIENT_SECRET || '';
  config.username = config.username || process.env.INAT_USERNAME || '';
  config.password = config.password || process.env.INAT_PASSWORD || '';

  const server = new INaturalistMCPServer(config);
  await server.start();
};

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
