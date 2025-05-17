# ChatAAP - Multi-LLM Chat Application

ChatAAP is a desktop application that enables users to communicate with multiple language model providers concurrently. It offers various conversation modes and an intuitive user interface for managing complex multi-LLM interactions.

<div align="center">
  <img src="assets/screenshot.png" alt="ChatAAP Screenshot" width="800">
</div>

## Features

- **Multiple LLM Support**: Connect to any OpenAI API-compatible providers
- **Flexible Conversation Modes**:
  - One-to-many: Send one message to multiple LLMs
  - Many-to-many: Each LLM sees all previous responses
  - Round-robin: Alternate responses between LLMs
  - Custom semantic discussion configurations
- **Conversation Control**:
  - Select which LLMs participate in conversations
  - Reply to specific LLMs individually
  - Continue conversations with all LLMs
- **Streamlined UI**: Modern interface for managing complex multi-LLM interactions
- **Customizable Themes**: Light, dark, and custom themes with adjustable colors

## Getting Started

### Prerequisites

- Node.js 16 or higher
- Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chataap.git
cd chataap

# Install dependencies
make install

# Start the development server
make dev
```

### Build

```bash
# Build the application
make build

# Package the application for your platform
make package

# Package for all platforms
make package-all
```

## Development

ChatAAP uses the following technologies:

- Electron for the desktop application framework
- React for the user interface
- TypeScript for type-safe code
- CSS Modules for component-scoped styling
- Webpack for bundling

### Project Structure

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

### Commands

The project includes a Makefile with the following commands:

- `make install`: Install dependencies
- `make dev`: Start development server
- `make build`: Build application for production
- `make start`: Start the built application
- `make lint`: Lint code
- `make typecheck`: Typecheck TypeScript code
- `make check`: Run all code quality checks
- `make package`: Package application for current platform
- `make package-all`: Package application for all platforms
- `make release`: Create a release
- `make clean`: Clean build files
- `make help`: Show help message

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.