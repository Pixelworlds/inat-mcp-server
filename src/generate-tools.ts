#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import { INaturalistClient } from '@richard-stovall/inat-typescript-client';

interface MethodInfo {
  name: string;
  description: string;
  parameters: string[];
  example?: any;
}

interface CategoryInfo {
  name: string;
  description: string;
  methods: MethodInfo[];
}

class INaturalistToolGeneratorV2 {
  private client: INaturalistClient;
  private categories: Map<string, CategoryInfo> = new Map();

  constructor() {
    this.client = new INaturalistClient({ baseURL: 'https://api.inaturalist.org/v1' });
    this.initializeCategories();
  }

  private initializeCategories = (): void => {
    // Define comprehensive category information with descriptions and method details
    this.categories.set('observations', {
      name: 'observations',
      description:
        'Search, create, update, and manage nature observations. This includes photos, locations, species identifications, and quality assessments.',
      methods: [
        {
          name: 'observation_search',
          description:
            'Search for observations with various filters like location, taxon, user, date range, quality grade, etc.',
          parameters: [
            'q',
            'taxon_id',
            'place_id',
            'user_id',
            'project_id',
            'year',
            'month',
            'day',
            'lat',
            'lng',
            'radius',
            'quality_grade',
            'iconic_taxa',
            'per_page',
            'page',
            'order',
            'order_by',
          ],
          example: { q: 'monarch butterfly', place_id: 97394, quality_grade: 'research', per_page: 20 },
        },
        {
          name: 'observation_details',
          description:
            'Get detailed information about a specific observation including photos, identifications, comments, and location data.',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'observation_create',
          description: 'Create a new observation with photos, location, date, and initial identification.',
          parameters: [
            'species_guess',
            'observed_on',
            'latitude',
            'longitude',
            'photos',
            'description',
            'place_guess',
            'positional_accuracy',
          ],
          example: {
            species_guess: 'Danaus plexippus',
            observed_on: '2024-01-15',
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
        {
          name: 'observation_update',
          description: "Update an existing observation's details, location, identification, or other metadata.",
          parameters: ['id', 'species_guess', 'observed_on', 'latitude', 'longitude', 'description', 'place_guess'],
          example: { id: 123456789, description: 'Updated description with more details' },
        },
        {
          name: 'observation_delete',
          description: 'Delete an observation (only allowed for observation owner).',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'observations_fave',
          description: 'Add an observation to your favorites list.',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'observations_unfave',
          description: 'Remove an observation from your favorites list.',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'observation_species_counts',
          description: 'Get species counts and statistics for observations matching search criteria.',
          parameters: ['place_id', 'user_id', 'project_id', 'taxon_id', 'year', 'month', 'day', 'quality_grade'],
          example: { place_id: 97394, quality_grade: 'research' },
        },
        {
          name: 'observation_histogram',
          description: 'Get histogram data showing observation counts over time periods.',
          parameters: ['date_field', 'interval', 'place_id', 'taxon_id', 'user_id', 'project_id'],
          example: { date_field: 'observed', interval: 'month', place_id: 97394 },
        },
      ],
    });

    this.categories.set('taxa', {
      name: 'taxa',
      description:
        'Search and retrieve taxonomic information about species, including scientific names, common names, photos, and classification hierarchy.',
      methods: [
        {
          name: 'taxon_search',
          description: 'Search for taxa (species, genera, families, etc.) by name, ID, or other criteria.',
          parameters: ['q', 'rank', 'parent_id', 'is_active', 'taxon_id', 'per_page', 'page', 'order', 'order_by'],
          example: { q: 'butterfly', rank: 'species', per_page: 20 },
        },
        {
          name: 'taxon_details',
          description:
            'Get detailed information about a specific taxon including photos, description, conservation status, and taxonomic hierarchy.',
          parameters: ['id'],
          example: { id: 48662 },
        },
        {
          name: 'taxon_autocomplete',
          description: 'Get autocomplete suggestions for taxon names, useful for search interfaces.',
          parameters: ['q', 'per_page'],
          example: { q: 'monarch', per_page: 10 },
        },
      ],
    });

    this.categories.set('places', {
      name: 'places',
      description:
        'Search and retrieve information about geographic places including countries, states, parks, and custom places used for observations.',
      methods: [
        {
          name: 'place_autocomplete',
          description: 'Get autocomplete suggestions for place names.',
          parameters: ['q', 'per_page'],
          example: { q: 'california', per_page: 10 },
        },
        {
          name: 'place_details',
          description:
            'Get detailed information about a specific place including boundaries, description, and statistics.',
          parameters: ['id'],
          example: { id: 97394 },
        },
        {
          name: 'nearby_places',
          description: 'Find places near a given latitude and longitude.',
          parameters: ['nelat', 'nelng', 'swlat', 'swlng', 'name'],
          example: { nelat: 40.8, nelng: -73.9, swlat: 40.7, swlng: -74.1 },
        },
      ],
    });

    this.categories.set('projects', {
      name: 'projects',
      description:
        'Manage iNaturalist projects including citizen science projects, collection projects, and bioblitzes. Join projects, add observations, and track progress.',
      methods: [
        {
          name: 'project_search',
          description: 'Search for projects by name, type, location, or other criteria.',
          parameters: ['q', 'type', 'member_id', 'lat', 'lng', 'radius', 'featured', 'per_page', 'page'],
          example: { q: 'butterfly', type: 'collection', per_page: 20 },
        },
        {
          name: 'project_details',
          description:
            'Get detailed information about a specific project including description, rules, and statistics.',
          parameters: ['id'],
          example: { id: 12345 },
        },
        {
          name: 'projects_join',
          description: 'Join a project as a member.',
          parameters: ['id'],
          example: { id: 12345 },
        },
        {
          name: 'projects_leave',
          description: 'Leave a project you are currently a member of.',
          parameters: ['id'],
          example: { id: 12345 },
        },
        {
          name: 'project_members',
          description: 'Get the list of members for a project.',
          parameters: ['id', 'per_page', 'page'],
          example: { id: 12345, per_page: 50 },
        },
        {
          name: 'project_add',
          description: 'Add an observation to a project.',
          parameters: ['project_id', 'observation_id'],
          example: { project_id: 12345, observation_id: 123456789 },
        },
        {
          name: 'project_remove',
          description: 'Remove an observation from a project.',
          parameters: ['project_id', 'observation_id'],
          example: { project_id: 12345, observation_id: 123456789 },
        },
      ],
    });

    this.categories.set('identifications', {
      name: 'identifications',
      description:
        'Create, search, and manage species identifications on observations. Help the community identify species and improve data quality.',
      methods: [
        {
          name: 'identification_search',
          description:
            'Search for identifications with various filters like user, taxon, observation, date range, etc.',
          parameters: [
            'user_id',
            'taxon_id',
            'observation_id',
            'current',
            'category',
            'place_id',
            'quality_grade',
            'per_page',
            'page',
          ],
          example: { taxon_id: 48662, current: true, category: 'improving', per_page: 20 },
        },
        {
          name: 'identification_details',
          description: 'Get detailed information about a specific identification.',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'identification_create',
          description: 'Create a new identification for an observation.',
          parameters: ['observation_id', 'taxon_id', 'body', 'vision', 'disagreement'],
          example: {
            observation_id: 123456789,
            taxon_id: 48662,
            body: 'This appears to be a Monarch butterfly based on the wing patterns.',
          },
        },
        {
          name: 'identification_update',
          description: 'Update an existing identification.',
          parameters: ['id', 'taxon_id', 'body'],
          example: { id: 123456789, body: 'Updated identification with more details.' },
        },
        {
          name: 'identification_delete',
          description: 'Delete an identification (only allowed for identification creator).',
          parameters: ['id'],
          example: { id: 123456789 },
        },
        {
          name: 'identification_species_counts',
          description: 'Get species counts for identifications matching search criteria.',
          parameters: ['user_id', 'place_id', 'taxon_id', 'year', 'month', 'day'],
          example: { user_id: 12345, place_id: 97394 },
        },
      ],
    });

    this.categories.set('users', {
      name: 'users',
      description: 'Manage user accounts, profiles, and settings. View user statistics, projects, and activity.',
      methods: [
        {
          name: 'users_me',
          description: 'Get information about the currently authenticated user.',
          parameters: [],
          example: {},
        },
        {
          name: 'user_details',
          description: 'Get detailed information about a specific user including statistics and profile information.',
          parameters: ['id'],
          example: { id: 12345 },
        },
        {
          name: 'user_autocomplete',
          description: 'Get autocomplete suggestions for usernames.',
          parameters: ['q', 'per_page'],
          example: { q: 'john', per_page: 10 },
        },
        {
          name: 'user_projects',
          description: 'Get projects associated with a specific user.',
          parameters: ['id', 'per_page', 'page'],
          example: { id: 12345, per_page: 20 },
        },
        {
          name: 'user_update',
          description: 'Update user profile information (only for authenticated user).',
          parameters: ['name', 'description', 'place_id', 'preferred_photo_license'],
          example: { name: 'John Doe', description: 'Nature enthusiast and photographer' },
        },
      ],
    });

    this.categories.set('comments', {
      name: 'comments',
      description:
        'Create and manage comments on observations. Engage with the community through discussions about observations and identifications.',
      methods: [
        {
          name: 'comment_create',
          description: 'Create a new comment on an observation.',
          parameters: ['parent_type', 'parent_id', 'body'],
          example: {
            parent_type: 'Observation',
            parent_id: 123456789,
            body: 'Great photo! The lighting really shows the wing details well.',
          },
        },
        {
          name: 'comment_update',
          description: 'Update an existing comment.',
          parameters: ['id', 'body'],
          example: { id: 123456789, body: 'Updated comment with additional information.' },
        },
        {
          name: 'comment_delete',
          description: 'Delete a comment (only allowed for comment creator).',
          parameters: ['id'],
          example: { id: 123456789 },
        },
      ],
    });

    this.categories.set('search', {
      name: 'search',
      description:
        'Perform comprehensive searches across all iNaturalist content including observations, taxa, places, projects, and users.',
      methods: [
        {
          name: 'search_all',
          description:
            'Search across all content types (observations, taxa, places, projects, users) with a single query.',
          parameters: ['q', 'sources', 'place_id', 'per_page'],
          example: { q: 'monarch butterfly', sources: 'observations,taxa,places', per_page: 20 },
        },
      ],
    });

    this.categories.set('flags', {
      name: 'flags',
      description:
        'Report inappropriate content, copyright violations, or other issues. Help maintain community standards and data quality.',
      methods: [
        {
          name: 'flag_create',
          description: 'Create a new flag to report content issues.',
          parameters: ['flag', 'flaggable_type', 'flaggable_id'],
          example: { flag: 'spam', flaggable_type: 'Observation', flaggable_id: 123456789 },
        },
        {
          name: 'flag_update',
          description: 'Update an existing flag.',
          parameters: ['id', 'flag'],
          example: { id: 123456789, flag: 'inappropriate' },
        },
        {
          name: 'flag_delete',
          description: 'Delete a flag (resolve the issue).',
          parameters: ['id'],
          example: { id: 123456789 },
        },
      ],
    });
  };

  public generateToolsJson = (): any => {
    const tools: any[] = [];

    this.categories.forEach((category, categoryName) => {
      tools.push({
        name: categoryName,
        description: `${category.description}\n\nAvailable methods:\n${category.methods
          .map(m => `• ${m.name}: ${m.description}`)
          .join('\n')}`,
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: `The specific method to call. Available methods: ${category.methods
                .map(m => m.name)
                .join(', ')}`,
              enum: category.methods.map(m => m.name),
            },
            parameters: {
              type: 'object',
              description: 'Parameters for the selected method. Each method has different parameter requirements.',
              additionalProperties: true,
            },
          },
          required: ['method'],
          additionalProperties: false,
        },
      });
    });

