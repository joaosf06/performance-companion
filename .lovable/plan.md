
# Plataforma de Treino Individual — Fase 1

## Visão Geral
Uma plataforma profissional de treino individual que conecta treinadores e jogadores. Design minimalista com paleta preta e vermelha, toda a interface em Português.

---

## 🎨 Design & Identidade Visual
- Tema escuro com fundo preto/cinza muito escuro
- Cor de destaque: vermelho para botões, badges e elementos interativos
- Tipografia limpa e moderna
- Layout espaçoso e profissional — sem ruído visual

---

## Fase 1 — Funcionalidades Principais

### 1. Sistema de Autenticação
- Login e registo com email + password
- Dois tipos de conta: **Jogador** e **Treinador**
- Após login, redirecionamento automático para o dashboard correto
- Tabela de roles separada para segurança (role-based access control)

### 2. Dashboard do Jogador
Ao entrar, o jogador vê:
- **Próximo treino** agendado
- **Último relatório** recebido (resumo)
- **Questionário pendente** (se existir)
- Cards com visual limpo e informação clara

### 3. Dashboard do Treinador
Ao entrar, o treinador vê:
- **Lista de atletas** associados
- **Alertas** de questionários não respondidos
- Acesso rápido para criar relatórios

### 4. Gestão de Atletas (Treinador)
- Associar jogadores ao treinador
- Ver lista completa de atletas
- Aceder ao perfil individual de cada jogador

### 5. Relatórios de Treino
- Treinador cria relatório para cada jogador com:
  - Objetivo do treino
  - Pontos fortes e a melhorar
  - Nota técnica (1–10) e nota de intensidade (1–10)
  - Observações mentais/comportamentais
- Jogador recebe e consulta relatórios no seu dashboard
- Histórico de relatórios organizado por data

### 6. Questionário Semanal
- Sistema automático: questionário disponível semanalmente
- Campos: Fadiga, Dor muscular, Qualidade do sono, Confiança, Motivação, Minutos jogados (todos 1–10)
- Dados guardados na base de dados
- Treinador vê respostas no perfil do atleta

---

## Fora desta fase (para iterações futuras)
- Chat privado jogador ↔ treinador
- Exportação de relatórios em PDF
- Gráficos de evolução estatística
- Notificações push
- Painel de administrador
