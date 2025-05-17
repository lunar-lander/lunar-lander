import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// Model configuration interface
export interface ModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  modelName: string;
  apiKey: string;
  isActive: boolean;
}

// Class to manage model configurations
export class ModelManager {
  private configPath: string;
  private models: ModelConfig[] = [];

  constructor() {
    // Store config in the app's user data directory
    this.configPath = path.join(app.getPath('userData'), 'model-config.json');
    this.loadConfig();
  }

  // Load configuration from file
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawData = fs.readFileSync(this.configPath, 'utf-8');
        this.models = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Failed to load model configuration:', error);
      this.models = [];
    }
  }

  // Save configuration to file
  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.models, null, 2));
    } catch (error) {
      console.error('Failed to save model configuration:', error);
    }
  }

  // Get all models
  getAllModels(): ModelConfig[] {
    return [...this.models];
  }

  // Get active models
  getActiveModels(): ModelConfig[] {
    return this.models.filter(model => model.isActive);
  }

  // Get model by ID
  getModelById(id: string): ModelConfig | undefined {
    return this.models.find(model => model.id === id);
  }

  // Add a new model
  addModel(model: Omit<ModelConfig, 'id'>): ModelConfig {
    const id = Date.now().toString();
    const newModel: ModelConfig = {
      ...model,
      id
    };
    
    this.models.push(newModel);
    this.saveConfig();
    return newModel;
  }

  // Update an existing model
  updateModel(id: string, updates: Partial<Omit<ModelConfig, 'id'>>): ModelConfig | null {
    const index = this.models.findIndex(model => model.id === id);
    if (index === -1) return null;
    
    this.models[index] = {
      ...this.models[index],
      ...updates
    };
    
    this.saveConfig();
    return this.models[index];
  }

  // Delete a model
  deleteModel(id: string): boolean {
    const initialLength = this.models.length;
    this.models = this.models.filter(model => model.id !== id);
    
    if (this.models.length !== initialLength) {
      this.saveConfig();
      return true;
    }
    
    return false;
  }

  // Toggle model activation status
  toggleModelActive(id: string): ModelConfig | null {
    const model = this.getModelById(id);
    if (!model) return null;
    
    return this.updateModel(id, { isActive: !model.isActive });
  }
}

// Export singleton instance
export const modelManager = new ModelManager();