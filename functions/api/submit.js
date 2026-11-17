export async function onRequestPost({ request, env }) {
  const json = (status, body) => new Response(JSON.stringify(body), {status, headers: {'content-type':'application/json;charset=utf-8','cache-control':'no-store'}});
  try {
    if (!env.DB) return json(503, {error:'Database not configured'});
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json(403, {error:'Cross-origin submissions disabled'});
    const raw = await request.text();
    if (raw.length > 131072) return json(413, {error:'Too large'});
    const data = JSON.parse(raw);
    const participant = data?.participant;
    if (typeof participant !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(participant)) return json(400, {error:'Invalid participant code'});
    let kind;
    if (['Pre-test','Post-test'].includes(data.stage) && ['A','B'].includes(data.form) && Array.isArray(data.items)) kind = data.stage + '-' + data.form;
    else if (data.questionnaire && data.answers && typeof data.answers === 'object') kind = 'questionnaire';
    else if (data.recordType === 'training' && data.training && data.social) kind = 'training';
    else return json(400, {error:'Unknown record type'});
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(kind+'\0'+raw));
    const receipt = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
    await env.DB.prepare('INSERT OR IGNORE INTO submissions (receipt,participant,kind,payload) VALUES (?,?,?,?)').bind(receipt,participant,kind,raw).run();
    return json(200, {received:true,receipt});
  } catch(e) {
    return json(400,{error:'Invalid request'});
  }
}
