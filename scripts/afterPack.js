const path = require('path');
const fs = require('fs');

/**
 * After pack hook for electron-builder
 * This script runs after the application is packaged but before creating distributables
 */
exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  
  console.log(`Running afterPack for ${electronPlatformName}`);
  console.log(`App output directory: ${appOutDir}`);
  
  // Ensure the packaged app has proper permissions on Unix systems
  if (electronPlatformName === 'linux' || electronPlatformName === 'darwin') {
    const executablePath = electronPlatformName === 'darwin' 
      ? path.join(appOutDir, 'Lunar Lander.app', 'Contents', 'MacOS', 'Lunar Lander')
      : path.join(appOutDir, 'lunar-lander');
    
    if (fs.existsSync(executablePath)) {
      fs.chmodSync(executablePath, '755');
      console.log(`Set executable permissions for ${executablePath}`);
    }
  }
  
  console.log('afterPack completed successfully');
};