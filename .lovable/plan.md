## Sistema de Marcações de Treino

Calendário onde atletas (já associados a um treinador) marcam treinos em horários definidos pelo treinador. Slots ficam ocupados à medida que outros atletas marcam.

### Fluxo Treinador
- Nova página **"Marcações"** no menu lateral
- Aba **Horário Semanal**: definir blocos recorrentes por dia da semana (ex: Seg 18:00, duração 60min, capacidade 4 atletas)
- Aba **Datas Específicas**: adicionar slots pontuais (data + hora) ou bloquear datas (férias, feriados)
- Aba **Reservas**: ver lista de marcações futuras, com atletas inscritos por slot, e cancelar se necessário
- Definição global: **antecedência mínima de cancelamento** (horas) — por defeito 24h

### Fluxo Atleta
- Novo card no Dashboard "Marcar Treino" → leva à página **"Marcações"**
- Calendário mensal mostrando dias com slots disponíveis
- Ao clicar num dia: lista de horários do dia com `X/Y vagas` e botão **Reservar** (desativado se cheio)
- Secção **"As Minhas Marcações"**: próximos treinos marcados com botão **Cancelar** (só visível se faltar mais do que a antecedência mínima)
- Tudo em tempo real: quando outro atleta marca, a vaga atualiza-se automaticamente (Supabase Realtime)

### Estrutura de Dados (técnico)

```text
coach_schedule_settings
  coach_id (PK), min_cancel_hours (default 24)

coach_recurring_slots          (blocos semanais)
  id, coach_id, weekday (0-6), start_time, duration_minutes, capacity, active

coach_date_slots               (slots pontuais OU bloqueios)
  id, coach_id, date, start_time, duration_minutes, capacity,
  is_blocked (bool, bloqueia data inteira ou slot específico)

bookings
  id, coach_id, athlete_id, slot_date, start_time, duration_minutes,
  source ('recurring'|'date'), source_id, created_at
  UNIQUE (athlete_id, slot_date, start_time)
```

Vagas disponíveis = `capacity − count(bookings desse slot)`, calculado em query/view. Reservas só permitidas para datas futuras e se atleta estiver em `coach_athletes`.

### RLS
- Treinador faz CRUD nas suas configurações/slots, vê reservas dos seus atletas
- Atleta lê slots/reservas do seu treinador (via `is_coach_of_athlete`), insere/apaga as suas próprias reservas
- Realtime ativo em `bookings` para atualização ao vivo

### UI
- Calendário: shadcn `Calendar` com marcadores nos dias com vagas
- Cards de slots com badge de vagas (verde/amarelo/cinza-cheio)
- Mantém tema escuro + acentos vermelhos do projeto

### Fora do âmbito
- Pagamentos, notificações por email/push, integração com Google Calendar, reagendamento (cancelar + voltar a marcar funciona)
