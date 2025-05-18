import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../../shared/types/chat';
import ChatMessage from '../components/Chat/ChatMessage';

const TestLaTeXMessage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'test-1',
      sender: 'assistant',
      content: `# LaTeX Rendering Test

## Inline Math Example
When $a \\ne 0$, there are two solutions to the equation $ax^2 + bx + c = 0$ and they are given by 
the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$

## Block Math Example

$$
\\begin{aligned}
\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} & = \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
\\nabla \\cdot \\vec{\\mathbf{E}} & = 4 \\pi \\rho \\\\
\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} & = \\vec{\\mathbf{0}} \\\\
\\nabla \\cdot \\vec{\\mathbf{B}} & = 0
\\end{aligned}
$$

## Testing LLM Formatting Issues

This is how LaTeX often comes from an LLM with escaped backslashes:
$\\\\sqrt{x^2 + y^2}$ should render as $\\sqrt{x^2 + y^2}$

And sometimes with no space after the dollar sign:
$x^2$ should be the same as $ x^2 $

## Matrix Example

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
$$
      `,
      timestamp: Date.now(),
      modelId: 'test-model'
    }
  ]);

  const handleAddMessage = () => {
    if (input.trim() === '') return;
    
    setMessages([...messages, {
      id: `test-${messages.length + 1}`,
      sender: 'assistant',
      content: input,
      timestamp: Date.now(),
      modelId: 'test-model'
    }]);
    
    setInput('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>LaTeX Rendering Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '100%', height: '150px', padding: '10px' }}
          placeholder="Enter LaTeX content to test..."
        />
        <button 
          onClick={handleAddMessage}
          style={{ padding: '8px 16px', marginTop: '10px' }}
        >
          Add Test Message
        </button>
      </div>
      
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
        {messages.map(message => (
          <ChatMessage 
            key={message.id}
            message={message}
            modelName="Test Model"
          />
        ))}
      </div>
    </div>
  );
};

export default TestLaTeXMessage;