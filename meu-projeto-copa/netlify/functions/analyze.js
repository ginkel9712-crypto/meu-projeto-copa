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
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Partida não informada.' }) 
      };
    }

    const isPost = match.result !== null;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return { 
        statusCode: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'A variável GEMINI_API_KEY não foi encontrada no ambiente do Netlify.' }) 
      };
    }
    
    const systemPrompt = `Você é um Analista de Apostas Esportivas Sênior e Cientista de Dados de Futebol com mais de 15 anos de experiência no mercado asiático. Seu foco é puramente tático e estatístico.`;

    let userPrompt = "";
    if (isPost) {
      userPrompt = `Gere uma análise pós-jogo curta (3 linhas) para a partida de ${match.date} em ${match.venue} entre ${match.team1} e ${match.team2}. Placar: ${match.result}.`;
    } else {
      userPrompt = `Analise taticamente a partida da Copa 2026: Seleção 1: ${match.team1}, Seleção 2: ${match.team2}, Sede: ${match.venue}, Grupo: ${match.group}. Responda estritamente com um JSON válido seguindo este modelo: {"vencedor_provavel": "Nome", "confianca_vencedor": "Alta", "placar_provavel": "1-0", "xg_estimado": "1.2 vs 0.8", "ambos_marcam": "Não", "confianca_ambos": "Média", "mais_menos_2_5": "Menos", "confianca_gols": "Alta", "dica_ouro": {"mercado": "X", "justificativa": "Y"}, "analise": "Texto"}`;
    }

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

    return new Promise((resolve) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        // A SOLUÇÃO ESTÁ AQUI: Rota alterada para /v1beta/
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
                body: JSON.stringify({ error: data.error?.message || 'Erro de resposta da API Gemini.' })
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
              body: JSON.stringify({ error: 'Erro ao processar objeto JSON de retorno da IA.' })
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
      body: JSON.stringify({ error: 'Falha crítica na execução da função serverless.' })
    };
  }
};
