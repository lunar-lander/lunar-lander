import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Settings.module.css';

const DSL_REFERENCE = `# Conversation DSL Reference

The Conversation DSL (Domain-Specific Language) allows you to create sophisticated multi-LLM orchestrations using simple YAML syntax.

## Basic Structure

\`\`\`yaml
name: "Your Conversation Mode Name"
description: "Brief description of what this mode does"
version: "1.0"  # Optional
author: "Your Name"  # Optional

phases:
  - name: "Phase 1"
    models: "all"
    context: "user_only"
    # ... additional phase options
    
  - name: "Phase 2" 
    models: "first"
    context: "all_previous"
    prompt: "Custom instructions for this phase"
    # ... additional phase options
\`\`\`

## Phase Configuration

### \`models\` (Required)
Specifies which models participate in this phase:
- \`"all"\` - All selected models
- \`"first"\` - Only the first model
- \`"last"\` - Only the last model  
- \`"random"\` - One randomly selected model
- \`"1,3,5"\` - Specific models by index (1-based)

### \`context\` (Required)
Determines what previous messages each model can see:
- \`"user_only"\` - Only user messages, no assistant responses
- \`"all_previous"\` - All messages from all previous phases
- \`"phase_previous"\` - Only messages from the immediately previous phase

### \`prompt\` (Optional)
Custom instructions for this phase. If not provided, uses the original user message.

### \`roles\` (Optional)
Assign specific roles to models for this phase:
\`\`\`yaml
roles:
  "0": "Technical Expert"
  "1": "Creative Writer"
  "2": "Critical Analyst"
\`\`\`

### \`wait_for_completion\` (Optional)
Whether to wait for all models to complete before starting the next phase. Default: \`true\`

### \`temperature\` (Optional)
Override the temperature setting for this phase. Must be between 0 and 2.

## Global Settings

### \`global_prompt\` (Optional)
Additional system prompt text added to all phases:
\`\`\`yaml
global_prompt: "You are participating in a collaborative analysis. Be thorough and consider multiple perspectives."
\`\`\`

### \`global_roles\` (Optional)
Default role assignments for models across all phases:
\`\`\`yaml
global_roles:
  "0": "Primary Analyst"
  "1": "Devil's Advocate"
  "2": "Synthesizer"
\`\`\`

## Example Configurations

### Collaborative Refinement
\`\`\`yaml
name: "Collaborative Refinement"
description: "Multi-stage collaboration with refinement and summary"

phases:
  - name: "Initial Response"
    models: "all"
    context: "user_only"
    
  - name: "Refinement"
    models: "all"
    context: "all_previous"
    prompt: "Refine your answer based on other responses"
    
  - name: "Final Summary"
    models: "first"
    context: "all_previous"
    prompt: "Synthesize all responses into a final answer"
\`\`\`

### Expert Panel
\`\`\`yaml
name: "Expert Panel Discussion"
description: "Different models assume expert roles"

global_roles:
  "0": "Technical Expert"
  "1": "Business Analyst"
  "2": "User Experience Specialist"

phases:
  - name: "Expert Analysis"
    models: "all"
    context: "user_only"
    prompt: "Analyze from your expert perspective"
    
  - name: "Cross-Consultation"
    models: "all"
    context: "all_previous"
    prompt: "Comment on other experts' analyses"
\`\`\`

### Sequential Build
\`\`\`yaml
name: "Sequential Build"
description: "Each model builds on the previous one"

phases:
  - name: "Foundation"
    models: "first"
    context: "user_only"
    
  - name: "Development"
    models: "2"
    context: "all_previous"
    prompt: "Build upon the foundation"
    
  - name: "Refinement"
    models: "last"
    context: "all_previous"
    prompt: "Polish and finalize the response"
\`\`\`

## File Management

- DSL files are saved as YAML (.yaml) files in your user data directory
- Use **Save** to store locally, **Export** to save anywhere, **Import** to load from file
- Files can be shared with other users who can import them
- Invalid DSL syntax will show validation errors when parsing

## Tips

1. **Start Simple**: Begin with basic phases and add complexity gradually
2. **Test Thoroughly**: Try your DSL with different numbers of models
3. **Use Roles**: Role assignments help models understand their purpose
4. **Wait for Completion**: Use \`wait_for_completion: true\` for sequential phases
5. **Custom Prompts**: Tailor prompts for each phase's specific purpose
6. **Share Configurations**: Export successful DSLs to share with others

## Validation

The system validates your DSL and will show specific error messages for:
- Missing required fields
- Invalid model specifications
- Invalid context values
- Invalid temperature ranges
- Syntax errors in YAML
`;

interface DSLReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

const DSLReference: React.FC<DSLReferenceProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
        <div className={styles.modalHeader}>
          <h2>📖 DSL Reference Guide</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close reference"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody} style={{ overflowY: 'auto' }}>
          <ReactMarkdown>{DSL_REFERENCE}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default DSLReference;