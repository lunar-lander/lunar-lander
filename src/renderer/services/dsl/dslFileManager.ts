import { DSLConversation } from '../../../shared/types/dsl';
import { DSLParser } from './dslParser';

export class DSLFileManager {
  private static readonly DSL_DIRECTORY = 'dsl-conversations';
  
  static async ensureDirectory(): Promise<void> {
    try {
      // Use Electron's API to ensure directory exists
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('ensure-dsl-directory');
    } catch (error) {
      console.error('Failed to ensure DSL directory:', error);
    }
  }

  static async listFiles(): Promise<string[]> {
    try {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('list-dsl-files');
    } catch (error) {
      console.error('Failed to list DSL files:', error);
      return [];
    }
  }

  static async loadFile(filename: string): Promise<DSLConversation> {
    try {
      const { ipcRenderer } = window.require('electron');
      const content = await ipcRenderer.invoke('load-dsl-file', filename);
      return DSLParser.parse(content);
    } catch (error) {
      throw new Error(`Failed to load DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async saveFile(filename: string, dsl: DSLConversation): Promise<void> {
    try {
      const { ipcRenderer } = window.require('electron');
      const content = DSLParser.stringify(dsl);
      
      // Ensure filename ends with .yaml
      const yamlFilename = filename.endsWith('.yaml') ? filename : `${filename}.yaml`;
      
      await ipcRenderer.invoke('save-dsl-file', yamlFilename, content);
    } catch (error) {
      throw new Error(`Failed to save DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(filename: string): Promise<void> {
    try {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('delete-dsl-file', filename);
    } catch (error) {
      throw new Error(`Failed to delete DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async exportFile(dsl: DSLConversation): Promise<void> {
    try {
      const { ipcRenderer } = window.require('electron');
      const content = DSLParser.stringify(dsl);
      
      // Open save dialog
      const result = await ipcRenderer.invoke('export-dsl-file', {
        defaultPath: `${dsl.name.replace(/[^a-zA-Z0-9]/g, '_')}.yaml`,
        content: content
      });
      
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error(`Failed to export DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async importFile(): Promise<DSLConversation | null> {
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('import-dsl-file');
      
      if (!result.success) {
        if (result.cancelled) {
          return null; // User cancelled
        }
        throw new Error(result.error || 'Import failed');
      }
      
      return DSLParser.parse(result.content);
    } catch (error) {
      throw new Error(`Failed to import DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}