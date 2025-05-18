const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Ensure the build directory exists
if (!fs.existsSync(path.join(__dirname, '../build'))) {
  fs.mkdirSync(path.join(__dirname, '../build'));
}

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Output file path
const outputPath = path.join(__dirname, `../build/ChatAAP-${version}-mac-x64.zip`);

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Set compression level
});

console.log('Creating macOS package...');

// Listen for all archive data to be written
output.on('close', function() {
  console.log('macOS package complete!');
  console.log(`macOS package created: ${archive.pointer()} total bytes`);
  console.log(`Package saved to: ${outputPath}`);
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Build the application first
console.log('Building application...');
execSync('yarn build', { stdio: 'inherit' });

// Add the dist folder to the archive
console.log('Adding application files...');
archive.directory(path.join(__dirname, '../dist/'), 'dist');

// Add package.json
archive.file(path.join(__dirname, '../package.json'), { name: 'package.json' });

// Create a simple startup script for macOS
const startScript = `#!/bin/bash
cd "\$(dirname "\$0")"
./node_modules/.bin/electron dist/main/index.js
`;

// Add the startup script
archive.append(startScript, { name: 'start.sh', mode: 0o755 });

// Add a README with instructions
const readmeContent = `# ChatAAP for macOS

## Running the Application

1. Extract this ZIP file to a location of your choice
2. Open Terminal
3. Navigate to the extracted folder: \`cd path/to/extracted/folder\`
4. Install dependencies: \`npm install\` or \`yarn install\`
5. Run the application: \`./start.sh\`

Alternatively, you can run the application with:
\`./node_modules/.bin/electron dist/main/index.js\`

## System Requirements

- macOS 10.15 or later
- Node.js 14 or later
`;

archive.append(readmeContent, { name: 'README.md' });

// Finalize the archive
archive.finalize();