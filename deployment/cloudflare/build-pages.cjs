// Run from repository root: node deployment/cloudflare/build-pages.cjs
const fs=require('fs'), path=require('path');
const out='dist';
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','study','static','assets','favicon.ico','manifest.json','robots.txt']){
 if(fs.existsSync(name))fs.cpSync(name,path.join(out,name),{recursive:true});
}
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
html=html.replaceAll('/credibility-lab-study/','/');
fs.writeFileSync(path.join(out,'index.html'),html);
const submission=path.join(out,'study','submission.js');
let src=fs.readFileSync(submission,'utf8');
src=src.replace('https://credibility-lab-responses.yqr1113.chatgpt.site/submit','/api/submit');
src=src.replace('Download a backup and return the JSON file to your researcher.','You may download a backup for your own records.');
fs.writeFileSync(submission,src);
// Preserve the existing downloadable activity JSON, add same-origin upload on click.
const js=path.join(out,'static','js','main.e43cab67.js');
let bundle=fs.readFileSync(js,'utf8');
const old='O=()=>(0,en.saveAs)(new Blob([JSON.stringify({application:"Credibility Lab",mode:"local-social-simulation",social:a,training:u},null,2)],{type:"application/json"}),"credibility-lab-social-session.json")';
const replacement='O=()=>{const record={application:"Credibility Lab",mode:"local-social-simulation",social:a,training:u};const participant=a.profile.name.trim();if(/^[A-Za-z0-9_-]{1,32}$/.test(participant)){fetch("/api/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recordType:"training",participant,social:a,training:u})}).then(r=>r.json().then(j=>{if(!r.ok||!j.received)throw Error("Upload failed");alert("Training record received. Receipt: "+j.receipt)})).catch(()=>alert("Automatic upload failed. Please return the downloaded JSON backup to your researcher."))}else alert("Set your display name to your participant code before submitting the training record.");(0,en.saveAs)(new Blob([JSON.stringify(record,null,2)],{type:"application/json"}),"credibility-lab-social-session.json")}';
if(!bundle.includes(old))throw Error('Training export bundle signature changed; stop deployment and inspect');
bundle=bundle.replace(old,replacement);
fs.writeFileSync(js,bundle);
fs.mkdirSync('functions/api',{recursive:true});
for(const file of ['submit.js','export.js'])fs.copyFileSync('deployment/cloudflare/functions/api/'+file,'functions/api/'+file);
console.log('Built Cloudflare Pages static site at dist; Functions are in functions/api.');
