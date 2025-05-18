const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const electronVersion = '28.3.3'; // Match your electron version
const appName = 'ChatAAP';
const appVersion = '0.1.0';

// Create the build directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '../build'))) {
  fs.mkdirSync(path.join(__dirname, '../build'));
}

// Function to create a Windows package
async function createWindowsPackage() {
  console.log('Creating Windows package...');
  
  // Create a zip file
  const output = fs.createWriteStream(path.join(__dirname, `../build/${appName}-${appVersion}-win-x64.zip`));
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Set up archive events
  output.on('close', function() {
    console.log(`Windows package created: ${archive.pointer()} total bytes`);
    console.log(`Package saved to: build/${appName}-${appVersion}-win-x64.zip`);
  });
  
  archive.on('error', function(err) {
    throw err;
  });
  
  // Pipe archive data to the file
  archive.pipe(output);
  
  // Add the application files
  console.log('Adding application files...');
  
  // Add dist directory
  archive.directory(path.join(__dirname, '../dist/'), 'resources/app/dist');
  
  // Add package.json
  archive.file(path.join(__dirname, '../package.json'), { name: 'resources/app/package.json' });
  
  // Create and add a simplified package.json for the app root
  const appPackageJson = {
    name: 'chataap',
    version: appVersion,
    main: 'resources/app/dist/main/index.js',
    description: 'A multi-LLM chat application with flexible conversation modes'
  };
  archive.append(JSON.stringify(appPackageJson, null, 2), { name: 'package.json' });

  // Add batch file to start the app
  const batchContent = `@echo off
echo Starting ${appName}...
.\\chataap.exe
`;
  archive.append(batchContent, { name: 'start.bat' });
  
  // Add a README
  const readmeContent = `# ${appName} for Windows

This is a portable version of ${appName} for Windows.

## Running the application

1. Extract all files in this zip to a folder
2. Double-click on start.bat to run the application

Visit https://chataap.blackmetal.tech for more information.
`;
  archive.append(readmeContent, { name: 'README.txt' });
  
  // Create an empty directory structure
  archive.append(Buffer.alloc(0), { name: 'resources/app/node_modules/.gitkeep' });
  
  // Finalize the archive
  await archive.finalize();
  
  console.log('Windows package complete!');
}

// Run the packaging process
createWindowsPackage().catch(err => {
  console.error('Error creating Windows package:', err);
  process.exit(1);
});