    return { tools };
  };

  public generateResourcesJson = (): any => {
    const resources: any[] = [];

    // Generate documentation resources for each category
    this.categories.forEach((category, categoryName) => {
      resources.push({
        uri: `inaturalist://docs/${categoryName}`,
        name: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} API Documentation`,
        description: `Comprehensive documentation for ${categoryName} endpoints`,
        mimeType: 'text/markdown',
      });

      // Generate method-specific documentation
      category.methods.forEach(method => {
        resources.push({
          uri: `inaturalist://docs/${categoryName}/${method.name}`,
          name: `${method.name} Documentation`,
          description: `Detailed documentation for the ${method.name} method`,
          mimeType: 'text/markdown',
        });
      });
    });

    // Add general documentation resources
    resources.push(
      {
        uri: 'inaturalist://docs/overview',
        name: 'iNaturalist API Overview',
        description: 'Overview of the iNaturalist API and available functionality',
        mimeType: 'text/markdown',
      },
      {
        uri: 'inaturalist://docs/authentication',
        name: 'Authentication Guide',
        description: 'How authentication works with the iNaturalist API',
        mimeType: 'text/markdown',
      },
      {
        uri: 'inaturalist://docs/examples',
        name: 'Usage Examples',
        description: 'Common usage patterns and examples',
        mimeType: 'text/markdown',
      }
    );

    return { resources };
  };

  public generatePromptsJson = (): any => {
    return {
      prompts: [
        {
          name: 'explore_observations',
          description: 'Explore nature observations in a specific area or for a particular species',
          arguments: [
            {
              name: 'location',
              description: "Location to search (e.g., 'California', 'Central Park', 'lat,lng')",
              required: false,
            },
            {
              name: 'species',
              description: "Species or taxon to search for (e.g., 'monarch butterfly', 'oak tree')",
              required: false,
            },
            {
              name: 'quality',
              description: "Quality grade filter: 'research', 'needs_id', or 'casual'",
              required: false,
            },
          ],
        },
        {
          name: 'identify_species',
          description: 'Help identify a species from an observation or search for similar species',
          arguments: [
            {
              name: 'observation_id',
              description: 'ID of observation to identify',
              required: false,
            },
            {
              name: 'description',
              description: "Description of the species you're trying to identify",
              required: false,
            },
            {
              name: 'location',
              description: 'Where the species was observed',
              required: false,
            },
          ],
        },
        {
          name: 'join_project',
          description: 'Find and join citizen science projects related to your interests',
          arguments: [
            {
              name: 'interest',
              description: "Your area of interest (e.g., 'butterflies', 'urban wildlife', 'phenology')",
              required: true,
            },
            {
              name: 'location',
              description: 'Your location to find local projects',
              required: false,
            },
          ],
        },
        {
          name: 'track_species',
          description: 'Track observations and trends for a specific species over time',
          arguments: [
            {
              name: 'species',
              description: 'Species to track (scientific or common name)',
              required: true,
            },
            {
              name: 'location',
              description: 'Geographic area to focus on',
              required: false,
            },
            {
              name: 'time_period',
              description: "Time period to analyze (e.g., 'last year', '2020-2023')",
              required: false,
            },
          ],
        },
      ],
    };
  };

  public generateAll = (outputDir?: string): void => {
    // Use provided output directory or determine it based on the current file location
    const baseDir = outputDir || path.join(path.dirname(new URL(import.meta.url).pathname), '..');
    const distDir = path.join(baseDir, 'dist');

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Generate tools configuration
    const toolsData = this.generateToolsJson();
    fs.writeFileSync(path.join(distDir, 'tools-generated.json'), JSON.stringify(toolsData, null, 2));

    // Generate resources configuration
    const resourcesData = this.generateResourcesJson();
    fs.writeFileSync(path.join(distDir, 'resources-generated.json'), JSON.stringify(resourcesData, null, 2));

    // Generate prompts configuration
    const promptsData = this.generatePromptsJson();
    fs.writeFileSync(path.join(distDir, 'prompts-generated.json'), JSON.stringify(promptsData, null, 2));

    console.log('✅ Generated tools, resources, and prompts for iNaturalist MCP Server v2.0');
    console.log(`📊 Categories: ${this.categories.size}`);
    console.log(
      `🔧 Total methods: ${Array.from(this.categories.values()).reduce((sum, cat) => sum + cat.methods.length, 0)}`
    );
    console.log(`📚 Resources: ${resourcesData.resources.length}`);
    console.log(`💡 Prompts: ${promptsData.prompts.length}`);
  };

  public getCategoryInfo = (categoryName: string): CategoryInfo | undefined => {
    return this.categories.get(categoryName);
  };

  public getAllCategories = (): Map<string, CategoryInfo> => {
    return this.categories;
  };
}

export { INaturalistToolGeneratorV2 };
export type { CategoryInfo, MethodInfo };
