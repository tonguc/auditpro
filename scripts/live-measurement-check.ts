import { mkdirSync, writeFileSync } from 'node:fs';
import { POST } from '../app/api/analyze/route';
import { internalAnalysisToken } from '../lib/internal-analysis';
const targets = ['https://example.com/', 'https://www.python.org/', 'https://www.w3.org/'];
async function main() {
  process.env.AUDITPRO_LOG_LEVEL='off';
  mkdirSync('launch-readiness-reports/live', {recursive:true});
  for(const url of targets) {
    const response=await POST(new Request('http://localhost/api/analyze',{method:'POST',headers:{'Content-Type':'application/json','x-auditpro-internal':internalAnalysisToken},body:JSON.stringify({url,pageLimit:1})}));
    const data=await response.json();
    writeFileSync('launch-readiness-reports/live/'+new URL(url).hostname+'.json',JSON.stringify(data,null,2));
    console.log(JSON.stringify({url,status:response.status,checked:data.checked,warnings:data.warnings,error:data.error,notes:Object.fromEntries(Object.entries(data.notes??{}).filter(([id])=>['o1','o5','t1','t2','t5','u33','u37'].includes(id)))}));
  }
}
void main().catch(e=>{console.error(e);process.exitCode=1});
