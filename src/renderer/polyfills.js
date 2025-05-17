// Polyfills for Node.js modules in browser environment
global.process = require('process');
global.Buffer = require('buffer').Buffer;

// These are no-op implementations for Node.js modules that are imported but not actually used
if (!global.process.env) global.process.env = {};
if (!global.process.version) global.process.version = '0.0.0';