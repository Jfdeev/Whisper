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

export async function chatWithAI(prompt: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [{ text: prompt }]
  });

  if (!response.text) {
    throw new Error('Erro ao gerar resposta do chat');
  }

  return response.text;
}

export async function generateRoomInfo(transcription: string) {
  const { GoogleGenAI } = await import('@google/genai');
  const { env } = await import('../env.ts');
  
  const gemini = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

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
      model: 'gemini-2.5-flash',
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
    
    // Fallback: gera título e descrição básicos
    const words = transcription.split(' ').slice(0, 10);
    const preview = words.join(' ');
    
    return {
      title: `Aula sobre ${preview.substring(0, 50)}...`,
      description: `Sala criada automaticamente com base no conteúdo da aula. Discussão sobre: ${preview.substring(0, 150)}...`
    };
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
      model: 'gemini-2.5-flash',
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
    
    // Fallback: atividade básica
    return {
      title: "Atividade sobre o conteúdo da aula",
      description: "Teste seus conhecimentos sobre os conceitos apresentados",
      timeLimit: 15,
      questions: [
        {
          id: 1,
          question: "Com base no conteúdo apresentado, qual é o conceito principal discutido?",
          alternatives: [
            { id: "A", text: "Conceito relacionado ao tema" },
            { id: "B", text: "Outro conceito importante" },
            { id: "C", text: "Conceito secundário" },
            { id: "D", text: "Conceito não relacionado" }
          ],
          correctAnswer: "A",
          explanation: "Esta é a resposta correta baseada no conteúdo apresentado."
        }
      ]
    };
  }
}

export async function continueTextWithAI(existingText: string) {
  const prompt = `Você é um assistente de escrita inteligente. Continue o texto abaixo de forma natural e coerente.

TEXTO EXISTENTE:
${existingText}

INSTRUÇÕES:
1. Analise o contexto e o tema do texto
2. Continue escrevendo de forma natural, mantendo o mesmo estilo e tom
3. Adicione aproximadamente 2-3 parágrafos de continuação
4. Seja claro, objetivo e relevante ao tema
5. NÃO repita o texto existente
6. NÃO adicione títulos ou formatação especial
7. Responda APENAS o texto de continuação

Continue o texto:`.trim();

  const response = await gemini.models.generateContent({
    model,
    contents: [{ text: prompt }]
  });

  if (!response.text) {
    throw new Error('Erro ao continuar texto');
  }

  return response.text;
}

export async function generateSummary(content: string) {
  const prompt = `Você é um especialista em criar resumos educacionais claros e estruturados.

CONTEÚDO PARA RESUMIR:
${content}

INSTRUÇÕES:
1. Analise todo o conteúdo fornecido
2. Identifique os pontos principais e conceitos-chave
3. Crie um resumo estruturado e organizado
4. Use bullet points para facilitar a leitura
5. Mantenha linguagem clara e objetiva
6. Português Brasil
7. Tamanho: entre 200-400 palavras

Formato esperado:
# Resumo

## Principais Conceitos
- Conceito 1: breve explicação
- Conceito 2: breve explicação

## Pontos Importantes
- Ponto relevante 1
- Ponto relevante 2

## Conclusão
Síntese final do conteúdo

Gere o resumo:`.trim();

  const response = await gemini.models.generateContent({
    model,
    contents: [{ text: prompt }]
  });

  if (!response.text) {
    throw new Error('Erro ao gerar resumo');
  }

  return response.text;
}
