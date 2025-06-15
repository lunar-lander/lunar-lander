import { DSLConversation } from '../../../shared/types/dsl';
import { DSLParser } from './dslParser';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Platform detection
const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

export class DSLFileManager {
  private static readonly DSL_DIRECTORY = 'dsl-conversations';
  
  static async ensureDirectory(): Promise<void> {
    try {
      if (isCapacitor()) {
        // For Capacitor, create directory in Documents
        try {
          await Filesystem.mkdir({
            path: this.DSL_DIRECTORY,
            directory: Directory.Documents,
            recursive: true
          });
        } catch (error: any) {
          // Directory might already exist, which is fine
          if (!error.message?.includes('already exists')) {
            console.error('Failed to create DSL directory:', error);
          }
        }
      } else {
        // Use Electron's API to ensure directory exists
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('ensure-dsl-directory');
      }
    } catch (error) {
      console.error('Failed to ensure DSL directory:', error);
    }
  }

  static async listFiles(): Promise<string[]> {
    try {
      if (isCapacitor()) {
        // For Capacitor, list files in Documents directory
        await this.ensureDirectory();
        try {
          const result = await Filesystem.readdir({
            path: this.DSL_DIRECTORY,
            directory: Directory.Documents
          });
          return result.files
            .filter(file => file.name.endsWith('.yaml'))
            .map(file => file.name);
        } catch (error: any) {
          // Directory might not exist or be empty
          if (error.message?.includes('does not exist')) {
            return [];
          }
          throw error;
        }
      } else {
        const { ipcRenderer } = window.require('electron');
        return await ipcRenderer.invoke('list-dsl-files');
      }
    } catch (error) {
      console.error('Failed to list DSL files:', error);
      return [];
    }
  }

  static async loadFile(filename: string): Promise<DSLConversation> {
    try {
      if (isCapacitor()) {
        // For Capacitor, read file from Documents directory
        const filePath = `${this.DSL_DIRECTORY}/${filename}`;
        const result = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        return DSLParser.parse(result.data as string);
      } else {
        const { ipcRenderer } = window.require('electron');
        const content = await ipcRenderer.invoke('load-dsl-file', filename);
        return DSLParser.parse(content);
      }
    } catch (error) {
      throw new Error(`Failed to load DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async saveFile(filename: string, dsl: DSLConversation): Promise<void> {
    try {
      const content = DSLParser.stringify(dsl);
      
      // Ensure filename ends with .yaml
      const yamlFilename = filename.endsWith('.yaml') ? filename : `${filename}.yaml`;
      
      if (isCapacitor()) {
        // For Capacitor, write file to Documents directory
        await this.ensureDirectory();
        const filePath = `${this.DSL_DIRECTORY}/${yamlFilename}`;
        await Filesystem.writeFile({
          path: filePath,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } else {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('save-dsl-file', yamlFilename, content);
      }
    } catch (error) {
      throw new Error(`Failed to save DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(filename: string): Promise<void> {
    try {
      if (isCapacitor()) {
        // For Capacitor, delete file from Documents directory
        const filePath = `${this.DSL_DIRECTORY}/${filename}`;
        await Filesystem.deleteFile({
          path: filePath,
          directory: Directory.Documents
        });
      } else {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('delete-dsl-file', filename);
      }
    } catch (error) {
      throw new Error(`Failed to delete DSL file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async exportFile(dsl: DSLConversation): Promise<void> {
    try {
      const content = DSLParser.stringify(dsl);
      
      if (isCapacitor()) {
        // For mobile, save to a standard location and show success message
        const filename = `${dsl.name.replace(/[^a-zA-Z0-9]/g, '_')}.yaml`;
        await this.saveFile(filename, dsl);
        
        // On mobile, we could also use Share API in the future
        console.log(`DSL file exported as ${filename} to Documents/dsl-conversations/`);
      } else {
        const { ipcRenderer } = window.require('electron');
        
        // Open save dialog
        const result = await ipcRenderer.invoke('export-dsl-file', {
          defaultPath: `${dsl.name.replace(/[^a-zA-Z0-9]/g, '_')}.yaml`,
          content: content
        });
        
        if (!result.success && result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      throw new Error(`Failed to export DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async importFile(): Promise<DSLConversation | null> {
    try {
      if (isCapacitor()) {
        // For mobile, we would need to implement file picker or text input
        // For now, return null (feature not available on mobile)
        throw new Error('File import not available on mobile. Use manual text input instead.');
      } else {
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('import-dsl-file');
        
        if (!result.success) {
          if (result.cancelled) {
            return null; // User cancelled
          }
          throw new Error(result.error || 'Import failed');
        }
        
        return DSLParser.parse(result.content);
      }
    } catch (error) {
      throw new Error(`Failed to import DSL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}