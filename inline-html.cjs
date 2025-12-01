const fs = require('fs');

// Read the Genspark HTML
const html = fs.readFileSync('public/index-genspark-style.html', 'utf8');

// Read the current index.tsx
let indexTsx = fs.readFileSync('src/index.tsx', 'utf8');

// Find and replace the homepage HTML
const startMarker = "app.get('/', (c) => {";
const endMarker = "export default app;";

const startIdx = indexTsx.indexOf(startMarker);
const endIdx = indexTsx.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const newRoute = `app.get('/', (c) => {
  return c.html(\`${html}\`);
});

`;
  
  indexTsx = indexTsx.substring(0, startIdx) + newRoute + indexTsx.substring(endIdx);
  
  fs.writeFileSync('src/index.tsx', indexTsx);
  console.log('✅ Homepage updated with Genspark style!');
} else {
  console.error('❌ Could not find route markers');
}
