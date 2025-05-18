# Math Syntax in Lunar Lander

Lunar Lander supports rendering LaTeX math expressions using KaTeX. You can include mathematical formulas and equations in your chat messages using the following syntax.

## Inline Math

To include math expressions inline with text, surround your LaTeX formula with single dollar signs.

Example: `The formula for the area of a circle is $A = \pi r^2$`

Renders as: The formula for the area of a circle is $A = \pi r^2$

## Block Math (Display Mode)

For larger formulas or equations that should be displayed on their own line, use double dollar signs.

Example:
```
$$
\frac{d}{dx}e^x = e^x
$$
```

Renders as:
$$
\frac{d}{dx}e^x = e^x
$$

## Common Mathematical Expressions

Here are some examples of commonly used mathematical expressions:

### Fractions
`$\frac{numerator}{denominator}$` → $\frac{numerator}{denominator}$

### Subscripts & Superscripts
`$x^2$` → $x^2$
`$y_i$` → $y_i$
`$x^{a+b}$` → $x^{a+b}$

### Square Roots
`$\sqrt{x}$` → $\sqrt{x}$
`$\sqrt[n]{x}$` → $\sqrt[n]{x}$

### Greek Letters
`$\alpha$, $\beta$, $\gamma$, $\Gamma$, $\pi$, $\Pi$` → $\alpha$, $\beta$, $\gamma$, $\Gamma$, $\pi$, $\Pi$

### Sums & Integrals
`$\sum_{i=0}^n i^2$` → $\sum_{i=0}^n i^2$
`$\int_a^b f(x) dx$` → $\int_a^b f(x) dx$

### Matrices
```
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

Renders as:
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

## Tips for Complex Equations

1. For inline math within paragraphs, use simpler formulas to avoid disrupting line spacing.
2. Use display mode (double dollar signs) for complex equations.
3. When typing backslashes, remember that markdown sometimes requires extra escaping, so you might need `\\` for some LaTeX commands.
4. For systems of equations, the `aligned` environment works well:

```
$$
\begin{aligned}
a &= b + c \\
x &= y + z
\end{aligned}
$$
```

## Examples in Chat

You can type mathematical expressions directly in your chat messages. LLMs can also generate mathematical content when prompted correctly. Try asking questions like:

- "Can you explain the quadratic formula with the proper math notation?"
- "Show me Maxwell's equations using LaTeX."
- "Explain the Pythagorean theorem with a formal proof."

## Troubleshooting

If your math expressions aren't rendering correctly:

1. Check that you're using the correct delimiters ($ or $$)
2. Ensure proper LaTeX syntax
3. For complex expressions, use display mode
4. Escape special characters properly