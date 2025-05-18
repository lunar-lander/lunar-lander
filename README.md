# ChatAAP - Multi-LLM Conversation Platform

<div align="center">
  <h3>Experience the power of multiple AI models in a single interface</h3>
  <p>Compare responses, create collaborative discussions, and explore new interaction patterns</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-lightgrey)]()
</div>

![ChatAAP Screenshot](assets/screenshot.png)

## 🔍 Overview

ChatAAP is a desktop application that enables seamless interaction with multiple Large Language Models simultaneously. Designed for researchers, developers, and AI enthusiasts, it allows you to:

- **Compare responses** from different models to the same prompt
- **Create collaborative discussions** where models build on each other's thoughts
- **Customize interaction patterns** with flexible conversation modes
- **Manage your favorite models** with an intuitive configuration system

## ✨ Key Features

### Multi-LLM Support
- Connect to any OpenAI API-compatible provider (OpenAI, Anthropic, Gemini, etc.)
- Configure models with custom endpoints, API keys, and parameters
- Toggle models on/off during conversations with live updates

### Revolutionary Conversation Modes
- **Isolated Mode**: Each LLM can only see its own chat history with the user
- **Discussion Mode**: All LLMs see all messages and can reference each other
- **Round Robin**: Models respond sequentially, with each seeing previous responses
- **Custom Mode**: Define specialized semantic configurations

### Advanced Conversation Controls
- Select which LLMs participate in each conversation
- Toggle message visibility for more focused discussions
- Adjust temperature and other parameters per conversation
- Real-time streaming responses from multiple models simultaneously

### Thoughtful UI/UX
- Clean, intuitive interface for managing complex interactions
- Light/dark themes with customizable colors
- Conversation summaries and organization
- Markdown support in messages
- Exportable conversation history

## 🚀 Getting Started

### Download
Pre-built binaries are available for Windows, macOS, and Linux on our [releases page](https://github.com/yourusername/chataap/releases).

### Build From Source

#### Prerequisites
- Node.js 16.x or higher
- Yarn package manager

#### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/chataap.git
cd chataap

# Install dependencies
make install

# Start the development server
make dev
```

#### Build & Package
```bash
# Build the application
make build

# Package for your current platform
make package

# Package for Linux only (on Linux systems)
make package-linux

# Package for all platforms (requires proper environment)
make package-all
```

## 💻 Development

### Technology Stack
- **Electron**: Cross-platform desktop application framework
- **React**: UI library for component-based development
- **TypeScript**: Static typing for better code quality
- **CSS Modules**: Component-scoped styling
- **Webpack**: Module bundling

### Architecture
ChatAAP follows a modular architecture with clear separation of concerns:

#### Main Process (Electron Backend)
- Configuration management
- Model management and API connections
- IPC handlers for communication with renderer

#### Renderer Process (Frontend UI)
- React-based user interface
- Context-based state management
- Component-specific hooks and services

#### Project Structure
```
src/
  ├── main/           # Electron main process
  │   ├── config/     # Application configuration
  │   ├── models/     # LLM model management
  │   └── index.ts    # Main entry point
  ├── renderer/       # Electron renderer process (UI)
  │   ├── components/ # React components
  │   │   ├── Chat/   # Chat interface components
  │   │   ├── Layout/ # Application layout
  │   │   ├── Settings/ # Settings pages
  │   │   └── Sidebar/ # Sidebar components
  │   ├── contexts/   # React contexts for state
  │   ├── hooks/      # Custom React hooks
  │   ├── services/   # Frontend services
  │   │   ├── chatLogic/ # Chat interaction logic
  │   │   ├── db.ts     # Data persistence
  │   │   └── summaryGenerator.ts # Summary creation
  │   └── styles/     # Global styles
  └── shared/         # Shared code between processes
      └── types/      # TypeScript type definitions
```

### Development Commands
```bash
# Start development server with hot reload
make dev

# Run linting
make lint

# Check TypeScript types
make typecheck

# Run all quality checks
make check

# Build for production
make build

# Start production build locally
make start

# Clean build artifacts
make clean
```

## 🧩 Conversation Modes Explained

### Isolated Mode
- Each model only sees messages between itself and the user
- Perfect for comparing raw model capabilities on the same inputs
- Models cannot influence each other

### Discussion Mode
- All participants see all messages
- Models can reference and build upon each other's responses
- Creates a collaborative multi-model conversation

### Round Robin Mode
- Models respond in sequence to user messages
- Each model sees the user's message and all previous model responses
- Creates a chain of thought across multiple models

### Custom Mode
- Define specialized conversation rules
- Configure which models can see which messages
- Create unique interaction patterns

## 🔗 Connect Your LLMs

ChatAAP works with any OpenAI API-compatible service:

1. Go to Settings > Models
2. Add your model with:
   - Name: A display name for the model
   - Base URL: The API endpoint
   - Model Name: The specific model identifier
   - API Key: Your authentication key

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Roadmap

- Image support for multi-modal models
- Plugin ecosystem for extending functionality
- Custom prompt templates and presets
- Advanced conversation summarization
- File attachments and context handling

---

<div align="center">
  <p>Built with ❤️ by ChatAAP Team</p>
  <p><a href="https://chataap.blackmetal.tech">https://chataap.blackmetal.tech</a></p>
</div>