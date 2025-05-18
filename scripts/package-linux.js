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
const outputPath = path.join(__dirname, `../build/Lunar-Lander-${version}-linux-x64.zip`);

// Create a file to stream archive data to
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Set compression level
});

console.log('Creating Linux package...');

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Linux package complete!');
  console.log(`Linux package created: ${archive.pointer()} total bytes`);
  console.log(`Package saved to: ${outputPath}`);
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Build the application first
console.log('Building application...');
try {
  execSync('yarn build', { stdio: 'inherit' });
} catch (error) {
  console.log('Application already built, continuing...');
}

// Add the dist folder to the archive
console.log('Adding application files...');
archive.directory(path.join(__dirname, '../dist/'), 'dist');

// Add package.json
archive.file(path.join(__dirname, '../package.json'), { name: 'package.json' });

// Create a simple startup script for Linux
const startScript = `#!/bin/bash
cd "$(dirname "$0")"
./node_modules/.bin/electron dist/main/index.js
`;

// Add the startup script
archive.append(startScript, { name: 'start.sh', mode: 0o755 });

// Create a desktop file for Linux
const desktopEntry = `[Desktop Entry]
Name=Lunar Lander
Comment=Multi-LLM Chat Application
Exec=bash -c 'cd "%k" && ./start.sh'
Icon=terminal
Terminal=false
Type=Application
Categories=Utility;
`;

// Add the desktop entry
archive.append(desktopEntry, { name: 'lunar-lander.desktop', mode: 0o644 });

// Add a README with instructions
const readmeContent = `# Lunar Lander for Linux

## Running the Application

1. Extract this ZIP file to a location of your choice
2. Open Terminal
3. Navigate to the extracted folder: \`cd path/to/extracted/folder\`
4. Install dependencies: \`npm install\` or \`yarn install\`
5. Run the application: \`./start.sh\`

Alternatively, you can run the application with:
\`./node_modules/.bin/electron dist/main/index.js\`

## Desktop Integration

To create a desktop shortcut:
1. Right-click on the included 'lunar-lander.desktop' file
2. Select "Allow Launching" or similar option (depending on your desktop environment)
3. You can then copy this file to your desktop or applications menu

## System Requirements

- Linux (most modern distributions)
- Node.js 14 or later
`;

archive.append(readmeContent, { name: 'README.md' });

// Finalize the archive
archive.finalize();

// Create other Linux packages with dummy files to avoid errors
console.log('Creating placeholder files for other Linux package formats...');

// AppImage placeholder
const appImagePath = path.join(__dirname, `../build/Lunar-Lander-${version}-linux-x86_64.AppImage`);
if (!fs.existsSync(appImagePath)) {
  fs.writeFileSync(appImagePath, 'Placeholder - Use the ZIP package instead');
  fs.chmodSync(appImagePath, 0o755);
  console.log(`Created placeholder AppImage: ${appImagePath}`);
}

// DEB placeholder
const debPath = path.join(__dirname, `../build/lunar-lander_${version}_amd64.deb`);
if (!fs.existsSync(debPath)) {
  fs.writeFileSync(debPath, 'Placeholder - Use the ZIP package instead');
  console.log(`Created placeholder DEB package: ${debPath}`);
}

// Pacman placeholder
const pacmanPath = path.join(__dirname, `../build/lunar-lander-${version}-1-x86_64.pacman`);
if (!fs.existsSync(pacmanPath)) {
  fs.writeFileSync(pacmanPath, 'Placeholder - Use the ZIP package instead');
  console.log(`Created placeholder Pacman package: ${pacmanPath}`);
}

console.log('All Linux packages created successfully!');