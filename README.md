# iNaturalist MCP Server

A comprehensive Model Context Protocol (MCP) server providing access to the complete iNaturalist API v1 through the `@richard-stovall/inat-typescript-client` SDK. This server enables AI assistants to interact with iNaturalist's biodiversity data, observations, taxonomic information, and community features.

## Features

- **16 Modular Tools** covering all major iNaturalist SDK modules
- **Comprehensive Coverage**: Observations, taxa, places, projects, users, identifications, and more
- **TypeScript Client Integration**: Uses `@richard-stovall/inat-typescript-client` for robust API calls
- **Geographic Filtering**: Bounding boxes, radius searches, place-based queries
- **Taxonomic Search**: Species identification, hierarchical browsing, autocomplete
- **Community Features**: Projects, users, comments, identifications, flags
- **Authentication Support**: OAuth credentials with automatic token caching and refresh
- **Auto-Generated Tools**: Automatically introspects SDK modules to generate MCP tools

## Installation

```bash
# Clone the repository
git clone https://github.com/richard-stovall/inat-mcp-server.git
cd inat-mcp-server

# Install dependencies
yarn install

# Generate tools and build server
yarn build:all
```

## Usage

### Basic Usage (Read-only)

```bash
node dist/cli.js
```

### With OAuth Authentication

```bash
# Using command line arguments
node dist/cli.js --client-id your-client-id --client-secret your-client-secret --username your-username --password your-password

# Using environment variables
export INAT_CLIENT_ID=your-client-id
export INAT_CLIENT_SECRET=your-client-secret
export INAT_USERNAME=your-username
export INAT_PASSWORD=your-password
node dist/cli.js
```

### Custom Configuration

```bash
node dist/cli.js --base-url https://api.inaturalist.org/v1 --client-id your-client-id --client-secret your-client-secret
```

## Available Tools

### Core Data Management

- **observations_manage** (12 methods) - Search, create, update, and analyze biodiversity observations
- **taxa_manage** (2 methods) - Taxonomic information and species identification
- **places_manage** (1 method) - Geographic places and boundaries
- **projects_manage** (8 methods) - Community science projects and data collections
- **users_manage** (4 methods) - User profiles and account management

### Community Features

- **identifications_manage** (9 methods) - Species identifications and suggestions
- **comments_manage** (3 methods) - Comments and discussions on observations
- **flags_manage** (3 methods) - Content flagging and moderation
- **search_manage** (1 method) - Universal search across all content

### Data Enhancement

- **annotations_manage** (2 methods) - Structured observation annotations
- **controlled_terms_manage** (2 methods) - Standardized vocabulary terms
- **observation_fields_manage** (1 method) - Custom observation data fields
- **observation_field_values_manage** (3 methods) - Values for custom fields
- **observation_photos_manage** (1 method) - Photo management and metadata
- **project_observations_manage** (1 method) - Link observations to projects

### Authentication

- **authentication_manage** (3 methods) - User authentication and OAuth

## Tool Usage Examples

### Search for Observations

```json
{
  "tool": "observations_manage",
  "arguments": {
    "method": "get_observations",
    "params": {
      "q": "Pinus",
      "quality_grade": "research",
      "per_page": 20
    }
  }
}
```

### Get Taxonomic Information

```json
{
  "tool": "taxa_manage",
  "arguments": {
    "method": "get_taxa",
    "params": {
      "q": "Quercus",
      "rank": "species"
    }
  }
}
```

### Geographic Search

```json
{
  "tool": "observations_manage",
  "arguments": {
    "method": "get_observations",
    "params": {
      "lat": 37.7749,
      "lng": -122.4194,
      "radius": 10,
      "quality_grade": "research"
    }
  }
}
```

### Get Project Information

```json
{
  "tool": "projects_manage",
  "arguments": {
    "method": "get_projects",
    "params": {
      "q": "butterfly",
      "type": "collection"
    }
  }
}
```

## Configuration

### Environment Variables

