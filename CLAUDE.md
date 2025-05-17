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

## Misc

- Create a makefile for all operations
- Create a CI to build the app and publish it to GitHub releases
- Create a README for the project
- Create a LICENSE file for MIT license
