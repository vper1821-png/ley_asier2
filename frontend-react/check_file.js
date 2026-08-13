process.chdir('C:\\Users\\asier\\Videos\\wenotlock\\frontend-react');
const esbuild = require('esbuild');
const f = require('fs');
const src = f.readFileSync('src/pages/Dashboard.jsx', 'utf-8');
const lines = src.split('\n');

async function main() {
  // Test the full file via transform
  try {
    await esbuild.transform(src, { loader: 'jsx', jsx: 'preserve' });
    console.log('Full file: OK');
  } catch(e) {
    console.log('Full file: FAIL', e.errors[0].text, 'at', e.errors[0].location.line, e.errors[0].location.column);
  }
  
  // Test for HTML comments
  const hc = src.match(/<!--/g);
  console.log('HTML comment opens:', hc ? hc.length : 0);
  const hcc = src.match(/-->/g);
  console.log('HTML comment closes:', hcc ? hcc.length : 0);
  
  // Count backticks (template literals)
  let backtickCount = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '`') backtickCount++;
  }
  console.log('Backtick count:', backtickCount, '(should be even)');
  
  // Also test with the header and footer separately
  // Just the exports/imports
  try {
    await esbuild.transform(lines.slice(0, 27).join('\n'), { loader: 'jsx', jsx: 'preserve' });
    console.log('Header only: OK');
  } catch(e) {
    console.log('Header only: FAIL', e.errors[0].text, JSON.stringify(e.errors[0].location));
  }
}
main();
