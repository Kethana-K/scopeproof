import fs from 'node:fs';
const model=fs.readFileSync('src/model.json','utf8');
const core=fs.readFileSync('src/core.mjs','utf8').replace(/^export /gm,'');
const ui=fs.readFileSync('src/ui.js','utf8');
const template=fs.readFileSync('src/template.html','utf8');
fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/index.html',template.replace('/* APP_CODE */',`const MODEL=${model};\n${core}\n${ui}`));
console.log('Built standalone dist/index.html; no external runtime dependencies.');
