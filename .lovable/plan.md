## Permitir upload de qualquer tipo de ficheiro

Atualmente os campos de upload limitam o que podes anexar (`accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"`). Os buckets do backend já aceitam qualquer tipo, portanto a restrição é só no frontend.

Sobre a alternativa do "conversor automático": converter qualquer formato (vídeo, áudio, ficheiros proprietários, etc.) para um formato universal exigia um motor pesado (ffmpeg, LibreOffice headless, etc.) que não corre neste ambiente. Para qualquer pessoa conseguir abrir o ficheiro, a abordagem fiável é manter o formato original — o navegador/SO do destinatário trata da abertura — e garantir que mostramos um botão claro de download/abrir quando não conseguimos pré-visualizar inline.

### O que vai mudar

1. **Remover a restrição `accept`** dos 4 inputs de ficheiro:
   - `src/pages/Chat.tsx` (mensagens diretas)
   - `src/pages/Library.tsx` (biblioteca)
   - `src/pages/CustomQuestionnaires.tsx` (criação de perguntas com anexo)
   - `src/pages/AnswerQuestionnaire.tsx` (já não tem `accept`, mas vou confirmar)

2. **Melhorar o fallback de pré-visualização** em `src/components/InlineFilePreview.tsx`:
   - Para tipos que não são imagem/vídeo/áudio/PDF (ex: .docx, .xlsx, .zip, .txt), mostrar um cartão com nome do ficheiro + tamanho/tipo + botão **"Abrir"** e **"Descarregar"** explícitos, em vez de só um link discreto.
   - Adicionar suporte a pré-visualização inline para `text/plain` e `text/*` simples (mostra as primeiras linhas).

3. **Validação de tamanho** (segurança mínima):
   - Manter um limite razoável no frontend (ex: 50 MB por ficheiro) com aviso amigável caso exceda, para evitar uploads acidentais gigantes. Sem outras restrições de tipo.

4. **Sanitização do nome** já existe (`replace(/[^a-zA-Z0-9._-]/g, '_')`) — mantém-se para evitar erros de "Invalid Key" no Storage.

### Não incluído
- Conversão automática de formatos (não viável no runtime atual sem serviços externos pagos).
- Alterações de schema ou políticas — os buckets já estão configurados como públicos e sem restrição de mime-type.
