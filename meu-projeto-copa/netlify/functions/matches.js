const https = require('https');

const TEAMS = {
  'Mexico': { name: 'México', flag: '🇲🇽' },
  'South Africa': { name: 'África do Sul', flag: '🇿🇦' },
  'South Korea': { name: 'Coreia do Sul', flag: '🇰🇷' },
  'Czech Republic': { name: 'Rep. Tcheca', flag: '🇨🇿' },
  'Canada': { name: 'Canadá', flag: '🇨🇦' },
  'Bosnia-Herzegovina': { name: 'Bósnia', flag: '🇧🇦' },
  'Italy': { name: 'Itália', flag: '🇮🇹' },
  'USA': { name: 'EUA', flag: '🇺🇸' },
  'United States': { name: 'EUA', flag: '🇺🇸' },
  'Paraguay': { name: 'Paraguai', flag: '🇵🇾' },
  'Australia': { name: 'Austrália', flag: '🇦🇺' },
  'Turkey': { name: 'Turquia', flag: '🇹🇷' },
  'Qatar': { name: 'Qatar', flag: '🇶🇦' },
  'Switzerland': { name: 'Suíça', flag: '🇨🇭' },
  'Brazil': { name: 'Brasil', flag: '🇧🇷' },
  'Morocco': { name: 'Marrocos', flag: '🇲🇦' },
  'Haiti': { name: 'Haiti', flag: '🇭🇹' },
  'Scotland': { name: 'Escócia', flag: '🏴󠁢󠁳󠁣󠁴󠁿' },
  'Argentina': { name: 'Argentina', flag: '🇦🇷' },
  'France': { name: 'França', flag: '🇫🇷' },
  'Germany': { name: 'Alemanha', flag: '🇩🇪' },
  'Spain': { name: 'Espanha', flag: '🇪🇸' },
  'Portugal': { name: 'Portugal', flag: '🇵🇹' },
  'England': { name: 'Inglaterra', flag: '🏴󠁢󠁳󠁥󠁮󠁧󠁿' },
  'Netherlands': { name: 'Holanda', flag: '🇳🇱' },
  'Belgium': { name: 'Bélgica', flag: '🇧🇪' },
  'Croatia': { name: 'Croácia', flag: '🇭🇷' },
  'Serbia': { name: 'Sérvia', flag: '🇷🇸' },
  'Poland': { name: 'Polônia', flag: '🇵🇱' },
  'Denmark': { name: 'Dinamarca', flag: '🇩🇰' },
  'Sweden': { name: 'Suécia', flag: '🇸🇪' },
  'Ukraine': { name: 'Ucrânia', flag: '🇺🇦' },
  'Uruguay': { name: 'Uruguai', flag: '🇺🇾' },
  'Colombia': { name: 'Colômbia', flag: '🇨🇴' },
  'Ecuador': { name: 'Equador', flag: '🇪🇨' },
  'Japan': { name: 'Japão', flag: '🇯🇵' },
  'Iran': { name: 'Irã', flag: '🇮🇷' },
  'Saudi Arabia': { name: 'Arábia Saudita', flag: '🇸🇦' },
  'Senegal': { name: 'Senegal', flag: '🇸🇳' },
  'Ghana': { name: 'Gana', flag: '🇬🇭' },
  'Nigeria': { name: 'Nigéria', flag: '🇳🇬' },
  'Cameroon': { name: 'Camarões', flag: '🇨🇲' },
  'Egypt': { name: 'Egito', flag: '🇪🇬' },
  'Tunisia': { name: 'Tunísia', flag: '🇹🇳' },
  'Algeria': { name: 'Argélia', flag: '🇩🇿' },
  'Ivory Coast': { name: 'Costa do Marfim', flag: '🇨🇮' },
  'Costa Rica': { name: 'Costa Rica', flag: '🇨🇷' },
  'Panama': { name: 'Panamá', flag: '🇵🇦' },
  'Jamaica': { name: 'Jamaica', flag: '🇯🇲' },
  'Slovakia': { name: 'Eslováquia', flag: '🇸🇰' },
  'Austria': { name: 'Áustria', flag: '🇦🇹' },
  'Greece': { name: 'Grécia', flag: '🇬🇷' },
  'Romania': { name: 'Romênia', flag: '🇷🇴' },
  'Hungary': { name: 'Hungria', flag: '🇭🇺' },
  'Albania': { name: 'Albânia', flag: '🇦🇱' },
  'Georgia': { name: 'Geórgia', flag: '🇬🇪' },
  'Wales': { name: 'País de Gales', flag: '🏴󠁢󠁳󠁷󠁬󠁳󠁿' },
  'Indonesia': { name: 'Indonésia', flag: '🇮🇩' },
  'Iraq': { name: 'Iraque', flag: '🇮🇶' },
  'Jordan': { name: 'Jordânia', flag: '🇯🇴' },
  'Norway': { name: 'Noruega', flag: '🇳🇴' },
  'New Zealand': { name: 'Nova Zelândia', flag: '🇳🇿' },
  'Cape Verde': { name: 'Cabo Verde', flag: '🇨🇻' },
  'DR Congo': { name: 'Congo', flag: '🇨🇩' },
  'Uzbekistan': { name: 'Uzbequistão', flag: '🇺🇿' },
  'Curaçao': { name: 'Curaçao', flag: '🇨🇼' },
  'El Salvador': { name: 'El Salvador', flag: '🇸🇻' },
};

