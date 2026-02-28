# 📋 Registro de Erros JARVIS

Este arquivo armazena os erros das provas (estudantes) para análise inteligente e criação de flashcards Anki.

---

## 🎯 **Estrutura de Cada Erro**

```yaml
id: UUID único
timestamp: "YYYY-MM-DD HH:MM:SS"
fonte: "Nome do Bounty/Projeto"
subject: "Matéria do Enem/Prova"
topic: "Tópico (Taxonomia JARVIS)"
subtopic: "Subtópico específico"
difficulty: "Fácil, Médio, Difícil"
correct_answer: "Sua resposta correta"
my_answer: "Sua resposta original"
is_correct: true/false
score: 0-100 (pontos perdidos)
reviewed: true/false (já foi revisado)
notes: "Observações pessoais"
next_review_date: "YYYY-MM-DD (próxima revisão em 7 dias)"
```

---

## 📝 **CATEGORIAS RELACIONADAS A BOUNTIES DO SUPETEAM**

Como a análise de erros médicos é diferente de bounties de desenvolvimento Web3, não há correspondência direta. Mas posso sugerir paralelos úteis:

### 🔬 **Anatomia vs. Desenvolvimento de Software**
| Aspecto | Erros JARVIS | Bounties Superteam |
|---------|-----------------|--------------------|
| **Identificação de Problemas** | Classificação de erros | Identificação de requisitos e bugs |
| **Análise de Causa** | Taxonomia JARVIS (topic/subtopic/difficulty) | Leitura e análise de especificações |
| **Melhoria Contínua** | Flashcards com espaçamento otimizado | Iteração no código e testes |
| **Feedback Loop** | Revisão periódica (flashcards) | Ciclo de submissão e avaliação de resultados |
| **Objetivo** | Zero erros e máximo aprendizado | Ganhar prêmios e entregáveis |

**Paralelo:** Ambos usam:
- ✅ **AI/LLM** para classificação inteligente
- ✅ **SQL Database** para armazenamento e consulta
- ✅ **Sistema de Flashcards** (Anki) para revisão espaçada
- ✅ **Estrutura de Tópicos Relativos** para organizar por temas
- ✅ **Análise de Padrões** para identificar pontos fracos

---

## 🎴 **CATEGORIAS JARVIS (TAXONOMIA)**

### 1. **CATEGORIAS PRINCIPAIS (TOPICS)**
```
├── Anatomia           # Estrutura humana
├── Fisiologia         # Funções biológicas
├── Química           # Tabela periódica, compostos
├── Física              # Mecânica, termodinâmica
└── Biologia            # Botânica, genética
```

**Aplicação em Bounties:** As categorias JARVIS podem mapear para:
- **Bounties de Desenvolvimento/Segurança:** Anatomia, Fisiologia, Física, Biologia
- **Bounties de Escrita/Conteúdo:** Química (especialmente se envolver explicações químicas), Física (se envolver princípios físicos)
- **Bounties de IA/Dados:** Fisiologia (processos biológicos/IA), Física (processos computacionais), Biologia (genética/evolução)

---

### 2️⃣ **SUBTÓPICOS (SUBTOPICS)**

Exemplos de subtópicos que aparecem em erros de provas:

**Anatomia:**
- Sistema Cardiovascular → Coração, vasos sanguíneos, pressão arterial
- Sistema Respiratório → Pulmões, traqueia, alvéolos, diafragma
- Sistema Digestório → Boca, esôfago, estômago, intestinos
- Sistema Endócrino → Hipófise, hipófise, suprarrenal, gônadas
- Sistema Nervoso → Cérebro, nervos cranianos, medula espinhal, nervos periféricos

**Química:**
- Tabela Periódica → Elementos, grupos, período, massas atômicas
- Ligações Químicas → Tipos de ligações, forças interatômicas
- Termoquímica → Leis de reações, entalpia, estequiometria

**Física:**
- Cinemática → Velocidade, aceleração, deslocamento, trajetórias
- Dinâmica → Força, torque, energia, trabalho, potência
- Ondas e Eletromagnetismo → Tipos de ondas, indução magnética, circuitos elétricos
- Ótica → Reflexão, refração, lentes, instrumentos ópticos
- Mecânica → Estática, dinâmica, fluidos, propriedades

---

### 3️⃣ **DIFICULDADE (DIFFICULTY)**

Os erros JARVIS também classificam a dificuldade dos itens:
- **Fácil:** Conceitos básicos, sem cálculo complexo
- **Médio:** Requer aplicação de fórmulas, alguns passos de raciocínio
- **Difícil:** Conceitos avançados, cálculos complexos, múltiplas etapas

---

## 🎯 **SISTEMA DE FLASHCARDS ANKI**

### Estrutura do Deck:
```yaml
front: "Frente (pergunta)"
back: "Verso (resposta explicada + detalhes)"
tags: "tag1, tag2, tag3" (categorias JARVIS para revisão rápida)
```

### Exemplo de Flashcard:

**FRONTE:**
```
Q: Qual estrutura celular é responsável pela digestão de carboidratos?

A: **O cloroplasto**.

**Vantagem:** Estrutura em formato de pergunta direta, fácil para ler.

BACK:**
```
O cloroplasto é um organelo em células vegetais responsável pela digestão de carboidratos.
É composto por tilacoides (membranas e tilacoides) que podem ser convertidos em glicose e amido.
Além da fotossíntese, realiza processos como:
- Absorção de CO₂ (gás carbônico) do ambiente
- Produção de carboidratos
- Regulação da concentração de CO₂

