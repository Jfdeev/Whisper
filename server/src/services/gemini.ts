import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

const gemini = new GoogleGenAI({
   apiKey: env.GEMINI_API_KEY,
})

const model = 'gemini-2.5-flash'

export async function transcribeAudio(audioBase64: string, mimeType: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcreva para mim o áudio, sem tirar nada e nem gerar coisas a mais, apenas transcreva de forma clara e objetiva. Na língua Portuguesa Brasil."
          },
          {
            inlineData: {
              mimeType,
              data: audioBase64
            }
          }
        ]
      }
    ]
  });

  if (!response.text) {
    throw new Error("Erro ao transcrever o áudio");
  }

  return response.text;
}

export async function generateEmbeddings(text: string) {
    const response = await gemini.models.embedContent({
        model: 'text-embedding-004',
        contents: [{ text }],
        config: {
            taskType: 'RETRIEVAL_DOCUMENT'
        }
    })

    if(!response.embeddings) {
        throw new Error("Erro ao gerar os embeddings");
    }

    return response.embeddings[0].values;
}

export async function generateAnswer(question: string, transcriptions: string[]) {
  const context = transcriptions.join('\n\n');

  const prompt = `Você é um assistente educacional especializado em explicar conceitos de forma didática e clara.

CONTEXTO DA AULA: ${context}

PERGUNTA DO ALUNO: ${question}

INSTRUÇÕES PARA RESPONDER:

1. ANÁLISE DO CONTEXTO:
   - Identifique o TEMA PRINCIPAL da aula (ex: banco de dados, programação, matemática, etc.)
   - Extraia os CONCEITOS-CHAVE sendo discutidos
   - Identifique se a pergunta é sobre um conceito GERAL ou algo ESPECÍFICO da aula

2. ESTRATÉGIA DE RESPOSTA:

   PARA CONCEITOS GERAIS (ex: "O que é uma tabela?", "Como funciona SQL?"):
   - Responda como um professor experiente
   - Dê uma explicação clara e didática do conceito
   - Use linguagem acessível e exemplos práticos
   - Comece com: "Com base no tema da aula sobre [tema], posso explicar que..."
   - NÃO cite frases específicas da transcrição

   PARA PERGUNTAS ESPECÍFICAS (ex: "O professor mencionou 32 tabelas, por quê?"):
   - Cite o contexto específico: "Durante a aula foi mencionado que..."
   - Explique o contexto e complete com conhecimento educativo

   PARA PERGUNTAS SEM RELAÇÃO:
   - "Esta pergunta não se relaciona com o conteúdo da aula sobre [tema]."

3. ESTILO DA RESPOSTA:
   - Tom educativo, paciente e encorajador
   - Linguagem clara, sem jargões desnecessários
   - Estrutura: Definição → Explicação → Exemplo prático (quando apropriado)
   - Português Brasil coloquial mas profissional
   - Parágrafos normais, sem formatação especial

4. EXEMPLO DE BOA RESPOSTA:
   "Com base no tema da aula sobre banco de dados, posso explicar que uma tabela é uma estrutura fundamental onde organizamos dados relacionados. Pense nela como uma planilha do Excel, onde cada linha representa um registro (como dados de uma pessoa) e cada coluna representa um atributo específico (como nome, idade, email). Na prática, se você tem um sistema de escola, teria uma tabela para alunos, outra para professores e outra para disciplinas, cada uma armazenando informações específicas de sua categoria."

Responda de forma educativa e clara:`.trim();

  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: prompt
      }
    ]
  })

  if(!response.text) {
    throw new Error("Erro ao gerar a resposta");
  }

  return response.text;
}

export async function generateRoomInfo(transcription: string) {
  const prompt = `Com base na transcrição de áudio fornecida, gere um título e descrição para uma sala de estudos/discussão.

TRANSCRIÇÃO: ${transcription.substring(0, 2000)}...

INSTRUÇÕES:
1. Analise o conteúdo e identifique o tema principal
2. Crie um TÍTULO conciso e atrativo (máximo 15 caracteres)
3. Crie uma DESCRIÇÃO informativa (máximo 30 caracteres)
4. Use linguagem acadêmica mas acessível
5. Responda APENAS no formato JSON:

{
  "title": "Título da sala aqui",
  "description": "Descrição da sala aqui"
}

Responda apenas o JSON, sem texto adicional:`.trim();

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: [{ text: prompt }]
    });

    if (!response.text) {
      throw new Error('No response from AI');
    }

    // Limpa a resposta e tenta fazer parse do JSON
    const cleanResponse = response.text.trim().replace(/```json\n?|\n?```/g, '');
    const roomInfo = JSON.parse(cleanResponse);
    
    // Valida se tem os campos necessários
    if (!roomInfo.title || !roomInfo.description) {
      throw new Error('Invalid room info format');
    }

    return {
      title: roomInfo.title.substring(0, 100), // Limita o tamanho
      description: roomInfo.description.substring(0, 300) // Limita o tamanho
    };

  } catch (error) {
    console.error('Error generating room info:', error);
    throw new Error('Failed to generate room info from transcription');
  }
}

export async function generateActivity(roomContext: string) {
  const prompt = `Você é um professor especializado em criar atividades educacionais baseadas no conteúdo das aulas.

CONTEXTO DA AULA: ${roomContext}

TAREFA: Crie uma atividade de múltipla escolha com base no conteúdo fornecido.

INSTRUÇÕES:
1. Analise o conteúdo e identifique os conceitos principais
2. Crie 5 questões de múltipla escolha
3. Cada questão deve ter 4 alternativas (A, B, C, D)
4. Apenas UMA alternativa deve estar correta
5. As questões devem ser variadas: conceituais, práticas e aplicação
6. Use linguagem clara e objetiva
7. Responda APENAS no formato JSON:

{
  "title": "Nome da atividade",
  "description": "Descrição breve da atividade",
  "timeLimit": 15,
  "questions": [
    {
      "id": 1,
      "question": "Texto da pergunta aqui?",
      "alternatives": [
        { "id": "A", "text": "Alternativa A" },
        { "id": "B", "text": "Alternativa B" },
        { "id": "C", "text": "Alternativa C" },
        { "id": "D", "text": "Alternativa D" }
      ],
      "correctAnswer": "A",
      "explanation": "Explicação da resposta correta"
    }
  ]
}

Responda apenas o JSON válido:`.trim();

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: [{ text: prompt }]
    });

    if (!response.text) {
      throw new Error('No response from AI');
    }

    // Limpa a resposta e tenta fazer parse do JSON
    const cleanResponse = response.text.trim().replace(/```json\n?|\n?```/g, '');
    const activity = JSON.parse(cleanResponse);
    
    // Valida se tem os campos necessários
    if (!activity.title || !activity.questions || !Array.isArray(activity.questions)) {
      throw new Error('Invalid activity format');
    }

    return activity;

  } catch (error) {
    console.error('Error generating activity:', error);
    throw new Error('Failed to generate activity from room context');
  }
}
