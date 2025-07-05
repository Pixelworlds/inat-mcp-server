#!/usr/bin/env node
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
const TOOLS = [
  {
    "name": "comments_manage",
    "description": "Comments and discussions - community interaction on observations and projects - 3 available methods including: delete_comments_id, post_comments, put_comments_id",
    "module": "comments",
    "methods": [
      "delete_comments_id",
      "post_comments",
      "put_comments_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "delete_comments_id",
            "post_comments",
            "put_comments_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "observation_field_values_manage",
    "description": "Observation field values - data for custom fields - 3 available methods including: delete_observation_field_values_id, post_observation_field_values, put_observation_field_values_id",
    "module": "observation_field_values",
    "methods": [
      "delete_observation_field_values_id",
      "post_observation_field_values",
      "put_observation_field_values_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "delete_observation_field_values_id",
            "post_observation_field_values",
            "put_observation_field_values_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "annotations_manage",
    "description": "Observation annotations and attributes - structured data about observations - 2 available methods including: post_annotations, delete_annotations_id",
    "module": "annotations",
    "methods": [
      "post_annotations",
      "delete_annotations_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "post_annotations",
            "delete_annotations_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "observation_fields_manage",
    "description": "Custom observation fields - user-defined data fields - 1 available methods including: get_observation_fields",
    "module": "observation_fields",
    "methods": [
      "get_observation_fields"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_observation_fields"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "projects_manage",
    "description": "iNaturalist projects and collections - community science projects and data - 8 available methods including: delete_projects_id_leave, get_projects, get_projects_id, get_projects_idiframetrue, get_projects_id_contributorswidget...",
    "module": "projects",
    "methods": [
      "delete_projects_id_leave",
      "get_projects",
      "get_projects_id",
      "get_projects_idiframetrue",
      "get_projects_id_contributorswidget",
      "get_projects_id_members",
      "get_projects_user_login",
      "post_projects_id_join"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "delete_projects_id_leave",
            "get_projects",
            "get_projects_id",
            "get_projects_idiframetrue",
            "get_projects_id_contributorswidget",
            "get_projects_id_members",
            "get_projects_user_login",
            "post_projects_id_join"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "search_manage",
    "description": "Universal search functionality - search across all iNaturalist content - 1 available methods including: get_search",
    "module": "search",
    "methods": [
      "get_search"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_search"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "authentication_manage",
    "description": "User authentication and authorization - login and session management - 3 available methods including: get_oauth_authorize, get_users_api_token, post_oauth_token",
    "module": "authentication",
    "methods": [
      "get_oauth_authorize",
      "get_users_api_token",
      "post_oauth_token"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_oauth_authorize",
            "get_users_api_token",
            "post_oauth_token"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "taxa_manage",
    "description": "Taxonomic information and hierarchy - species identification and classification data - 2 available methods including: get_taxa, get_taxa_id",
    "module": "taxa",
    "methods": [
      "get_taxa",
      "get_taxa_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_taxa",
            "get_taxa_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "identifications_manage",
    "description": "Species identifications and suggestions - community identification system - 9 available methods including: get_identifications, get_identifications_id, delete_identifications_id, get_identifications_categories, get_identifications_species_counts...",
    "module": "identifications",
    "methods": [
      "get_identifications",
      "get_identifications_id",
      "delete_identifications_id",
      "get_identifications_categories",
      "get_identifications_species_counts",
      "get_identifications_identifiers",
      "get_identifications_observers",
      "post_identifications",
      "put_identifications_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_identifications",
            "get_identifications_id",
            "delete_identifications_id",
            "get_identifications_categories",
            "get_identifications_species_counts",
            "get_identifications_identifiers",
            "get_identifications_observers",
            "post_identifications",
            "put_identifications_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "project_observations_manage",
    "description": "Project-observation relationships - linking observations to projects - 1 available methods including: post_project_observations",
    "module": "project_observations",
    "methods": [
      "post_project_observations"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "post_project_observations"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "controlled_terms_manage",
    "description": "Controlled vocabulary terms - standardized annotation terms - 2 available methods including: get_controlled_terms, get_controlled_terms_for_taxon",
    "module": "controlled_terms",
    "methods": [
      "get_controlled_terms",
      "get_controlled_terms_for_taxon"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_controlled_terms",
            "get_controlled_terms_for_taxon"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "observations_manage",
    "description": "Observation data management - search, create, update, and analyze biodiversity observations - 12 available methods including: delete_observations_id, delete_observations_id_quality_metric, get_observations, get_observations_id, get_observations_username...",
    "module": "observations",
    "methods": [
      "delete_observations_id",
      "delete_observations_id_quality_metric",
      "get_observations",
      "get_observations_id",
      "get_observations_username",
      "get_observations_project_id",
      "get_observations_taxon_stats",
      "get_observations_user_stats",
      "post_observations",
      "post_observations_id_quality_metric",
      "put_observations_id",
      "put_observations_id_viewed_updates"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "delete_observations_id",
            "delete_observations_id_quality_metric",
            "get_observations",
            "get_observations_id",
            "get_observations_username",
            "get_observations_project_id",
            "get_observations_taxon_stats",
            "get_observations_user_stats",
            "post_observations",
            "post_observations_id_quality_metric",
            "put_observations_id",
            "put_observations_id_viewed_updates"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "flags_manage",
    "description": "Content flagging and moderation - quality control and content management - 3 available methods including: post_flags, put_flags_id, delete_flags_id",
    "module": "flags",
    "methods": [
      "post_flags",
      "put_flags_id",
      "delete_flags_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "post_flags",
            "put_flags_id",
            "delete_flags_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "places_manage",
    "description": "Geographic places and boundaries - location-based filtering and place information - 1 available methods including: get_places",
    "module": "places",
    "methods": [
      "get_places"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_places"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "observation_photos_manage",
    "description": "Observation photo management - image handling and metadata - 1 available methods including: post_observation_photos",
    "module": "observation_photos",
    "methods": [
      "post_observation_photos"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "post_observation_photos"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  },
  {
    "name": "users_manage",
    "description": "User profiles and account management - user information and statistics - 4 available methods including: get_users_edit, get_users_new_updates, post_users, put_users_id",
    "module": "users",
    "methods": [
      "get_users_edit",
      "get_users_new_updates",
      "post_users",
      "put_users_id"
    ],
    "inputSchema": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "description": "The method to call on this module",
          "enum": [
            "get_users_edit",
            "get_users_new_updates",
            "post_users",
            "put_users_id"
          ]
        },
        "params": {
          "type": "object",
          "description": "Parameters for the method (varies by method)",
          "properties": {
            "id": {
              "type": "string",
              "description": "Resource ID (for get/update/delete operations)"
            },
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Multiple resource IDs (for batch operations)"
            },
            "q": {
              "type": "string",
              "description": "Search query string"
            },
            "taxon_id": {
              "type": "string",
              "description": "Taxon ID filter"
            },
            "place_id": {
              "type": "string",
              "description": "Place ID filter"
            },
            "project_id": {
              "type": "string",
              "description": "Project ID filter"
            },
            "user_id": {
              "type": "string",
              "description": "User ID filter"
            },
            "user_login": {
              "type": "string",
              "description": "Username filter"
            },
            "username": {
              "type": "string",
              "description": "Username for user-specific operations"
            },
            "per_page": {
              "type": "integer",
              "description": "Number of results per page (max 200)",
              "maximum": 200,
              "default": 30
            },
            "page": {
              "type": "integer",
              "description": "Page number for pagination",
              "minimum": 1,
              "default": 1
            },
            "order": {
              "type": "string",
              "description": "Sort order (asc/desc)"
            },
            "order_by": {
              "type": "string",
              "description": "Field to sort by"
            },
            "created_after": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "created_before": {
              "type": "string",
              "description": "Filter by creation date (ISO 8601 format)"
            },
            "updated_after": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "updated_before": {
              "type": "string",
              "description": "Filter by update date (ISO 8601 format)"
            },
            "observed_after": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "observed_before": {
              "type": "string",
              "description": "Filter by observation date (ISO 8601 format)"
            },
            "lat": {
              "type": "number",
              "description": "Latitude for geographic filtering"
            },
            "lng": {
              "type": "number",
              "description": "Longitude for geographic filtering"
            },
            "radius": {
              "type": "number",
              "description": "Radius in kilometers for geographic filtering"
            },
            "swlat": {
              "type": "number",
              "description": "Southwest latitude for bounding box"
            },
            "swlng": {
              "type": "number",
              "description": "Southwest longitude for bounding box"
            },
            "nelat": {
              "type": "number",
              "description": "Northeast latitude for bounding box"
            },
            "nelng": {
              "type": "number",
              "description": "Northeast longitude for bounding box"
            },
            "quality_grade": {
              "type": "string",
              "description": "Quality grade filter (casual/needs_id/research)",
              "enum": [
                "casual",
                "needs_id",
                "research"
              ]
            },
            "iconic_taxa": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Iconic taxon names filter"
            },
            "rank": {
              "type": "string",
              "description": "Taxonomic rank filter"
            },
            "locale": {
              "type": "string",
              "description": "Locale for localized names",
              "default": "en"
            },
            "preferred_place_id": {
              "type": "string",
              "description": "Place ID for preferred common names"
            },
            "data": {
              "type": "object",
              "description": "Data object for POST/PUT operations"
            },
            "body": {
              "type": "object",
              "description": "Request body for POST/PUT operations"
            }
          }
        }
      },
      "required": [
        "method"
      ]
    }
  }
];

// Method documentation for help
const METHOD_DOCS = {
  "comments": {
    "toolName": "comments_manage",
    "methods": [
      "delete_comments_id",
      "post_comments",
      "put_comments_id"
    ],
    "description": "Comments and discussions - community interaction on observations and projects"
  },
  "observation_field_values": {
    "toolName": "observation_field_values_manage",
    "methods": [
      "delete_observation_field_values_id",
      "post_observation_field_values",
      "put_observation_field_values_id"
    ],
    "description": "Observation field values - data for custom fields"
  },
  "annotations": {
    "toolName": "annotations_manage",
    "methods": [
      "post_annotations",
      "delete_annotations_id"
    ],
    "description": "Observation annotations and attributes - structured data about observations"
  },
  "observation_fields": {
    "toolName": "observation_fields_manage",
    "methods": [
      "get_observation_fields"
    ],
    "description": "Custom observation fields - user-defined data fields"
  },
  "projects": {
    "toolName": "projects_manage",
    "methods": [
      "delete_projects_id_leave",
      "get_projects",
      "get_projects_id",
      "get_projects_idiframetrue",
      "get_projects_id_contributorswidget",
      "get_projects_id_members",
      "get_projects_user_login",
      "post_projects_id_join"
    ],
    "description": "iNaturalist projects and collections - community science projects and data"
  },
  "search": {
    "toolName": "search_manage",
    "methods": [
      "get_search"
    ],
    "description": "Universal search functionality - search across all iNaturalist content"
  },
  "authentication": {
    "toolName": "authentication_manage",
    "methods": [
      "get_oauth_authorize",
      "get_users_api_token",
      "post_oauth_token"
    ],
    "description": "User authentication and authorization - login and session management"
  },
  "taxa": {
    "toolName": "taxa_manage",
    "methods": [
      "get_taxa",
      "get_taxa_id"
    ],
    "description": "Taxonomic information and hierarchy - species identification and classification data"
  },
  "identifications": {
    "toolName": "identifications_manage",
    "methods": [
      "get_identifications",
      "get_identifications_id",
      "delete_identifications_id",
      "get_identifications_categories",
      "get_identifications_species_counts",
      "get_identifications_identifiers",
      "get_identifications_observers",
      "post_identifications",
      "put_identifications_id"
    ],
    "description": "Species identifications and suggestions - community identification system"
  },
  "project_observations": {
    "toolName": "project_observations_manage",
    "methods": [
      "post_project_observations"
    ],
    "description": "Project-observation relationships - linking observations to projects"
  },
  "controlled_terms": {
    "toolName": "controlled_terms_manage",
    "methods": [
      "get_controlled_terms",
      "get_controlled_terms_for_taxon"
    ],
    "description": "Controlled vocabulary terms - standardized annotation terms"
  },
  "observations": {
    "toolName": "observations_manage",
    "methods": [
      "delete_observations_id",
      "delete_observations_id_quality_metric",
      "get_observations",
      "get_observations_id",
      "get_observations_username",
      "get_observations_project_id",
      "get_observations_taxon_stats",
      "get_observations_user_stats",
      "post_observations",
      "post_observations_id_quality_metric",
      "put_observations_id",
      "put_observations_id_viewed_updates"
    ],
    "description": "Observation data management - search, create, update, and analyze biodiversity observations"
  },
  "flags": {
    "toolName": "flags_manage",
    "methods": [
      "post_flags",
      "put_flags_id",
      "delete_flags_id"
    ],
    "description": "Content flagging and moderation - quality control and content management"
  },
  "places": {
    "toolName": "places_manage",
    "methods": [
      "get_places"
    ],
    "description": "Geographic places and boundaries - location-based filtering and place information"
  },
  "observation_photos": {
    "toolName": "observation_photos_manage",
    "methods": [
      "post_observation_photos"
    ],
    "description": "Observation photo management - image handling and metadata"
  },
  "users": {
    "toolName": "users_manage",
    "methods": [
      "get_users_edit",
      "get_users_new_updates",
      "post_users",
      "put_users_id"
    ],
    "description": "User profiles and account management - user information and statistics"
  }
};

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
      this.client = new INaturalistClient({
        baseURL: this.config.baseURL || 'https://api.inaturalist.org/v1',
        apiToken: this.config.apiToken
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
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
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
            errorMessage = `HTTP ${response.status}: ${response.statusText}\n`;
            if (response.data) {
              errorMessage += `Response: ${JSON.stringify(response.data, null, 2)}`;
            }
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: `Error calling ${tool.name}.${args.method || 'unknown'}: ${errorMessage}`
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
      throw new Error(`Missing required parameter 'method'. Available methods: ${tool.methods.join(', ')}`);
    }
    
    if (!tool.methods.includes(args.method)) {
      throw new Error(`Invalid method '${args.method}'. Available methods: ${tool.methods.join(', ')}`);
    }
    
    // Get the module
    const moduleObj = client[tool.module];

    if (!moduleObj) {
      throw new Error(`Module ${tool.module} not found`);
    }

    // Get the method
    const method = moduleObj[args.method];
    if (!method || typeof method !== 'function') {
      throw new Error(`Method ${args.method} not found in module ${tool.module}`);
    }

    // Call the method with params (if provided)
    console.error(`Calling ${tool.module}.${args.method} with params:`, args.params);
    
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
    console.error(`Total tools: ${TOOLS.length} modules`);
    console.error(`Base URL: ${this.config.baseURL || 'https://api.inaturalist.org/v1'}`);
    console.error(`Authentication: ${this.config.apiToken ? 'enabled' : 'disabled'}`);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    baseURL: 'https://api.inaturalist.org/v1',
    apiToken: '',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url':
      case '-u':
        config.baseURL = args[++i];
        break;
      case '--api-token':
      case '-t':
        config.apiToken = args[++i];
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
  console.log(`
iNaturalist MCP Server v0.1.0

Usage: inat-mcp-server [options]

Options:
  -u, --base-url <url>      iNaturalist API base URL (default: https://api.inaturalist.org/v1)
  -t, --api-token <token>   API token for authenticated requests (optional)
  -h, --help                Show this help message

Environment Variables:
  INATURALIST_BASE_URL      iNaturalist API base URL
  INATURALIST_API_TOKEN     API token for authenticated requests

Examples:
  # Basic usage (read-only access)
  inat-mcp-server

  # With API token for authenticated requests
  inat-mcp-server --api-token your-token-here

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
${TOOLS.map(tool => `  - ${tool.name}: ${tool.description}`).join('\n')}

Based on @richard-stovall/inat-typescript-client v0.1.1
`);
}

// Main entry point
async function main() {
  const config = parseArgs();
  
  // Use environment variables as fallback
  config.baseURL = config.baseURL || process.env.INATURALIST_BASE_URL || 'https://api.inaturalist.org/v1';
  config.apiToken = config.apiToken || process.env.INATURALIST_API_TOKEN || '';

  // Create and start server
  const server = new INaturalistMCPServer(config);
  await server.start();
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
