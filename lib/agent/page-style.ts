/** Shared terminal-style stylesheet for the agent HTML pages (/agent, /agent/mcp). */
export const STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f12; --bg-alt: #111418; --border: #1e2530;
    --cyan: #58d4e8; --amber: #f0a500; --muted: #4a5568;
    --text: #c9d1d9; --text-dim: #6e7681; --link: #58a6ff;
    --font: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
  }
  html { font-size: 14px; }
  body { font-family: var(--font); background: var(--bg); color: var(--text);
         line-height: 1.75; padding: 48px 32px; max-width: 900px; margin: 0 auto; }
  h1, h2, h3, h4 { font-family: var(--font); font-size: 1rem; font-weight: 700; color: #6dd5fa; margin: 2rem 0 .5rem; }
  h1 { color: var(--cyan); font-size: 1.3rem; }
  h1::before { content: '# '; color: var(--muted); }
  h2::before { content: '## '; color: var(--muted); }
  h3::before { content: '### '; color: var(--muted); }
  p { margin: .5rem 0 1rem; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; color: var(--cyan); }
  section { border-top: 1px solid var(--border); padding: 2rem 0 1rem; }
  section:first-of-type { border-top: none; }
  ul, ol { padding-left: 1.6em; margin: .5rem 0 1rem; }
  li { margin-bottom: .3rem; }
  blockquote { border-left: 3px solid var(--amber); padding: .25rem 0 .25rem 1rem; margin: .75rem 0; color: var(--text); }
  blockquote footer { color: var(--text-dim); font-size: .9rem; }
  article { border-left: 3px solid var(--border); padding: .75rem 0 .75rem 1.25rem; margin: 1rem 0; }
  article:hover { border-left-color: var(--cyan); }
  dl { margin: .5rem 0 1rem; }
  dt { color: var(--text-dim); font-size: .85rem; margin-top: .75rem; }
  dd { color: var(--text); padding-left: 1em; }
  code { background: #161b22; color: var(--amber); padding: .1em .35em; border-radius: 3px; font-size: .92em; }
  details { border: 1px solid var(--border); border-radius: 4px; padding: .75rem 1rem; margin: .5rem 0; background: var(--bg-alt); }
  summary { cursor: pointer; color: var(--amber); font-weight: 700; }
`;
