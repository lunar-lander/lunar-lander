# Multi-LLM Chat Application (ChatAAP)

# DO NOT DO CHANGES IN MORE THAN ONE FOLDER AT A TIME!

## Project Overview

ChatAAP is a desktop application that allows users to chat with multiple LLM providers concurrently. The app supports various conversation modes and provides intuitive UI controls for managing multi-LLM interactions.

### Key Features

1. **Multiple LLM Support**: Connect to any OpenAI API-compatible LLM providers
2. **Flexible Conversation Modes**:
   - One-to-many: Send one message to multiple LLMs
   - Many-to-many: Each LLM sees all previous responses
   - Round-robin: Alternate responses between LLMs
   - Custom semantic discussion configurations
3. **Conversation Control**:
   - Select which LLMs participate in conversations
   - Reply to specific LLMs individually
   - Continue conversations with all LLMs
4. **Streamlined UI**: Intuitive interface for managing complex multi-LLM interactions

## Technical Implementation

### Model Management System
- **Location**: `src/main/models/index.ts`
- **Features**:
  - Model configuration with provider-agnostic approach
  - Support for any OpenAI API-compatible provider
  - Configuration parameters: baseUrl, modelName, and apiKey
  - Model activation/deactivation functionality
  - Persistent configuration storage in user data directory

### Configuration System
- **Location**: `src/main/config/`
- **Features**:
  - Theme configuration (light/dark/custom themes)
  - UI preferences (fontSize, fontFamily, messageBubbleStyle)
  - Behavior settings (sendOnEnter, autoSave, notifications)
  - Privacy settings (saveHistory, anonymizeData)
  - Advanced settings (logLevel, useGPU, proxy)
  - IPC handlers for main/renderer process communication
  - Persistent storage in app user directory

### Build System
- Replaced Vite with Webpack
- **Configuration**:
  - `webpack.main.config.js`: Configuration for Electron main process
  - `webpack.renderer.config.js`: Configuration for Electron renderer process
- **Scripts**:
  - `yarn dev`: Development mode with hot reloading
  - `yarn build`: Production build
  - `yarn start`: Run the built application

### UI and Styling
- CSS Modules for component-scoped styling
- CSS Variables for theming support
- **Structure**:
  - Global styles: `src/renderer/styles/global.css`
  - CSS Variables: `src/renderer/styles/variables.css`
  - Component styles: Co-located with components (`Component.module.css`)
- **Features**:
  - Light/dark theme support via CSS variables
  - Consistent design system with shared variables
  - Scoped styles to prevent conflicts
  - Co-located CSS with component code
  - Typed CSS modules for TypeScript integration

### Directory Structure
```
src/
  ├── main/           # Electron main process
  │   ├── config/     # Application configuration
  │   │   ├── config-manager.ts
  │   │   └── ipc-handlers.ts
  │   ├── models/     # LLM model management
  │   │   └── index.ts
  │   └── index.ts    # Main entry point
  ├── renderer/       # Electron renderer process (UI)
  │   ├── components/ # React components
  │   ├── contexts/   # React contexts
  │   ├── hooks/      # React hooks
  │   └── index.tsx   # Renderer entry point 
  └── shared/         # Shared code between processes
      ├── types/      # TypeScript type definitions
      └── utils/      # Utility functions
```

## Misc

- Create a makefile for all operations
- Create a CI to build the app and publish it to GitHub releases
- Create a README for the project
- Create a LICENSE file for MIT license
