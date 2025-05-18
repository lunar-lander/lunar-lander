import React from 'react';

/**
 * Component containing sample LaTeX code for testing MathJax rendering
 */
const MathExample: React.FC = () => {
  return (
    <div>
      <h3>Math Rendering Examples</h3>
      
      <h4>Inline Math</h4>
      <p>
        When $a \ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are 
        $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$.
      </p>
      
      <h4>Block Math</h4>
      <p>
        The following is a block equation:
        
        $$
        \begin{aligned}
        \dot{x} &= \sigma(y-x) \\
        \dot{y} &= \rho x - y - xz \\
        \dot{z} &= xy - \beta z
        \end{aligned}
        $$
      </p>
      
      <h4>Complex Formulas</h4>
      <p>
        Maxwell's equations:
        
        $$
        \begin{aligned}
        \nabla \times \vec{E} &= -\frac{\partial \vec{B}}{\partial t} \\
        \nabla \times \vec{B} &= \mu_0 \vec{J} + \mu_0 \varepsilon_0 \frac{\partial \vec{E}}{\partial t} \\
        \nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
        \nabla \cdot \vec{B} &= 0
        \end{aligned}
        $$
      </p>
      
      <h4>Matrix Example</h4>
      <p>
        $$
        \begin{pmatrix}
        a & b \\
        c & d
        \end{pmatrix}
        \begin{pmatrix}
        e & f \\
        g & h
        \end{pmatrix}
        =
        \begin{pmatrix}
        ae + bg & af + bh \\
        ce + dg & cf + dh
        \end{pmatrix}
        $$
      </p>
    </div>
  );
};

export default MathExample;