// Shared helpers for parsing structured (JSON) text returned by the AI proxy.
export const READING_TIMEOUT_MS=600000;

function escapeJsonStringControls(value){
 let out='',inside=false,escaped=false;
 for(const char of value){
  if(escaped){out+=char;escaped=false;continue;}
  if(char==='\\'&&inside){out+=char;escaped=true;continue;}
  if(char==='"'){inside=!inside;out+=char;continue;}
  if(inside&&char==='\n'){out+='\\n';continue;}
  if(inside&&char==='\r'){out+='\\r';continue;}
  if(inside&&char==='\t'){out+='\\t';continue;}
  if(inside&&char.charCodeAt(0)<32){out+='\\u'+char.charCodeAt(0).toString(16).padStart(4,'0');continue;}
  out+=char;
 }
 return out;
}

function parseJsonCandidate(value){
 try{return JSON.parse(value);}catch{}
 const repaired=escapeJsonStringControls(value);
 if(repaired!==value)try{return JSON.parse(repaired);}catch{}
 return null;
}

export function parseStructuredText(text){
 let value=String(text??'').trim();
 // Web text responses may wrap JSON with this transport marker. Strip only
 // the outer marker; keep JSON validation strict and preserve literal text.
 if(value.startsWith('<escape>')){
  value=value.slice('<escape>'.length).trim();
  if(value.endsWith('</escape>'))value=value.slice(0,-'</escape>'.length).trim();
 }
 const direct=parseJsonCandidate(value);if(direct!==null)return direct;
 const match=value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
 if(match){const fenced=parseJsonCandidate(match[1]);if(fenced!==null)return fenced;}
 throw new Error('AI trả kết quả chưa hợp lệ. Hãy thử lại.');
}

