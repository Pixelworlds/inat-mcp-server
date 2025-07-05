#!/usr/bin/env node

import { AuthConfig, INaturalistMCPServer } from './server.js';

const parseArgs = (args: string[]): { config?: AuthConfig; help: boolean } => {
  const config: Partial<AuthConfig> = {};
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;
      case '--client-id':
        if (nextArg) config.clientId = nextArg;
        i++;
        break;
      case '--client-secret':
        if (nextArg) config.clientSecret = nextArg;
        i++;
        break;
      case '--username':
        if (nextArg) config.username = nextArg;
        i++;
        break;
      case '--password':
        if (nextArg) config.password = nextArg;
        i++;
        break;
      case '--base-url':
        if (nextArg) config.baseURL = nextArg;
        i++;
        break;
    }
  }

  // Check environment variables
  config.clientId = config.clientId || process.env.INAT_CLIENT_ID;
  config.clientSecret = config.clientSecret || process.env.INAT_CLIENT_SECRET;
  config.username = config.username || process.env.INAT_USERNAME;
  config.password = config.password || process.env.INAT_PASSWORD;
  config.baseURL = config.baseURL || process.env.INAT_BASE_URL;

  // Validate that if any auth is provided, all required fields are present
  const hasAnyAuth = config.clientId || config.clientSecret || config.username || config.password;
  const hasCompleteAuth = config.clientId && config.clientSecret && config.username && config.password;

  if (hasAnyAuth && !hasCompleteAuth) {
    console.error('❌ Incomplete authentication credentials provided.');
    console.error('   All four fields are required for authentication:');
    console.error('   - Client ID (--client-id or INAT_CLIENT_ID)');
    console.error('   - Client Secret (--client-secret or INAT_CLIENT_SECRET)');
    console.error('   - Username (--username or INAT_USERNAME)');
    console.error('   - Password (--password or INAT_PASSWORD)');
    console.error('');
    console.error('   Run with --help for more information.');
    process.exit(1);
  }

  return {
    config: hasCompleteAuth ? (config as AuthConfig) : undefined,
    help,
  };
};

const showHelp = (): void => {
  console.error(`iNaturalist MCP Server v2.0.0

Usage: inaturalist [options]

Options:
  --client-id <id>        iNaturalist OAuth client ID
  --client-secret <secret> iNaturalist OAuth client secret  
  --username <username>   iNaturalist username
  --password <password>   iNaturalist password
  --base-url <url>        Custom API base URL (default: https://api.inaturalist.org/v1)
  --help, -h             Show this help message

Environment Variables:
  INAT_CLIENT_ID         OAuth client ID
  INAT_CLIENT_SECRET     OAuth client secret
  INAT_USERNAME          iNaturalist username
  INAT_PASSWORD          iNaturalist password
  INAT_BASE_URL          Custom API base URL

Authentication:
  The server uses OAuth 2.0 Resource Owner Password Credentials Flow.
  When provided with credentials, it will:
  1. Obtain an access token using username/password
  2. Exchange access token for an API token
  3. Preload user information
  4. Enable full read/write functionality

Examples:
  # Read-only mode (public data access only)
  inaturalist

  # Authenticated mode (full functionality)
  inaturalist --client-id your-client-id --client-secret your-client-secret --username your-username --password your-password

  # Using environment variables
  export INAT_CLIENT_ID=your-client-id
  export INAT_CLIENT_SECRET=your-client-secret
  export INAT_USERNAME=your-username
  export INAT_PASSWORD=your-password
  inaturalist

Features:
  • 🔍 Search observations, taxa, places, and projects
  • 🆔 Create and manage species identifications  
  • 📝 Add comments and engage with the community
  • 📊 Join citizen science projects
  • 📈 Track species trends and biodiversity data
  • 🌍 Explore nature observations worldwide

Tools Available:
  • observations  - Search, create, and manage nature observations
  • taxa          - Explore species and taxonomic information
  • places        - Find and explore geographic locations
  • projects      - Discover and join citizen science projects
  • identifications - Create and manage species identifications
  • users         - View user profiles and statistics
  • comments      - Add comments and engage with observations
  • search        - Comprehensive search across all content
  • flags         - Report content issues

For detailed documentation, use the MCP resources system to access:
  • inaturalist://docs/overview - API overview and getting started
  • inaturalist://docs/authentication - Authentication guide
  • inaturalist://docs/examples - Usage examples and patterns
  • inaturalist://docs/{category} - Category-specific documentation

Note: Authentication is handled automatically during server initialization.
      No manual authentication tools are exposed to clients.`);
};

const main = async (): Promise<void> => {
  try {
    const { config, help } = parseArgs(process.argv.slice(2));

    if (help) {
      showHelp();
      process.exit(0);
    }

    const server = new INaturalistMCPServer();

    // Initialize with authentication if provided
    await server.initialize(config);

    // Start the server
    await server.run();
  } catch (error) {
    console.error(
      '❌ Failed to start iNaturalist MCP Server:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n👋 Shutting down iNaturalist MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n👋 Shutting down iNaturalist MCP Server...');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
