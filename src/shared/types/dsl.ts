// DSL types for conversation orchestration

export interface DSLPhase {
  name: string;
  models: string; // "all", "first", "last", "random", "1,3,5", etc.
  context: string; // "user_only", "all_previous", "phase_previous", "custom"
  prompt?: string; // Optional custom prompt for this phase
  roles?: Record<string, string>; // modelIndex -> role assignment
  wait_for_completion?: boolean; // Wait for all models to complete before next phase
  temperature?: number; // Override temperature for this phase
}

export interface DSLConversation {
  name: string;
  description: string;
  version?: string;
  author?: string;
  phases: DSLPhase[];
  global_prompt?: string; // Global system prompt addition
  global_roles?: Record<string, string>; // Default roles for models
}

export interface DSLValidationError {
  field: string;
  message: string;
  phase?: number;
}

export interface DSLExecutionContext {
  currentPhase: number;
  completedPhases: string[];
  phaseResults: Record<string, string[]>; // phase name -> message IDs
}