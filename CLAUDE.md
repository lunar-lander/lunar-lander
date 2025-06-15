# Multi-LLM Chat Application (Lunar Lander)

# DO NOT DO CHANGES IN MORE THAN ONE FOLDER AT A TIME!

## Project Overview

Lunar Lander is a desktop application that allows users to chat with multiple LLM providers concurrently. The app supports various conversation modes and provides intuitive UI controls for managing multi-LLM interactions.

### Key Features

1. **Multiple LLM Support**: Connect to any OpenAI API-compatible LLM providers
2. **Flexible Conversation Modes**:
   - **Isolated**: Each LLM sees only its own conversation (independent responses)
   - **Discuss**: All LLMs see all messages (collaborative discussion)
   - **Round Robin**: Sequential responses where each LLM builds on previous ones
   - **Custom DSL Mode**: User-defined conversation orchestration using YAML-based Domain-Specific Language
3. **Conversation Control**:
   - Select which LLMs participate in conversations
   - Toggle message visibility for specific responses
   - Control temperature and other LLM parameters
   - Real-time streaming responses from multiple models simultaneously
4. **Streamlined UI**: 
   - Intuitive interface for managing complex multi-LLM interactions
   - Copy button for easy message copying from LLM responses
   - Compact sidebar design for better space utilization
   - Resizable sidebar and input textarea with persistent settings
   - Proper zoom functionality with consistent scaling and stable sidebar positioning
   - Enhanced dark theme support with proper code block visibility
   - Transparent theme-based model toggle colors for better integration
5. **Comprehensive Keyboard Shortcuts**:
   - **Command Palette (Ctrl+K)**: Quick access to all commands with fuzzy search
   - **Chat Operations**: Ctrl+N (new chat), Ctrl+Shift+↑/↓ (navigate chats)
   - **Navigation**: Ctrl+, (settings), Ctrl+1/2 (switch views)
   - **Model Control**: Alt+1-9 (toggle first 9 models)
   - **System**: Ctrl+Shift+T (toggle theme), Escape (close dialogs)
   - **Visual Indicators**: Tooltips showing keyboard shortcuts throughout UI
6. **Cross-Platform**: Available for Linux, Windows, macOS, iOS, and Android

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
  - UI preferences (fontSize, fontFamily, messageBubbleStyle, sidebarWidth, inputHeight)
  - Behavior settings (sendOnEnter, autoSave, notifications)
  - Privacy settings (saveHistory, anonymizeData)
  - Advanced settings (logLevel, useGPU, proxy)
  - IPC handlers for main/renderer process communication
  - Persistent storage in app user directory
  - DSL file management with import/export capabilities

### Build System
- Replaced Vite with Webpack
- **Configuration**:
  - `webpack.main.config.js`: Configuration for Electron main process
  - `webpack.renderer.config.js`: Configuration for Electron renderer process
- **Scripts**:
  - `yarn dev`: Development mode with hot reloading
  - `yarn build`: Production build
  - `yarn start`: Run the built application
  - `yarn dist:linux`: Build Linux package
  - `yarn dist:win-manual`: Build Windows package
  - `yarn dist:mac-manual`: Build macOS package

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
  - Resizable sidebar with drag handle and persistent width settings
- **Sidebar**: `src/renderer/components/Sidebar/`
  - New chat button
  - Theme toggle (light/dark mode)
  - Settings navigation
  - Chat history list with summaries
  - Model toggles with transparent theme-based colors
- **Chat Interface**: `src/renderer/components/Chat/`
  - **Chat.tsx**: Main chat container for UI rendering (logic moved to useChat hook)
  - **ChatMessages.tsx**: Scrollable message list with visibility controls
  - **ChatMessage.tsx**: Individual message bubbles with streaming support and copy functionality
  - **ChatInput.tsx**: Input area with resizable textarea, LLM toggles, temperature control, and mode selection
- **Settings**: `src/renderer/components/Settings/`
  - **ConversationMode.tsx**: DSL editor with validation, file management, and reference guide
  - **DSLReference.tsx**: Comprehensive interactive reference for DSL syntax
- **Command Palette**: `src/renderer/components/CommandPalette/`
  - **CommandPalette.tsx**: Modal interface for quick command access with fuzzy search
  - **CommandPalette.module.css**: Styled with smooth animations and keyboard navigation
  - Categorized commands with visual shortcuts indicators

