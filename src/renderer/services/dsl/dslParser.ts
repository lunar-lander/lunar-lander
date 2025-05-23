import * as yaml from 'js-yaml';
import { DSLConversation, DSLValidationError } from '../../../shared/types/dsl';

export class DSLParser {
  static parse(yamlContent: string): DSLConversation {
    try {
      const parsed = yaml.load(yamlContent) as any;
      return this.validateAndTransform(parsed);
    } catch (error) {
      throw new Error(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static stringify(dsl: DSLConversation): string {
    try {
      return yaml.dump(dsl, {
        indent: 2,
        lineWidth: 80,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      throw new Error(`YAML serialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validate(dsl: DSLConversation): DSLValidationError[] {
    const errors: DSLValidationError[] = [];

    // Required fields
    if (!dsl.name || dsl.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!dsl.description || dsl.description.trim() === '') {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    if (!dsl.phases || !Array.isArray(dsl.phases) || dsl.phases.length === 0) {
      errors.push({ field: 'phases', message: 'At least one phase is required' });
      return errors;
    }

    // Validate each phase
    dsl.phases.forEach((phase, index) => {
      if (!phase.name || phase.name.trim() === '') {
        errors.push({ 
          field: 'name', 
          message: 'Phase name is required',
          phase: index
        });
      }

      if (!phase.models || phase.models.trim() === '') {
        errors.push({ 
          field: 'models', 
          message: 'Models specification is required',
          phase: index
        });
      } else {
        // Validate models format
        const validModelSpecs = ['all', 'first', 'last', 'random'];
        const isValidSpec = validModelSpecs.includes(phase.models) || 
                          /^\d+(,\d+)*$/.test(phase.models);
        
        if (!isValidSpec) {
          errors.push({ 
            field: 'models', 
            message: 'Models must be "all", "first", "last", "random", or comma-separated indices (e.g., "1,3,5")',
            phase: index
          });
        }
      }

      if (!phase.context || phase.context.trim() === '') {
        errors.push({ 
          field: 'context', 
          message: 'Context specification is required',
          phase: index
        });
      } else {
        const validContexts = ['user_only', 'all_previous', 'phase_previous'];
        if (!validContexts.includes(phase.context)) {
          errors.push({ 
            field: 'context', 
            message: 'Context must be "user_only", "all_previous", or "phase_previous"',
            phase: index
          });
        }
      }

      if (phase.temperature !== undefined) {
        if (typeof phase.temperature !== 'number' || phase.temperature < 0 || phase.temperature > 2) {
          errors.push({ 
            field: 'temperature', 
            message: 'Temperature must be a number between 0 and 2',
            phase: index
          });
        }
      }
    });

    return errors;
  }

  private static validateAndTransform(parsed: any): DSLConversation {
    const errors = this.validate(parsed);
    if (errors.length > 0) {
      const errorMessages = errors.map(e => 
        e.phase !== undefined 
          ? `Phase ${e.phase + 1} ${e.field}: ${e.message}`
          : `${e.field}: ${e.message}`
      ).join('\n');
      throw new Error(`Validation errors:\n${errorMessages}`);
    }

    return {
      name: parsed.name,
      description: parsed.description,
      version: parsed.version || '1.0',
      author: parsed.author,
      phases: parsed.phases.map((phase: any) => ({
        name: phase.name,
        models: phase.models,
        context: phase.context,
        prompt: phase.prompt,
        roles: phase.roles,
        wait_for_completion: phase.wait_for_completion !== false, // Default to true
        temperature: phase.temperature
      })),
      global_prompt: parsed.global_prompt,
      global_roles: parsed.global_roles
    };
  }

  static getExampleDSL(): DSLConversation {
    return {
      name: "Collaborative Refinement",
      description: "Multi-stage collaboration with refinement and summary",
      version: "1.0",
      author: "Lunar Lander",
      phases: [
        {
          name: "Initial Response",
          models: "all",
          context: "user_only",
          wait_for_completion: true
        },
        {
          name: "Refinement",
          models: "all", 
          context: "all_previous",
          prompt: "Based on the other responses, refine and improve your answer. Consider different perspectives and build upon the collective knowledge.",
          wait_for_completion: true
        },
        {
          name: "Final Summary",
          models: "first",
          context: "all_previous", 
          prompt: "Provide a comprehensive summary that synthesizes all responses and refinements into a final, authoritative answer."
        }
      ]
    };
  }
}