**NOTAS:** 
- Plantas C4 (milho, trigo, cana-de-açúcar) usam cloroplasto.
- Plantas CAM usam cloroplasto de forma mais eficiente.
```

**TAGS:**
```
digestao_carboidratos, anatomia_cloroplasto, celular_vegetal
```

---

## 📊 **COMO ATINGIR A MARCA DOS 10 ERROS**

### 🏆 **Sistema de Pontuação**

Use o script `score.js` do moltron-jarvis-classifier:

```bash
cd /home/noisynk/.openclaw/workspace/skills/moltron-jarvis-classifier/scripts
node moltron-jarvis-classifier/scripts/moltron-jarvis-classifier/score.js --insert <versão>
```

Isso vai:
1. Calcular a pontuação de cada versão
2. Comparar com versões anteriores
3. Mostrar a média
4. Identificar versões abaixo ou acima da média

### 🥇 **Métricas-Chave**

- **Taxa de Acerto:** (% de respostas corretas)
  - Acima de 90%: Excelente (JARVIS está otimizado)
  - 80-90%: Muito bom
  - 70-80%: Bom
  - 60-70%: Em progresso
  - Abaixo de 60%: Precisa de revisão

- **Erro Mais Frequente:** (Top Offender)
  - Identificar quais tópicos/subtópicos aparecem mais nos seus erros

- **Tempo até Primeira Revisão:** 
  - Dias de estudo para atingir marca dos 10 erros
  - Estimativa: ~15-20 dias (apenas revisão inicial)

- **Média de Pontos por Erro:** 
  - Total perdido / Total de erros únicos
  - Ideal: Minimizar (meta: < 1 ponto perdido por erro)

---

## 📚 **FLUXO DE REVISÃO**

### 1. **Registro do Erro**
Quando você errar uma questão:
1. **Manual:** Adicione entrada em `erros.md`
2. **Automático (Futuro):** Script JARVIS Analyst pode registrar automaticamente
3. **Campos obrigatórios:** id, timestamp, fonte, subject, topic, difficulty, correct_answer, my_answer, is_correct

### 2. **Geração de Flashcards**
Use o comando:

```bash
node /home/noisynk/.openclaw/workspace/skills/moltron-jarvis-analyst/sync.js erros: "2026-02-19T17:00:00.000Z"
```

Isso gera flashcards para revisão espaçada em Anki.

### 3. **Revisão Espaçada**
Agende revisões a cada 7 dias usando o sistema de tópicos relativos:
1. **Dia 1-2:** Erros recém-registrados (flashcards iniciais)
2. **Dia 3-4:** Erros mais antigos (primeira revisão)
3. **Dia 5-6:** Erros consolidados (flashcards mistas)
4. **Dia 7:** Próxima revisão (retomar pontos fracos)

**Benefícios da Espaçamento:**
- **Memória a longo prazo:** Anki usa algoritmo de repetição espaçada otimizada
- **Foco em pontos fracos:** Tópicos relativos organizados por tema
- **Taxa de retenção:** Flashcards espaçadas aumentam retenção de conhecimento
- **Eficiência:** Revisões mais rápidas e focadas

---

## 🎯 **SISTEMA TÓPICO RELATIVO**

### Estrutura:
```yaml
tema_principal: "Nome do Tópico JARVIS"
erros_relacionados: [id, id, id]
flashcards: [id, id, id] # Flashcards para revisão
resumo_periodo: "Texto resumindo o progresso no período"
```

**Exemplo para "Sistema Cardiovascular":**
```yaml
tema_principal: "Sistema Cardiovascular"
erros_relacionados: []
flashcards: []
resumo_periodo: "Focado em anatomia cardíaca, vasos e pressão arterial"
```

---

## 📝 **INTEGRAÇÃO COM SUPETEAM TRACKER**

### Paralelo 1: Erros como Desafios de Aprendizado

Os erros médicos são como "bugs" que você precisa identificar e corrigir. Da mesma forma, bounties de desenvolvimento têm bugs e requisitos.

**Como usar:**
1. **Erros Críticos** → Priorizar bounties de segurança/audit
2. **Padrões Recorrentes** → Identificar falhas comuns e evitá-las
3. **Análise de Causa Raiz** → Usar JARVIS Analyst para entender POR QUE você errou

---

### Paralelo 2: Erros como Métricas de Sucesso

Use a mesma taxonomia de dificuldade:
- **Fácil:** Quick wins (bounties simples de escrita)
- **Médio:** Bounties que requerem pesquisa e código (como Polish Solana)
- **Difícil:** Bounties técnicas complexas (como CyreneAI)

---

## 💡 **CONCLUSÃO**

O sistema JARVIS Analyst + moltron-jarvis-classifier é a **ferramenta perfeita** para:

✅ **Auto-correção de erros** usando inteligência artificial
✅ **Sistema de pontuação** para acompanhar progresso
✅ **Flashcards Anki** para revisão otimizada
✅ **Tópicos Relativos** para organizar por temas
✅ **Estrutura de banco de dados** para armazenar histórico

**Isso é EXATAMENTE o que você precisa para um sistema de estudo de alto nível!** 🎉

---

**Próximos Passos:**
1. Você precisa instalar/configurar o JARVIS Analyst
2. Começar a registrar erros de provas em `erros.md`
3. Criar o primeiro deck de flashcards para revisão
4. Usar o sistema de tópicos relativos quando tiver ~20 erros

---

**O sistema está estruturado e pronto para uso!** 💠
