// Basic DOM helpers
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

// year
qs('#year').textContent = new Date().getFullYear();

// nav toggle for small screens
function toggleNav(){
  const nav = qs('.nav');
  nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
}
window.toggleNav = toggleNav;

// Load markdown content (simple client-side renderer)
async function loadMarkdown(path){
  const res = await fetch(path);
  if(!res.ok) return '<p>Content not found.</p>';
  const md = await res.text();
  return renderMarkdown(md);
}

// Minimal markdown -> HTML (supports headings, paragraphs, images, links, lists)
function renderMarkdown(md){
  // very small parser for these uses
  let html = md
    .replace(/\r/g,'')
    .split('\n\n')
    .map(block => {
      // heading
      if(/^#{1,6}\s+/.test(block)){
        const m = block.match(/^(#{1,6})\s+(.*)/);
        const lvl = m[1].length;
        return `<h${lvl}>${m[2]}</h${lvl}>`;
      }
      // list
      if(/^\s*[-*]\s+/.test(block)){
        const items = block.split('\n').map(l => l.replace(/^\s*[-*]\s+/, ''));
        return `<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
      }
      // image
      if(/^!\[.*\]\(.*\)$/.test(block.trim())){
        return block.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" style="max-width:100%;border-radius:6px">');
      }
      // link-only paragraph
      block = block.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      return `<p>${block.replace(/\n/g,'<br>')}</p>`;
    })
    .join('');
  return html;
}

// populate about and projects
loadMarkdown('content/about.md').then(html => qs('#about-content').innerHTML = html);
loadMarkdown('content/projects.md').then(md => {
  // assume projects.md lists items separated by --- with optional image line
  const parts = md.split('\n---\n');
  const container = qs('#projects-list');
  container.innerHTML = parts.map(p => {
    // first line maybe image: ![alt](url)
    const imgMatch = p.match(/!\[(.*?)\]\((.*?)\)/);
    const img = imgMatch ? imgMatch[2] : 'https://via.placeholder.com/420x300?text=Project';
    // first heading as title
    const titleMatch = p.match(/#\s*(.*)/);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    // rest as excerpt (strip headings and images)
    const excerpt = p.replace(/#.*\n?/,'').replace(/!\[.*\]\(.*\)/,'').trim();
    return `
      <article class="project-card">
        <img src="${img}" alt="${title}">
        <div class="project-meta">
          <h3>${title}</h3>
          <p>${excerpt}</p>
        </div>
      </article>
    `;
  }).join('');
});

// contact form: open mail client with prefilled mailto
qs('#contact-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = encodeURIComponent(qs('#name').value.trim());
  const email = encodeURIComponent(qs('#email').value.trim());
  const message = encodeURIComponent(qs('#message').value.trim());
  const subject = encodeURIComponent(`Website message from ${name || 'Visitor'}`);
  const body = encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${decodeURIComponent(message)}`);
  // opens user's mail client
  const mailto = `mailto:your-email@example.com?subject=${subject}&body=${body}`;
  window.location.href = mailto;
});
