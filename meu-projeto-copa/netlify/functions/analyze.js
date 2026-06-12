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
    const apiKey = process.env.OPENAI_API_KEY; 
    
    const systemPrompt = `Você é um Analista de Apostas Esportivas Sênior e Cientista de Dados de Futebol com mais de 15 anos de experiência e taxa de acerto auditada superior a 90% no mercado asiático.
    Seu foco é puramente matemático, tático e frio. Você desconsidera favoritismos históricos vazios e foca em:
    1. Projeção de xG (Expected Goals) baseado no estilo de jogo.
    2. Encaixe Tático.
    3. Fatores de Desgaste Logístico na Copa de 2026.
    4. Linhas de Valor Justo (Value Bets).`;

    let userPrompt = "";

    if (isPost) {
      userPrompt = `Gere uma análise crítica pós-jogo curta e cirúrgica para a partida realizada em ${match.date} no estádio/cidade ${match.venue} entre ${match.team1} e ${match.team2}, que terminou com o placar de ${match.result}. Foque no porquê o resultado aconteceu taticamente em 3 linhas.`;
    } else {
      userPrompt = `Analise taticamente a partida que vai acontecer pela Fase de Grupos da Copa de 2026:
      - Seleção 1: ${match.team1}
      - Seleção 2: ${match.team2}
      - Sede/Clima: ${match.venue}
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
          "mercado": "Ex: Handicap Asiático +0.5 Itália",
          "justificativa": "Frase curta de valor tático."
        },
        "analise": "Seu parecer técnico de até 4 linhas."
      }`;
    }

    // Trocado Axios por Fetch Nativo (Zero dependências para o Netlify quebrar)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error?.message || 'Erro na comunicação com a API de IA.' })
      };
    }

    const resultText = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isPost, result: resultText })
    };

  } catch (error) {
    console.error("Erro na Serverless Function:", error.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno ao computar probabilidades estatísticas.' })
    };
  }
};
