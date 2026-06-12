const axios = require('axios');

exports.handler = async (event, context) => {
  // Ajuste de Headers de CORS para evitar travamentos locais
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  try {
    const { match } = JSON.parse(event.body);

    if (!match) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Partida não informada.' }) };
    }

    const isPost = match.result !== null;

    // Chave de API - Lembre-se de configurar nas variáveis de ambiente da Netlify (OPENAI_API_KEY ou a que usar)
    const apiKey = process.env.OPENAI_API_KEY; 
    
    // Engenharia de Prompt Sênior para Garantia de Rigor Estatístico
    const systemPrompt = `Você é um Analista de Apostas Esportivas Sênior e Cientista de Dados de Futebol com mais de 15 anos de experiência e taxa de acerto auditada superior a 90% no mercado asiático.
    Seu foco é puramente matemático, tático e frio. Você desconsidera favoritismos históricos vazios e foca em:
    1. Projeção de xG (Expected Goals) baseado no estilo de jogo.
    2. Encaixe Tático (Ex: Se um time joga em bloco baixo reativo contra um time de posse lenta).
    3. Fatores de Desgaste Logístico na Copa de 2026 (Grandes viagens entre EUA, Canadá e México, climas e altitudes como o da Cidade do México).
    4. Linhas de Valor Justo (Value Bets).`;

    let userPrompt = "";

    if (isPost) {
      userPrompt = `Gere uma análise crítica pós-jogo curta e cirúrgica para a partida realizada em ${match.date} no estádio/cidade ${match.venue} entre ${match.team1} e ${match.team2}, que terminou com o placar de ${match.result}. Foque no porquê o resultado aconteceu taticamente em 3 linhas.`;
    } else {
      userPrompt = `Analise taticamente a partida que vai acontecer pela Fase de Grupos da Copa de 2026:
      - Seleção 1: ${match.team1}
      - Seleção 2: ${match.team2}
      - Sede/Clima: ${match.venue} (Considere a logística e fusos horários da Copa de 2026)
      - Grupo: ${match.group}

      Você DEVE responder ESTRITAMENTE com um objeto JSON válido, sem markdown extra fora do bloco JSON. O formato precisa ser exatamente este:
      {
        "vencedor_provavel": "Nome da seleção ou Empate",
        "confianca_vencedor": "Alta, Média ou Baixa",
        "placar_provavel": "X-Y",
        "xg_estimado": "Ex: 1.45 vs 0.82",
        "ambos_marcam": "Sim ou Não",
        "confianca_ambos": "Alta, Média ou Baixa",
        "mais_menos_2_5": "Mais ou Menos",
        "confianca_gols": "Alta, Média ou Baixa",
        "dica_ouro": {
          "mercado": "Ex: Handicap Asiático +0.5 Itália ou Menos de 2.5 Gols",
          "justificativa": "Frase curta de altíssimo valor tático justificando por que essa aposta tem valor matemático."
        },
        "analise": "Seu parecer técnico de até 4 linhas detalhando o encaixe tático, postura esperada das equipes e impacto do local da partida."
      }`;
    }

    // Exemplo usando a API da OpenAI (pode adaptar para o provedor de IA de sua preferência)
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o', // Ou o modelo atual disponível com alta capacidade analítica
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2 // Temperatura baixa força o modelo a ser mais consistente e determinístico (matemático)
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = response.data.choices[0].messages.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isPost, result: resultText })
    };

  } catch (error) {
    console.error("Erro na Serverless Function:", error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno ao computar probabilidades estatísticas.' })
    };
  }
};