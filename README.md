# Lunar Lander - Multi-LLM Conversation Platform

<div align="center">
  <h3>Experience the power of multiple AI models in a single interface</h3>
  <p>Compare responses, create collaborative discussions, and explore new interaction patterns</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-lightgrey)]()
</div>

![Lunar Lander Screenshot](assets/screenshot.png)

## 🔍 Overview

Lunar Lander is a desktop application that enables seamless interaction with multiple Large Language Models simultaneously. Designed for researchers, developers, and AI enthusiasts, it allows you to:

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
- **One-to-Many**: Send one message to multiple LLMs simultaneously
- **Many-to-Many**: Each LLM sees all previous responses
- **Round Robin**: Models respond in sequence, with each building on previous responses
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
Pre-built binaries are available for Windows, macOS, and Linux on our [releases page](https://github.com/yourusername/lunar-lander/releases).

### Build From Source

#### Prerequisites
- Node.js 16.x or higher
- Yarn package manager

#### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/lunar-lander.git
cd lunar-lander

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

# Package for all Linux formats
make package-linux-all

# Package for Windows only
make package-win

# Package for macOS only
make package-mac

# Package for all platforms
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
Lunar Lander follows a modular architecture with clear separation of concerns:

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

### One-to-Many Mode
- Send a single message to multiple models simultaneously
- Each model responds independently
- Perfect for comparing raw model capabilities on the same inputs
- Models cannot influence each other

### Many-to-Many Mode
- All participants see all messages
- Models can reference and build upon each other's responses
- Creates a collaborative multi-model conversation

### Round Robin Mode
- Models respond in sequence to user messages
- Each model sees the user's message and all previous model responses
- Creates a chain of thought with each model building on previous responses
- Produces a cumulative, collaborative response sequence

### Custom Mode
- Define specialized conversation rules
- Configure which models can see which messages
- Create unique interaction patterns

## 🔗 Connect Your LLMs

Lunar Lander works with any OpenAI API-compatible service:

1. Go to Settings > Models
2. Add your model with:
   - Name: A display name for the model
   - Base URL: The API endpoint
   - Model Name: The specific model identifier
   - API Key: Your authentication key

## 📦 Package Formats

Lunar Lander is available in multiple package formats:

### Linux
- **ZIP**: Portable format for all Linux distributions
- **AppImage**: Self-contained executable format
- **DEB**: For Debian-based distributions (Ubuntu, Linux Mint, etc.)
- **Pacman**: For Arch-based distributions (Arch Linux, Manjaro, etc.)

### Windows
- **ZIP**: Portable format

### macOS
- **ZIP**: Portable format

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
  <p>Built with ❤️ by Lunar Lander Team</p>
  <p><a href="https://lunar-lander.blackmetal.tech">https://lunar-lander.blackmetal.tech</a></p>
</div>