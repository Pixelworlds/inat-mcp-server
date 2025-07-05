import * as fs from 'fs';
import * as path from 'path';

import { INaturalistClient } from '@richard-stovall/inat-typescript-client';

// Create client to introspect
const client = new INaturalistClient({
  baseURL: 'https://api.inaturalist.org/v1',
});

interface ModularToolDefinition {
  name: string;
  description: string;
  module: string;
  methods: string[];
  inputSchema: any;
}

// Get all methods from a module
const getModuleMethods = (obj: any): string[] => {
  if (!obj || typeof obj !== 'object') return [];

  const proto = Object.getPrototypeOf(obj);
  if (!proto) return [];

  return Object.getOwnPropertyNames(proto).filter((key) => typeof proto[key] === 'function' && key !== 'constructor');
};

// Generate schema for modular tools
const generateModularSchema = (methods: string[]): any => ({
  type: 'object',
  properties: {
    method: {
      type: 'string',
      description: 'The method to call on this module',
      enum: methods,
    },
    params: {
      type: 'object',
      description: 'Parameters for the method (varies by method)',
      properties: {
        // Common parameters that many iNaturalist methods use
        id: {
          type: 'string',
          description: 'Resource ID (for get/update/delete operations)',
        },
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple resource IDs (for batch operations)',
        },
        q: {
          type: 'string',
          description: 'Search query string',
        },
        taxon_id: {
          type: 'string',
          description: 'Taxon ID filter',
        },
        place_id: {
          type: 'string',
          description: 'Place ID filter',
        },
        project_id: {
          type: 'string',
          description: 'Project ID filter',
        },
        user_id: {
          type: 'string',
          description: 'User ID filter',
        },
        user_login: {
          type: 'string',
          description: 'Username filter',
        },
        username: {
          type: 'string',
          description: 'Username for user-specific operations',
        },
        per_page: {
          type: 'integer',
          description: 'Number of results per page (max 200)',
          maximum: 200,
          default: 30,
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination',
          minimum: 1,
          default: 1,
        },
        order: {
          type: 'string',
          description: 'Sort order (asc/desc)',
        },
        order_by: {
          type: 'string',
          description: 'Field to sort by',
        },
        created_after: {
          type: 'string',
          description: 'Filter by creation date (ISO 8601 format)',
        },
        created_before: {
          type: 'string',
          description: 'Filter by creation date (ISO 8601 format)',
        },
        updated_after: {
          type: 'string',
          description: 'Filter by update date (ISO 8601 format)',
        },
        updated_before: {
          type: 'string',
          description: 'Filter by update date (ISO 8601 format)',
        },
        observed_after: {
          type: 'string',
          description: 'Filter by observation date (ISO 8601 format)',
        },
        observed_before: {
          type: 'string',
          description: 'Filter by observation date (ISO 8601 format)',
        },
        lat: {
          type: 'number',
          description: 'Latitude for geographic filtering',
        },
        lng: {
          type: 'number',
          description: 'Longitude for geographic filtering',
        },
        radius: {
          type: 'number',
          description: 'Radius in kilometers for geographic filtering',
        },
        swlat: {
          type: 'number',
          description: 'Southwest latitude for bounding box',
        },
        swlng: {
          type: 'number',
          description: 'Southwest longitude for bounding box',
        },
        nelat: {
          type: 'number',
          description: 'Northeast latitude for bounding box',
        },
        nelng: {
          type: 'number',
          description: 'Northeast longitude for bounding box',
        },
        quality_grade: {
          type: 'string',
          description: 'Quality grade filter (casual/needs_id/research)',
          enum: ['casual', 'needs_id', 'research'],
        },
        iconic_taxa: {
          type: 'array',
          items: { type: 'string' },
          description: 'Iconic taxon names filter',
        },
        rank: {
          type: 'string',
          description: 'Taxonomic rank filter',
        },
        locale: {
          type: 'string',
          description: 'Locale for localized names',
          default: 'en',
        },
        preferred_place_id: {
          type: 'string',
          description: 'Place ID for preferred common names',
        },
        // Additional parameters for specific operations
        data: {
          type: 'object',
          description: 'Data object for POST/PUT operations',
        },
        body: {
          type: 'object',
          description: 'Request body for POST/PUT operations',
        },
      },
    },
  },
  required: ['method'],
});

// Module descriptions based on their purpose
const moduleDescriptions: Record<string, string> = {
  observations: 'Observation data management - search, create, update, and analyze biodiversity observations',
  taxa: 'Taxonomic information and hierarchy - species identification and classification data',
  places: 'Geographic places and boundaries - location-based filtering and place information',
  projects: 'iNaturalist projects and collections - community science projects and data',
  users: 'User profiles and account management - user information and statistics',
  identifications: 'Species identifications and suggestions - community identification system',
  comments: 'Comments and discussions - community interaction on observations and projects',
  flags: 'Content flagging and moderation - quality control and content management',
  search: 'Universal search functionality - search across all iNaturalist content',
  authentication: 'User authentication and authorization - login and session management',
  controlled_terms: 'Controlled vocabulary terms - standardized annotation terms',
  annotations: 'Observation annotations and attributes - structured data about observations',
  observation_fields: 'Custom observation fields - user-defined data fields',
  observation_field_values: 'Observation field values - data for custom fields',
  observation_photos: 'Observation photo management - image handling and metadata',
  project_observations: 'Project-observation relationships - linking observations to projects',
};

// Analyze all modules and create modular tools
const modularTools: ModularToolDefinition[] = [];

// Get all client properties that are modules (exclude 'http' which is internal)
const moduleNames = Object.keys(client).filter((key) => key !== 'http' && typeof (client as any)[key] === 'object');

moduleNames.forEach((moduleName) => {
  const module = (client as any)[moduleName];
  if (module) {
    const methods = getModuleMethods(module);
    if (methods.length > 0) {
      const description =
        moduleDescriptions[moduleName] || `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} management`;

      modularTools.push({
        name: `${moduleName}_manage`,
        description: `${description} - ${methods.length} available methods including: ${methods
          .slice(0, 5)
          .join(', ')}${methods.length > 5 ? '...' : ''}`,
        module: moduleName,
        methods: methods,
        inputSchema: generateModularSchema(methods),
      });
    }
  }
});

console.log(`\nTotal modular tools generated: ${modularTools.length}`);
console.log(`Core tools: ${modularTools.length}`);
console.log('\nGenerated tools:');
modularTools.forEach((tool) => {
  console.log(`  - ${tool.name} (${tool.methods.length} methods)`);
});

// Generate method documentation
const methodDocs: any = {};
modularTools.forEach((tool) => {
  methodDocs[tool.module] = {
    toolName: tool.name,
    methods: tool.methods,
    description: moduleDescriptions[tool.module] || `${tool.module} management`,
  };
});

// Ensure dist directory exists
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Save tool definitions
fs.writeFileSync(
  path.join(distDir, 'tools-generated.json'),
  JSON.stringify(
    {
      totalTools: modularTools.length,
      coreTools: modularTools.length,
      pluginTools: 0,
      tools: modularTools,
      methodDocs: methodDocs,
    },
    null,
    2
  )
);

console.log('\nTool definitions generated successfully!');
console.log('Saved to dist/tools-generated.json');
