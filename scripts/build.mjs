import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/src',{recursive:true});
await cp('src/film.js','dist/src/film.js');
await cp('src/app.js','dist/src/app.js');await cp('src/style.css','dist/src/style.css');
await writeFile('dist/index.html',await readFile('index.html'));
console.log('Built standalone game → dist/ (no dependencies)');
