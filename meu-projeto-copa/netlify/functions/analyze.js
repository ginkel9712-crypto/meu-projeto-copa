const https = require('https');

exports.handler = async (event, context) => {
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
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'A chave GEMINI_API_KEY não foi configurada no painel do Netlify.' }) 
      };
    }
    
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

      Você DEVE responder ESTRITAMENTE com um objeto JSON válido. O formato precisa ser exatamente este:
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

    const model = "gemini-1.5-flash";
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.2
      }
    };

    if (!isPost) {
      payload.generationConfig.responseMimeType = "application/json";
    }

    const postData = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1/models/${model}:generateContent?key=${apiKey}`, // Rota atualizada para a estável /v1/
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);

            if (res.statusCode !== 200) {
              resolve({
                statusCode: res.statusCode,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: data.error?.message || 'Erro na API do Gemini.' })
              });
              return;
            }

            const resultText = data.candidates[0].content.parts[0].text;
            resolve({
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ isPost, result: resultText })
            });

          } catch (err) {
            resolve({
              statusCode: 500,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Falha ao processar resposta do servidor de IA.' })
            });
          }
        });
      });

      req.on('error', (e) => {
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: e.message })
        });
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno no servidor build nativo.' })
    };
  }
};
