# iNaturalist MCP Server v0.2.0

<div align="center">
  <img src="https://github.com/user-attachments/assets/52fe66af-3a88-4ea2-9a14-e9528cfdeec7" alt="iNaturalist TypeScript SDK Logo" width="200">
</div>
<br />

> [!WARNING] > **Development Status Notice**
>
> <span style="color: red !important;">The iNaturalist API calls are returning too much data currently causing most of the requests to be rejected and causing the MCP server's clients to become unstable. Not recommended for use yet.</span>

A Model Context Protocol (MCP) server that provides access to the iNaturalist API through organized, category-based tools. Built for @richard-stovall/inat-typescript-client v0.2.0 with a completely rewritten architecture.

## Features

- **Automatic Authentication**: Handles OAuth and API token flow automatically on startup
- **Category-Based Tools**: One tool per major API category for better organization
- **Comprehensive Documentation**: Rich prompts and resources explain all available endpoints
- **Type-Safe**: Full TypeScript implementation with proper error handling
- **Token Management**: Automatic token caching and refresh handling

## Available Tools

The server provides 9 category-based tools, each containing multiple endpoints:

1. **observations** - Search, create, update, and manage observations
2. **taxa** - Search and retrieve taxonomic information
3. **places** - Geographic location data and place management
4. **projects** - Project information and management
5. **identifications** - Species identifications and suggestions
6. **users** - User profiles and account information
7. **comments** - Comments on observations and other content
8. **search** - Universal search across all content types
9. **flags** - Content flagging and moderation

Each tool includes detailed documentation of its available methods, parameters, and usage examples.

## Authentication

The server requires iNaturalist OAuth credentials and automatically handles the complete authentication flow:

1. **OAuth Token**: Uses Resource Owner Password Credentials Flow to get access token from `https://www.inaturalist.org/oauth/token`
2. **API Token**: Uses access token to retrieve permanent API token from `https://www.inaturalist.org/users/api_token`
3. **User Info**: Preloads user information from `https://api.inaturalist.org/v1/users/me` for context

### Required Credentials

- `client_id`: Your iNaturalist OAuth application client ID
- `client_secret`: Your iNaturalist OAuth application client secret
- `username`: Your iNaturalist username
- `password`: Your iNaturalist password

## Installation

```bash
# Install dependencies
yarn install

# Generate tools (analyzes v0.2.0 client structure)
yarn generate-tools

# Build the project
yarn build
```

## Usage

### Command Line

```bash
# Run with credentials
node dist/cli.js --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET --username YOUR_USERNAME --password YOUR_PASSWORD

# Environment variables
export INAT_CLIENT_ID="your_client_id"
export INAT_CLIENT_SECRET="your_client_secret"
export INAT_USERNAME="your_username"
export INAT_PASSWORD="your_password"
node dist/cli.js
```

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "inaturalist": {
      "command": "node",
      "args": ["/path/to/inat-mcp-server/dist/cli.js"],
      "env": {
        "INAT_CLIENT_ID": "your_client_id",
        "INAT_CLIENT_SECRET": "your_client_secret",
        "INAT_USERNAME": "your_username",
        "INAT_PASSWORD": "your_password"
      }
    }
  }
}
```

## Example Usage

### Search for Observations

```json
{
  "name": "observations",
  "arguments": {
    "method": "observation_search",
    "parameters": {
      "q": "monarch butterfly",
      "place_id": 97394,
      "per_page": 10
    }
  }
}
```

### Get Taxonomic Information

```json
{
  "name": "taxa",
  "arguments": {
    "method": "taxa_search",
    "parameters": {
      "q": "Danaus plexippus",
      "rank": "species"
    }
  }
}
```

### Search Places

```json
{
  "name": "places",
  "arguments": {
    "method": "places_search",
    "parameters": {
      "q": "Yellowstone National Park"
    }
  }
}
```

## Documentation

The server provides rich documentation through:

- **Prompts**: Detailed guides for using each category of tools
- **Resources**: API reference documentation for all endpoints
- **Examples**: Practical usage examples for common tasks

Access documentation through the MCP protocol:

- List prompts: `prompts/list`
- Get prompt: `prompts/get` with name like "observations-guide"
- List resources: `resources/list`
- Read resource: `resources/read` with URI like "docs://observations"

## Development

### Project Structure

```
src/
├── generate-tools.ts    # Tool generator for v0.2.0 client
├── server.ts           # Main MCP server implementation
├── cli.ts              # Command-line interface
└── prebuild.ts         # Build validation

dist/                   # Compiled JavaScript output
```

### Build Process

1. **Tool Generation**: Analyzes the v0.2.0 client to extract all available methods
2. **TypeScript Compilation**: Compiles to JavaScript with proper module resolution
3. **Validation**: Ensures all required files and dependencies are present

### Authentication Flow

The server implements a sophisticated three-step authentication process:

1. **OAuth Authentication**: POST to `https://www.inaturalist.org/oauth/token` with username/password
2. **API Token Retrieval**: GET `https://www.inaturalist.org/users/api_token` with Bearer access token
3. **User Information**: GET `https://api.inaturalist.org/v1/users/me` with API token for context

All authentication happens automatically during server initialization. If authentication fails, the server gracefully falls back to read-only mode with access to all public data.

## Error Handling

- **Authentication Failures**: Graceful fallback to read-only mode when credentials are invalid or authentication fails
- **Network Issues**: Robust error handling with detailed error messages for debugging
- **API Errors**: Structured error responses with HTTP status codes and helpful context
- **Endpoint Resolution**: Automatic detection of correct endpoints for OAuth vs API calls

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:

- **MCP Server**: Open an issue in this repository
- **iNaturalist API**: Check the [iNaturalist API documentation](https://www.inaturalist.org/pages/api+reference)
- **TypeScript Client**: Check the [@richard-stovall/inat-typescript-client](https://www.npmjs.com/package/@richard-stovall/inat-typescript-client) package
