

## Biblioteca de Exercícios integrada com a Biblioteca de Pastas

Vou ligar a biblioteca de pastas existente a uma nova vista dedicada de **Exercícios**, onde cada vídeo/ficheiro da biblioteca passa a ter metadados de exercício (descrição rica, grupo muscular, equipamento, nível, instruções) e fica acessível tanto na navegação por pastas como num catálogo pesquisável.

### O que vais ter

1. **Catálogo de Exercícios** (nova aba dentro da página Biblioteca):
   - Grelha estilo Netflix com thumbnail/vídeo, título, grupo muscular e nível.
   - Pesquisa por nome + filtros (grupo muscular, equipamento, nível, pasta).
   - Clicar abre um modal com vídeo a tocar inline, descrição completa, instruções passo-a-passo e tags.

2. **Pastas da biblioteca como categorias**:
   - Cada exercício pertence a uma pasta (ex: "Força — Membros Inferiores", "Mobilidade", "Aquecimento").
   - Ao entrar numa pasta vês os ficheiros normais **+** os exercícios dessa pasta.
   - Subpastas continuam a funcionar (herança já implementada).

3. **Criação/edição de exercícios pelo treinador**:
   - Botão "Adicionar exercício" dentro de cada pasta.
   - Reaproveita ficheiro já existente na biblioteca **ou** faz upload novo (vídeo/imagem).
   - Campos: nome, descrição, instruções, grupo muscular, equipamento, nível, duração estimada.

4. **Integração com Treinos Complementares**:
   - No builder de treinos (`Workouts.tsx`), o seletor passa a mostrar exercícios estruturados (com thumbnail e grupo muscular) em vez de apenas nomes de ficheiros.
   - Mantém compatibilidade com itens já criados.

### Detalhes técnicos

**Base de dados** (nova migração):
- Nova tabela `exercises`:
  - `id`, `coach_id`, `folder_id` (FK lógica para `library_folders`), `library_file_id` (opcional, FK lógica para `library_files`)
  - `name`, `description`, `instructions` (texto longo)
  - `muscle_group` (text), `equipment` (text), `level` (text: iniciante/intermédio/avançado)
  - `duration_seconds` (int, opcional), `thumbnail_url` (text, opcional)
  - `created_at`, `updated_at`
- Tabela auxiliar `exercise_tags` (`exercise_id`, `tag`) para tags livres pesquisáveis.
- RLS:
  - Treinadores: gerem os próprios exercícios (`coach_id = auth.uid()` + `has_role('coach')`).
  - Atletas: leem exercícios cuja `folder_id` está atribuída via `is_assigned_folder_or_ancestor` (já existe).
- Atualizar `complementary_workout_items` para também aceitar `exercise_id` (opcional, mantém `library_file_id` para compatibilidade).

**Frontend**:
- `src/pages/Library.tsx`: adicionar `Tabs` (`Pastas` | `Exercícios`) no topo. Dentro de uma pasta mostrar secção "Exercícios desta pasta" antes dos ficheiros.
- Novo `src/components/library/ExerciseCard.tsx`: card com thumbnail/preview de vídeo, nome, badges de grupo muscular e nível.
- Novo `src/components/library/ExerciseDialog.tsx`: criação/edição (form) e visualização detalhada (modal com `InlineFilePreview` para o vídeo).
- Novo `src/components/library/ExerciseCatalog.tsx`: grelha global com pesquisa e filtros (lazy-loaded).
- `src/pages/Workouts.tsx`: seletor de exercícios passa a consultar a tabela `exercises` (com fallback aos `library_files` antigos para itens já criados).

**Performance**:
- Lazy-load do catálogo (`React.lazy` + `Suspense`) tal como `QuestionnaireResults`.
- Query única com join para obter exercício + ficheiro + thumbnail.

### Não inclui
- Importação automática de bibliotecas externas de exercícios (podes adicionar manualmente os teus).
- Geração automática de thumbnails a partir de vídeos (usa-se a primeira frame via `<video preload="metadata">` ou imagem dedicada).

