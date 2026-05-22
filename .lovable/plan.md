## Adicionar Links de Redes Sociais

### Contexto
Adicionar secção com ícones clicáveis para Instagram, TikTok e Facebook em dois locais:
1. **Landing page (Index.tsx)** — no footer existente, junto ao copyright.
2. **Páginas internas (Layout.tsx)** — criar um footer simples no rodapé do conteúdo principal, com os mesmos ícones.

### Técnico
- Como o projeto usa Lucide React e não tem ícones nativos de redes sociais, os ícones serão SVG inline simples (Instagram, TikTok, Facebook) para manter consistência visual sem adicionar novas dependências.
- Cada ícone é um `<a>` com `target="_blank" rel="noopener noreferrer"` e link placeholder que pode ser atualizado depois.
- No `Layout.tsx`: adicionar `<footer>` ao final do `<main>` com os ícones alinhados à direita ou centrados.
- No `Index.tsx`: expandir o footer existente para incluir os ícones à direita do logo/copyright.

### Ficheiros
- `src/pages/Index.tsx` — atualizar footer
- `src/components/Layout.tsx` — adicionar footer às páginas internas

### Links (placeholders)
- Instagram: `https://instagram.com/prime11.pt` (placeholder)
- TikTok: `https://tiktok.com/@prime11.pt` (placeholder)
- Facebook: `https://facebook.com/prime11.pt` (placeholder)

O utilizador poderá atualizar os URLs reais posteriormente.