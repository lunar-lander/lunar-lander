import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const MathTest: React.FC = () => {
  const testContent = `
# Math Rendering Test

## Inline Math Examples

- Einstein's famous equation: $E = mc^2$
- The Pythagorean theorem: $a^2 + b^2 = c^2$
- A quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## Block Math Examples

Here's the Lorenz system:

$$
\\begin{aligned}
\\dot{x} &= \\sigma(y-x) \\\\
\\dot{y} &= \\rho x - y - xz \\\\
\\dot{z} &= xy - \\beta z
\\end{aligned}
$$

And Maxwell's equations:

$$
\\begin{aligned}
\\nabla \\times \\vec{E} &= -\\frac{\\partial \\vec{B}}{\\partial t} \\\\
\\nabla \\times \\vec{B} &= \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t} \\\\
\\nabla \\cdot \\vec{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
\\nabla \\cdot \\vec{B} &= 0
\\end{aligned}
$$

## Matrix Example

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
e & f \\\\
g & h
\\end{pmatrix}
=
\\begin{pmatrix}
ae + bg & af + bh \\\\
ce + dg & cf + dh
\\end{pmatrix}
$$
`;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Math Rendering Test Page</h1>
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f9f9f9'
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {testContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MathTest;