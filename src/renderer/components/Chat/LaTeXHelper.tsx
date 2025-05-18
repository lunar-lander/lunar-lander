import React, { useState } from 'react';
import styles from './ChatMessage.module.css';

const LaTeXHelper: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.latexHelper}>
      <button 
        className={styles.latexHelperToggle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide LaTeX Help' : 'Show LaTeX Help'}
      </button>
      
      {isExpanded && (
        <div className={styles.latexHelperContent}>
          <h4>Using LaTeX Math in Messages</h4>
          <p>This chat supports rendering of LaTeX mathematical expressions.</p>
          
          <h5>Inline Math</h5>
          <p>For inline formulas (within a line of text), use single dollar signs:</p>
          <pre>The formula is $E = mc^2$ where m is mass.</pre>
          
          <h5>Block Math</h5>
          <p>For larger equations on their own line, use double dollar signs:</p>
          <pre>
{`$$
\\frac{d}{dx}\\left( \\int_{a}^{x} f(u)\\,du\\right)=f(x)
$$`}
          </pre>
          
          <h5>Tips</h5>
          <ul>
            <li>Make sure there's a space after the opening $ for inline math</li>
            <li>Place block math ($$) on its own line for best rendering</li>
            <li>To include backslashes in LaTeX, you may need to use double backslashes</li>
          </ul>
          
          <p>
            <a 
              href="https://katex.org/docs/supported.html" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Full LaTeX Reference
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default LaTeXHelper;