### Keyboard Shortcuts System
- **Location**: `src/renderer/hooks/useKeyboardShortcuts.ts` and `src/renderer/contexts/ShortcutsContext.tsx`
- **Features**:
  - **Global Event Handling**: Captures keyboard events across the entire application
  - **Context-Aware**: Respects input focus states to avoid conflicts with typing
  - **Command Palette Integration**: Ctrl+K opens searchable command interface
  - **Dynamic Registration**: Shortcuts update based on available models and chats
  - **Visual Feedback**: Tooltips and help text show available shortcuts
- **Type System**: `src/shared/types/shortcuts.ts`
  - Type-safe shortcut definitions with categories and actions
  - Command palette items with search keywords and descriptions
- **Shortcut Categories**:
  - **Chat**: New chat (Ctrl+N), navigate chats (Ctrl+Shift+↑/↓)
  - **Navigation**: Settings toggle (Ctrl+,), view switching (Ctrl+1/2)
  - **Models**: Toggle first 9 models (Alt+1-9), bulk operations via palette
  - **System**: Theme toggle (Ctrl+Shift+T), close dialogs (Escape)

### Chat Logic & State Management
- **Chat Logic**: `src/renderer/services/chatLogic/`
  - **chatHandler.ts**: Core class handling chat operations
  - **handlers/**: Strategy pattern implementations for different conversation modes
    - **baseHandler.ts**: Abstract base handler with common functionality
    - **isolatedHandler.ts**: Handler for isolated conversation mode
    - **discussHandler.ts**: Handler for discuss conversation mode
    - **roundRobinHandler.ts**: Handler for round-robin conversation mode
    - **customHandler.ts**: Handler for custom DSL-based conversation modes
  - Improved separation of concerns with UI components
  - Factory pattern for creating appropriate handlers
- **Hooks**: `src/renderer/hooks/`
  - **useChat.ts**: Custom hook connecting UI components with chat logic
  - Manages component state and provides handlers for UI interactions
- **Context API**: `src/renderer/contexts/AppContext.tsx`
  - Theme preferences (light/dark mode)
  - Current view management (chat/settings)
  - Chat list and active chat state
  - Model configuration and selection
  - Persistence integration
  - Multi-LLM chat orchestration

### DSL System (Domain-Specific Language)
- **Location**: `src/renderer/services/dsl/`
- **Features**:
  - **YAML-based configuration** for intuitive conversation orchestration
  - **Multi-phase execution** with flexible flow control
  - **Smart model selection**: `all`, `first`, `last`, `random`, or specific indices
  - **Context control**: Fine-grained control over message visibility (`user_only`, `all_previous`, `phase_previous`)
  - **Role assignments** for specialized model personas
  - **Custom prompts** per phase with global and phase-specific options
  - **File management** with save/load/import/export capabilities
- **Components**:
  - **dslParser.ts**: YAML parsing, validation, and serialization
  - **dslExecutor.ts**: Multi-phase conversation execution engine
  - **dslFileManager.ts**: File operations with cross-platform IPC
- **Example DSL**:
  ```yaml
  name: "Collaborative Refinement"
  description: "Multi-stage collaboration with refinement and summary"
  phases:
    - name: "Initial Response"
      models: "all"
      context: "user_only"
    - name: "Refinement"
      models: "all"
      context: "all_previous"
      prompt: "Refine your answer based on other responses"
    - name: "Final Summary"
      models: "first"
      context: "all_previous"
      prompt: "Synthesize all responses into a final answer"
  ```

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
  │   │   ├── CommandPalette/ # Command palette for keyboard shortcuts
  │   │   ├── Layout/ # Application layout components
  │   │   ├── Settings/ # Settings page components
  │   │   └── Sidebar/ # Sidebar components
  │   ├── contexts/   # React contexts for state management
  │   │   ├── AppContext.tsx # Main application state
  │   │   └── ShortcutsContext.tsx # Keyboard shortcuts management
  │   ├── hooks/      # React hooks
  │   │   ├── useChat.ts # Chat-specific hooks
  │   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts logic
  │   ├── services/   # Frontend services
  │   │   ├── chatLogic/ # Chat logic implementation
  │   │   │   ├── chatHandler.ts # Core chat logic
  │   │   │   └── handlers/  # Conversation mode handlers
  │   │   ├── dsl/    # DSL system for custom conversation orchestration
  │   │   │   ├── dslParser.ts # YAML parsing and validation
  │   │   │   ├── dslExecutor.ts # Multi-phase execution engine
  │   │   │   └── dslFileManager.ts # File operations
  │   │   ├── db.ts   # Database service
  │   │   └── summaryGenerator.ts # Chat summary generation
  │   ├── styles/     # Global styles
  │   └── index.tsx   # Renderer entry point 
  └── shared/         # Shared code between processes
      ├── types/      # TypeScript type definitions
      │   ├── chat.ts # Chat-related type definitions
      │   ├── model.ts # Model-related type definitions
      │   ├── dsl.ts  # DSL-related type definitions
      │   └── shortcuts.ts # Keyboard shortcuts type definitions
      └── utils/      # Utility functions
```

## Project Setup

### Makefile
- Comprehensive Makefile for all common operations:
  - `make install`: Install dependencies
  - `make dev`: Start development server
  - `make build`: Build for production
  - `make start`: Run the built application
  - `make lint`: Lint code
  - `make typecheck`: Type check TypeScript code
  - `make check`: Run all code quality checks
  - `make package`: Package for current platform
  - `make package-linux`: Package for Linux
  - `make package-win`: Package for Windows
  - `make package-mac`: Package for macOS
  - `make package-all`: Package for all platforms
  - `make release`: Create a release
  - `make clean`: Clean build files

### Cross-Platform Packaging

#### Desktop Applications
- **Linux Packaging**: Uses electron-builder to create ZIP packages
- **Windows Packaging**: Custom script (scripts/package-win.js) to create ZIP packages
- **macOS Packaging**: Custom script (scripts/package-mac.js) to create ZIP packages
- Platform-specific build outputs in the `build` directory

#### Mobile Applications
- **Capacitor Integration**: Added Capacitor for iOS and Android support
- **Mobile Build Scripts**: `yarn build:mobile`, `yarn mobile:sync`, `yarn mobile:run:android/ios`
- **Cross-Platform Compatibility**: Unified codebase with platform-specific adaptations
- **Mobile-Optimized**: Touch-friendly UI, responsive design, and native performance

### CI/CD
- GitHub Actions workflow for building and releasing:
  - Automatically builds on push to main/master and pull requests
  - Runs tests, linting, and type checking
  - Builds and packages for all platforms on tagged releases or master pushes
  - Publishes releases to GitHub Releases
  - Supports Linux, macOS, and Windows

### Recent UI Enhancements

#### Message Management & Copy Functionality
- **Copy Button**: Added one-click copy functionality for LLM responses
  - Located in `src/renderer/components/Chat/ChatMessage.tsx`
  - Positioned right side of message content for easy access
  - Uses native clipboard API for reliable copying across platforms

#### Layout & Responsiveness
- **Resizable Sidebar**: Interactive sidebar width adjustment
  - Drag handle on right edge of sidebar in `src/renderer/components/Layout/Layout.tsx`
  - Real-time visual feedback during resizing
  - Persistent width settings stored in user configuration
- **Resizable Input Area**: Adjustable chat input textarea height
  - Drag handle at bottom of input in `src/renderer/components/Chat/ChatInput.tsx`
  - Smooth resize animation with delta-based calculation
  - Height preferences saved to configuration and restored on app restart
- **Compact Sidebar Design**: Optimized space utilization for chat history
  - Reduced padding, margins, and font sizes in `src/renderer/components/Sidebar/Sidebar.module.css`
  - Single-line chat items with ultra-compact layout
  - Significantly more conversations visible in limited space

#### Visual & Theme Improvements
- **Model Toggle Colors**: Enhanced visual integration with theme system
  - Transparent theme-based colors (6-8% opacity) instead of bright pastels
  - Consistent with overall application design language
  - Better text visibility and subtle visual feedback
- **Improved Zoom Implementation**: Fixed zoom behavior for proper scaling
  - Updated `src/renderer/styles/global.css` to use transform-only scaling
  - Eliminated double scaling (font-size + transform) issues
  - Proper viewport compensation for accurate zoom levels
- **Dark Theme Code Visibility**: Enhanced readability of code blocks
  - Added proper text color styling in `src/renderer/components/Chat/ChatMessage.module.css`
  - Both inline and block code elements fully visible in dark mode

#### State Management & Consistency  
- **Model Selection Sync**: Fixed inconsistent behavior between sidebar and chat box
  - Enhanced `src/renderer/hooks/useChat.ts` to maintain unified model state
  - Both sidebar toggles and chat input maintain consistent selections
  - Eliminated confusion from divergent model states
- **Configuration Persistence**: All UI customizations saved automatically
  - Sidebar width, input height, and other preferences stored via IPC
  - Settings restored on application restart for consistent experience

#### Keyboard Shortcuts & Command Palette
- **Command Palette (Ctrl+K)**: Universal command interface with fuzzy search
  - Located in `src/renderer/components/CommandPalette/`
  - Categorized commands with keyboard navigation (↑/↓ to navigate, Enter to execute)
  - Dynamic content based on current app state (available models, chats, etc.)
  - Visual shortcut indicators and searchable descriptions
- **Global Keyboard Shortcuts**: Comprehensive shortcut system
  - **Implementation**: `src/renderer/hooks/useKeyboardShortcuts.ts` and `src/renderer/contexts/ShortcutsContext.tsx`
  - **Context-aware**: Respects input focus to avoid conflicts with typing
  - **Visual Integration**: Tooltips on buttons show corresponding keyboard shortcuts
  - **Type-safe**: Full TypeScript support with `src/shared/types/shortcuts.ts`
- **Enhanced Help Text**: Chat input area shows key shortcuts (Ctrl+Enter, Ctrl+K, Ctrl+N)
- **Model Toggle Shortcuts**: Alt+1-9 for quick model activation/deactivation
- **Navigation Shortcuts**: Ctrl+, for settings, Ctrl+1/2 for view switching

### Mobile Implementation

#### Capacitor Integration
- **Framework**: Uses Capacitor 7.x for iOS and Android support
- **Web-to-Native Bridge**: Maintains React/TypeScript codebase while providing native capabilities
- **Platform Detection**: Runtime detection for mobile vs desktop functionality
- **Native Plugins**: Leverages Capacitor's Preferences, Filesystem, Device, and App plugins

#### Cross-Platform Compatibility Layer
- **Location**: `src/renderer/services/capacitor.ts`
- **Unified API**: Single interface for both Electron IPC and Capacitor native APIs
- **Storage Abstraction**: Transparent switching between localStorage (desktop) and Capacitor Preferences (mobile)
- **File System**: Cross-platform file operations using Capacitor Filesystem on mobile
- **Configuration Management**: Platform-specific storage with unified interface

#### Mobile-Responsive UI Design
- **Responsive Layout**: Mobile-first CSS with breakpoints at 768px and 1024px
- **Touch-Friendly Interface**: 44px minimum touch targets per iOS guidelines
- **Mobile Navigation**: Sidebar converts to slide-out drawer with overlay on mobile
- **Fixed Input**: Chat input becomes fixed at bottom on mobile for easier typing
- **Viewport Handling**: Proper mobile viewport configuration and zoom prevention

#### Platform-Specific Optimizations
- **iOS Optimizations**: 
  - Smooth scrolling with `-webkit-overflow-scrolling: touch`
  - Proper safe area handling
  - Native keyboard behavior
- **Android Optimizations**:
  - Material Design patterns
  - Back button handling
  - Hardware acceleration
- **Performance**:
  - Efficient rendering for mobile hardware
  - Optimized bundle size for mobile networks
  - Battery-conscious background behavior

#### Development Workflow
- **Git Practices**: Commit and push changes after every feature or bug fix
- **Commit Messages**: Use conventional commit format (fix:, feat:, etc.)
- **Code Quality**: Run lint and typecheck before committing changes
- **Documentation**: Update CLAUDE.md when adding new features or fixes

### Documentation
- README.md with comprehensive documentation:
  - Project overview and features
  - Installation and development instructions
  - Project structure
  - Commands and contribution guidelines
- LICENSE file with MIT license
- Electron-builder configuration for creating distributable packages