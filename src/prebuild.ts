#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const validateProject = (): void => {
  console.log('🔍 Validating iNaturalist MCP Server v2.0 project structure...');

  // Check that essential source files exist
  const requiredFiles = ['src/generate-tools.ts', 'src/server.ts', 'src/cli.ts', 'package.json', 'tsconfig.json'];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  // Check package.json for required dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@modelcontextprotocol/sdk', '@richard-stovall/inat-typescript-client'];

  const missingDeps = requiredDeps.filter(
    dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.error('❌ Missing required dependencies:');
    missingDeps.forEach(dep => console.error(`   - ${dep}`));
    process.exit(1);
  }

  // Check that dist directory exists
  if (!fs.existsSync('dist')) {
    console.log('📁 Creating dist directory...');
    fs.mkdirSync('dist', { recursive: true });
  }

  console.log('✅ Project structure validation complete');
};

const generateConfigFiles = (): void => {
  console.log('⚙️  Generating configuration files...');

  // Generate tools, resources, and prompts by running the generator
  try {
    // Import and run the generator
    import('./generate-tools.js')
      .then(() => {
        console.log('✅ Configuration files generated successfully');
      })
      .catch(error => {
        console.error('❌ Failed to generate configuration files:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('❌ Failed to import generator:', error);
    process.exit(1);
  }
};

const validateGeneratedFiles = (): void => {
  console.log('🔍 Validating generated files...');

  const generatedFiles = ['dist/tools-generated.json', 'dist/resources-generated.json', 'dist/prompts-generated.json'];

  // Wait a moment for files to be written
  setTimeout(() => {
    const missingGenerated = generatedFiles.filter(file => !fs.existsSync(file));

    if (missingGenerated.length > 0) {
      console.error('❌ Missing generated files:');
      missingGenerated.forEach(file => console.error(`   - ${file}`));
      process.exit(1);
    }

    // Validate JSON structure
    generatedFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`✅ ${path.basename(file)}: Valid JSON structure`);

        if (file.includes('tools')) {
          console.log(`   📊 Tools: ${content.tools?.length || 0}`);
        } else if (file.includes('resources')) {
          console.log(`   📚 Resources: ${content.resources?.length || 0}`);
        } else if (file.includes('prompts')) {
          console.log(`   💡 Prompts: ${content.prompts?.length || 0}`);
        }
      } catch (error) {
        console.error(`❌ Invalid JSON in ${file}:`, error);
        process.exit(1);
      }
    });

    console.log('✅ All generated files validated successfully');
  }, 1000);
};

const showBuildSummary = (): void => {
  setTimeout(() => {
    console.log('\n🎉 iNaturalist MCP Server v2.0 prebuild complete!\n');

    console.log('📋 Project Summary:');
    console.log('   • Architecture: Modular TypeScript with proper authentication flow');
    console.log('   • Client: @richard-stovall/inat-typescript-client v0.2.0');
    console.log('   • Categories: 9 tool categories covering all major iNaturalist functionality');
    console.log('   • Authentication: OAuth 2.0 Resource Owner Password Credentials Flow');
    console.log('   • Features: Tools, Resources, Prompts with comprehensive documentation\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Run: npm run build');
    console.log(
      '   2. Test: echo \'{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}\' | node dist/cli.js'
    );
    console.log('   3. Configure Claude Desktop with your credentials');
    console.log('   4. Start exploring nature with iNaturalist!\n');

    console.log('📖 Documentation:');
    console.log('   • Use MCP resources: inaturalist://docs/overview');
    console.log('   • Authentication: inaturalist://docs/authentication');
    console.log('   • Examples: inaturalist://docs/examples');
    console.log('   • Category docs: inaturalist://docs/{category}');
  }, 1500);
};

const main = (): void => {
  console.log('🌿 iNaturalist MCP Server v2.0 - Prebuild Process\n');

  validateProject();
  generateConfigFiles();
  validateGeneratedFiles();
  showBuildSummary();
};

main();
