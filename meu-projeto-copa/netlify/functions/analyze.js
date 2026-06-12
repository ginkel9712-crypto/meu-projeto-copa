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
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'A variável ANTHROPIC_API_KEY não foi encontrada no ambiente do Netlify.' })
      };
    }

    const systemPrompt = `Você é um Analista de Apostas Esportivas Sênior e Cientista de Dados de Futebol. Seu foco é tático e estatístico.`;

    let userPrompt = '';
    if (isPost) {
      userPrompt = `Gere uma análise pós-jogo curta (3 linhas) para a partida de ${match.date} entre ${match.team1} e ${match.team2}. Placar: ${match.result}.`;
    } else {
      userPrompt = `Analise taticamente a partida da Copa 2026: Seleção 1: ${match.team1}, Seleção 2: ${match.team2}. Responda APENAS com um objeto JSON válido (sem blocos markdown), seguindo este modelo:\n{"vencedor_provavel": "Nome", "confianca_vencedor": "Alta", "placar_provavel": "1-0", "xg_estimado": "1.2 vs 0.8", "ambos_marcam": "Não", "confianca_ambos": "Média", "mais_menos_2_5": "Menos", "confianca_gols": "Alta", "dica_ouro": {"mercado": "X", "justificativa": "Y"}, "analise": "Texto"}`;
    }

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    };

    const postData = JSON.stringify(payload);

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
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
                body: JSON.stringify({ error: data.error?.message || 'Erro na API Anthropic.' })
              });
              return;
            }

            let resultText = data.content[0].text;

            // Limpa blocos markdown caso venham
            if (resultText.includes('```json')) {
              resultText = resultText.split('```json')[1].split('```')[0].trim();
            } else if (resultText.includes('```')) {
              resultText = resultText.split('```')[1].split('```')[0].trim();
            }

            resolve({
              statusCode: 200,
              headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPost, result: resultText })
            });

          } catch (err) {
            resolve({
              statusCode: 500,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Erro ao processar JSON de retorno.' })
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
      body: JSON.stringify({ error: 'Falha crítica na execução.' })
    };
  }
};