function resolveTeam(name) {
  if (TEAMS[name]) return TEAMS[name];
  return { name, flag: '🏳️' };
}

// Usa UTC-3 (Brasília) no servidor Netlify que roda em UTC
function dayLabel(dateStr) {
  const brasilia = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const todayMs = Date.UTC(brasilia.getUTCFullYear(), brasilia.getUTCMonth(), brasilia.getUTCDate());
  const [y, m, d] = dateStr.split('-').map(Number);
  const matchMs = Date.UTC(y, m - 1, d);
  const diff = Math.round((matchMs - todayMs) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'past';
  if (diff < -1) return 'past';
  return 'future';
}

function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

// Converte horário local do jogo para Brasília (UTC-3)
function toBrasilia(timeStr) {
  if (!timeStr) return '? (Brasília)';
  const offsetMatch = timeStr.match(/UTC([+-]\d+)/);
  const offset = offsetMatch ? parseInt(offsetMatch[1]) : -4;
  const timePart = timeStr.split(' ')[0];
  const [h, min] = timePart.split(':').map(Number);
  let utcH = h - offset;
  let brasiliaH = utcH - 3;
  brasiliaH = ((brasiliaH % 24) + 24) % 24;
  const minStr = min > 0 ? `:${String(min).padStart(2, '0')}` : '';
  return `${brasiliaH}h${minStr} (Brasília)`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  return new Promise((resolve) => {
    const options = {
      hostname: 'raw.githubusercontent.com',
      path: '/openfootball/worldcup.json/master/2026/worldcup.json',
      method: 'GET',
      headers: { 'User-Agent': 'Copa2026-App' }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const raw = JSON.parse(body);
          const rawMatches = raw.matches || [];
          const matches = [];
          let id = 1;

          for (const m of rawMatches) {
            const t1 = resolveTeam(m.team1 || '');
            const t2 = resolveTeam(m.team2 || '');
            const dateStr = m.date || '';

            let result = null;
            if (m.score1 !== null && m.score1 !== undefined &&
                m.score2 !== null && m.score2 !== undefined) {
              result = `${m.score1}-${m.score2}`;
            }

            const group = m.group
              ? m.group.replace('Group', 'Grupo')
              : (m.round || 'Copa 2026');

            matches.push({
              id: id++,
              date: fmtDate(dateStr),
              rawDate: dateStr,
              day: dayLabel(dateStr),
              time: toBrasilia(m.time),
              team1: t1.name,
              flag1: t1.flag,
              team2: t2.name,
              flag2: t2.flag,
              group,
              venue: m.ground || '',
              result,
            });
          }

          resolve({
            statusCode: 200,
            headers,
            body: JSON.stringify({ matches })
          });
        } catch (err) {
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao processar dados: ' + err.message })
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: e.message })
      });
    });

    req.end();
  });
};
