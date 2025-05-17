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
   - Toggle message visibility for specific responses
   - Control temperature and other LLM parameters
   - Real-time streaming responses from multiple models simultaneously
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

### UI Components
- **Layout**: `src/renderer/components/Layout/`
  - Main application layout with sidebar and content area
- **Sidebar**: `src/renderer/components/Sidebar/`
  - New chat button
  - Theme toggle (light/dark mode)
  - Settings navigation
  - Chat history list with summaries
- **Chat Interface**: `src/renderer/components/Chat/`
  - **Chat.tsx**: Main chat container with logic for message management
  - **ChatMessages.tsx**: Scrollable message list with visibility controls
  - **ChatMessage.tsx**: Individual message bubbles with streaming support
  - **ChatInput.tsx**: Input area with LLM toggles, temperature control, and mode selection
- **Settings**: `src/renderer/components/Settings/`
  - Basic settings page structure

### State Management
- **Context API**: `src/renderer/contexts/AppContext.tsx`
  - Theme preferences (light/dark mode)
  - Current view management (chat/settings)
  - Chat list and active chat state
  - Model configuration and selection
  - Persistence integration
  - Multi-LLM chat orchestration

### Data Storage and Services
- **Database Service**: `src/renderer/services/db.ts`
  - LocalStorage-based persistence layer
  - Future-ready for SQLite or file-based storage
  - Chat and message data structure
  - Model configuration storage
- **Summary Generator**: `src/renderer/services/summaryGenerator.ts`
  - Automatic summary generation from first message
  - Prepared for future LLM-based summarization
- **Mock Data**: `src/renderer/services/mockData.ts`
  - Development data generation
  - Sample chats and model configurations for testing

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
  │   │   ├── Chat/   # Chat interface components
  │   │   ├── Layout/ # Application layout components
  │   │   ├── Settings/ # Settings page components
  │   │   └── Sidebar/ # Sidebar components
  │   ├── contexts/   # React contexts for state management
  │   ├── hooks/      # React hooks
  │   ├── services/   # Frontend services
  │   │   ├── db.ts   # Database service
  │   │   └── summaryGenerator.ts # Chat summary generation
  │   ├── styles/     # Global styles
  │   └── index.tsx   # Renderer entry point 
  └── shared/         # Shared code between processes
      ├── types/      # TypeScript type definitions
      │   ├── chat.ts # Chat-related type definitions
      │   └── model.ts # Model-related type definitions
      └── utils/      # Utility functions
```

## Project Setup

### Makefile
- Created comprehensive Makefile for all common operations:
  - `make install`: Install dependencies
  - `make dev`: Start development server
  - `make build`: Build for production
  - `make start`: Run the built application
  - `make lint`: Lint code
  - `make typecheck`: Type check TypeScript code
  - `make check`: Run all code quality checks
  - `make package`: Package for current platform
  - `make package-all`: Package for all platforms
  - `make release`: Create a release
  - `make clean`: Clean build files

### CI/CD
- GitHub Actions workflow for building and releasing:
  - Automatically builds on push to main and pull requests
  - Runs tests, linting, and type checking
  - Builds and packages for all platforms on tagged releases
  - Publishes releases to GitHub Releases
  - Supports Linux, macOS, and Windows

### Documentation
- README.md with comprehensive documentation:
  - Project overview and features
  - Installation and development instructions
  - Project structure
  - Commands and contribution guidelines
- LICENSE file with MIT license
- Electron-builder configuration for creating distributable packages
