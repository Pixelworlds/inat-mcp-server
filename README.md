# iNaturalist MCP Server

A comprehensive Model Context Protocol (MCP) server providing access to the complete iNaturalist API v1 through the `@richard-stovall/inat-typescript-client` SDK. This server enables AI assistants to interact with iNaturalist's biodiversity data, observations, taxonomic information, and community features.

## Features

- **16 Modular Tools** covering all major iNaturalist SDK modules
- **Comprehensive Coverage**: Observations, taxa, places, projects, users, identifications, and more
- **TypeScript Client Integration**: Uses `@richard-stovall/inat-typescript-client` for robust API calls
- **Geographic Filtering**: Bounding boxes, radius searches, place-based queries
- **Taxonomic Search**: Species identification, hierarchical browsing, autocomplete
- **Community Features**: Projects, users, comments, identifications, flags
- **Authentication Support**: Optional API token for enhanced access
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
node index.js
```

### With Authentication

```bash
# Using command line argument
node index.js --api-token your-token-here

# Using environment variable
export INATURALIST_API_TOKEN=your-token-here
node index.js
```

### Custom Configuration

```bash
node index.js --base-url https://api.inaturalist.org/v1 --api-token your-token-here
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

- `INATURALIST_API_TOKEN` - Your iNaturalist API token
- `INATURALIST_BASE_URL` - API base URL (default: https://api.inaturalist.org/v1)

### Command Line Options

- `-t, --api-token <token>` - API token for authenticated requests
- `-u, --base-url <url>` - Custom API base URL
- `-h, --help` - Show help message

## Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "inaturalist": {
      "command": "node",
      "args": ["/path/to/inat-mcp-server/index.js"],
      "env": {
        "INATURALIST_API_TOKEN": "your-token-here"
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
├── index.js                    # Generated MCP server
├── tools-generated.json       # Generated tool definitions
├── src/
│   ├── build.ts              # Build script
│   └── generate-tools.ts      # Tool generation from SDK
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Authentication

The server supports optional authentication for enhanced access:

### Benefits of Authentication

- Access to private observations
- Higher rate limits (10,000/hour vs 100/hour)
- User-specific data and operations
- Write operations (where supported by the SDK)

### Getting an API Token

1. Log in to iNaturalist
2. Go to Account Settings → Applications
3. Create a new application or use an existing one
4. Copy your API token

## Rate Limits

- **Unauthenticated**: 100 requests per hour
- **Authenticated**: 10,000 requests per hour

The server automatically includes proper headers and authentication to optimize rate limit usage.

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
