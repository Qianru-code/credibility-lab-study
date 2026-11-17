export async function onRequestGet({request,env}) {
  const token = env.ADMIN_TOKEN;
  if (!token || request.headers.get('authorization') !== 'Bearer '+token) return new Response('Unauthorized',{status:401});
  if (!env.DB) return new Response('Database unavailable',{status:503});
  const {results} = await env.DB.prepare('SELECT receipt,participant,kind,payload,created_at FROM submissions ORDER BY created_at').all();
  return new Response(JSON.stringify(results.map(r=>({...r,payload:JSON.parse(r.payload)}))),{headers:{'content-type':'application/json','cache-control':'no-store','content-disposition':'attachment; filename="credibility-lab-responses.json"'}});
}