- `INATURALIST_BASE_URL` - API base URL (default: https://api.inaturalist.org/v1)
- `INAT_CLIENT_ID` - iNaturalist OAuth client ID (Resource Owner Password Credentials Flow)
- `INAT_CLIENT_SECRET` - iNaturalist OAuth client secret (Resource Owner Password Credentials Flow)
- `INAT_USERNAME` - iNaturalist username (**REQUIRED** for Resource Owner Password Credentials Flow)
- `INAT_PASSWORD` - iNaturalist password (**REQUIRED** for Resource Owner Password Credentials Flow)

### Command Line Options

- `-u, --base-url <url>` - Custom API base URL
- `--client-id <id>` - iNaturalist OAuth client ID (Resource Owner Password Credentials Flow)
- `--client-secret <secret>` - iNaturalist OAuth client secret (Resource Owner Password Credentials Flow)
- `--username <username>` - iNaturalist username (**REQUIRED** for Resource Owner Password Credentials Flow)
- `--password <password>` - iNaturalist password (**REQUIRED** for Resource Owner Password Credentials Flow)
- `-h, --help` - Show help message

### Authentication Methods

1. **OAuth Credentials** - Full OAuth flow with client credentials and user authentication
2. **No Authentication** - Read-only access to public data

### Usage Examples

```bash
# Basic usage (read-only access)
node dist/cli.js

# With OAuth credentials
node dist/cli.js --client-id your-client-id --client-secret your-client-secret --username your-username --password your-password

# Using environment variables
export INAT_CLIENT_ID=your-client-id
export INAT_CLIENT_SECRET=your-client-secret
export INAT_USERNAME=your-username
export INAT_PASSWORD=your-password
node dist/cli.js
```

## Claude Desktop Integration

Add to your Claude Desktop configuration:

### With OAuth Credentials

```json
{
  "mcpServers": {
    "inaturalist": {
      "command": "node",
      "args": ["/path/to/inat-mcp-server/dist/cli.js"],
      "env": {
        "INAT_CLIENT_ID": "your-client-id",
        "INAT_CLIENT_SECRET": "your-client-secret",
        "INAT_USERNAME": "your-username",
        "INAT_PASSWORD": "your-password"
      }
    }
  }
}
```

## Development

### Build Process

```bash
# Generate tools from SDK introspection
yarn generate-tools

# Build the MCP server
yarn build

# Run both steps
yarn build:all

# Validate the build
yarn validate
```

### Project Structure

```
├── dist/                      # Compiled output
│   ├── cli.js                # Main CLI entry point
│   ├── server.js             # MCP server implementation
│   └── tools-generated.json  # Generated tool definitions
├── src/                       # TypeScript source files
│   ├── cli.ts                # CLI argument parsing and startup
│   ├── server.ts             # Core MCP server class
│   ├── generate-tools.ts     # Tool generation from SDK
│   └── prebuild.ts           # Build preparation script
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Authentication

The server **ONLY supports Resource Owner Password Credentials Flow** for OAuth authentication. Authorization Code Flow, PKCE, and Assertion Flow are **NOT supported**.

### Benefits of Authentication

- Access to private observations
- Higher rate limits (10,000/hour vs 100/hour)
- User-specific data and operations
- Write operations (where supported by the SDK)

### Getting OAuth Credentials

1. Log in to iNaturalist
2. Go to Account Settings → Applications
3. Create a new application or use an existing one
4. Copy your client ID and client secret
5. Use your iNaturalist username and password for authentication

**Important**: When using OAuth credentials, both username and password are **REQUIRED** to enforce Resource Owner Password Credentials Flow only. The server will reject configurations that attempt to use other OAuth flows.

**Token Management**: The server automatically caches access tokens and refreshes them as needed. Tokens are kept in memory and refreshed automatically before expiration, ensuring uninterrupted API access without repeated authentication.

## Rate Limits

- **Unauthenticated**: 100 requests per hour
- **Authenticated**: 10,000 requests per hour

The server automatically includes proper headers and authentication to optimize rate limit usage.

## Token Management

The server includes sophisticated token management:

### Automatic Token Caching

- **Access Tokens**: Cached in memory after successful OAuth authentication
- **API Tokens**: Long-lived tokens obtained when possible for enhanced access
- **Expiration Tracking**: Monitors token expiry and refreshes automatically

### Token Refresh Strategy

- **Proactive Refresh**: Tokens are refreshed 5 minutes before expiration
- **Automatic Retry**: Failed token refresh attempts fall back to read-only access
- **Resource Owner Password Credentials Flow**: Only supported OAuth flow for security

### Benefits

- **Uninterrupted Access**: No authentication delays during API calls
- **Rate Limit Optimization**: Maintains authenticated status for higher limits
- **Error Recovery**: Graceful fallback to read-only mode if authentication fails

## Error Handling

The server provides comprehensive error reporting:

- HTTP status codes and messages
- Response data details
- Method validation errors
- SDK-level error information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `yarn validate` to ensure everything works
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **@richard-stovall/inat-typescript-client**: iNaturalist API TypeScript client
- **TypeScript**: Type safety and development tools

Based on `@richard-stovall/inat-typescript-client` v0.1.1 and MCP SDK v1.0.1

## Links

- [iNaturalist API Documentation](https://www.inaturalist.org/pages/api+reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [iNaturalist Website](https://www.inaturalist.org/)
