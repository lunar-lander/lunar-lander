import { Model } from '../../shared/types/model';
import { Chat } from '../../shared/types/chat';
import { DbService } from './db';

// Creates mock data for testing the application
export const initializeMockData = () => {
  // Create mock models if none exist
  const models = DbService.getModels();
  if (models.length === 0) {
    const mockModels: Model[] = [
      {
        id: 'model_gpt4',
        name: 'GPT-4',
        baseUrl: 'https://api.openai.com/v1',
        modelName: 'gpt-4-turbo',
        apiKey: 'sk-mock-key',
        isActive: true
      },
      {
        id: 'model_claude',
        name: 'Claude 3',
        baseUrl: 'https://api.anthropic.com/v1',
        modelName: 'claude-3-opus-20240229',
        apiKey: 'sk-mock-key',
        isActive: true
      },
      {
        id: 'model_llama',
        name: 'Llama 3',
        baseUrl: 'https://api.example.com/v1',
        modelName: 'llama-3-70b',
        apiKey: 'sk-mock-key',
        isActive: true
      },
      {
        id: 'model_mistral',
        name: 'Mistral',
        baseUrl: 'https://api.mistral.ai/v1',
        modelName: 'mistral-medium',
        apiKey: 'sk-mock-key',
        isActive: false
      }
    ];

    mockModels.forEach(model => {
      DbService.saveModel(model);
    });
  }

  // Create a mock chat if none exist
  const chats = DbService.getChats();
  if (chats.length === 0) {
    const mockChat: Chat = {
      id: 'chat_mock_1',
      title: 'Sample Conversation',
      summary: 'Discussing AI capabilities',
      date: new Date().toLocaleDateString(),
      lastUpdated: Date.now(),
      isStarred: true,
      messages: [
        {
          id: 'msg_1',
          sender: 'user',
          content: 'What are the main differences between the current generation of large language models?',
          timestamp: Date.now() - 3600000
        },
        {
          id: 'msg_2',
          sender: 'assistant',
          content: 'The current generation of large language models (LLMs) differ in several key aspects:\n\n1. Architecture: Different models use variations of transformer architectures with various optimizations.\n\n2. Training data: Models are trained on different datasets, affecting their knowledge and biases.\n\n3. Size: Models range from a few billion to hundreds of billions of parameters, affecting their capabilities.\n\n4. Specialization: Some models are fine-tuned for specific tasks like coding or medical knowledge.\n\n5. Multimodal abilities: Newer models can process images, audio, and even video alongside text.\n\n6. Context window: The amount of text they can process in one go varies significantly between models.\n\n7. Inference speed: Different optimizations lead to varying processing speeds.',
          timestamp: Date.now() - 3500000,
          modelId: 'model_gpt4'
        },
        {
          id: 'msg_3',
          sender: 'assistant',
          content: 'Current large language models (LLMs) differ in several important ways:\n\n• Parameter count: Ranging from smaller models (7B parameters) to much larger ones (70B+)\n• Training methodology: Some use RLHF, others use constitutional AI approaches\n• Multimodal capabilities: Some can process images and text, while others are text-only\n• Specializations: Certain models excel at coding, reasoning, or creative tasks\n• Context length: Can vary from 8K tokens to 100K+ tokens\n• Hardware optimization: Different models are optimized for different hardware\n• Open vs. closed: Some models have open weights and architecture, others are API-only\n• Benchmarks: Performance varies across reasoning, knowledge, safety metrics\n\nThese differences affect how each model performs on various tasks.',
          timestamp: Date.now() - 3400000,
          modelId: 'model_claude'
        }
      ]
    };

    DbService.saveChat(mockChat);
  }
};

// Function to clean mock data
export const cleanMockData = () => {
  localStorage.clear();
};