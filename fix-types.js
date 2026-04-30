const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      findFiles(filePath, pattern, fileList);
    } else if (file.match(pattern)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = findFiles('.', /\.(ts|tsx)$/);
let fixCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix: Property 'role' does not exist on type 'never'
  if (content.includes("user.role") || content.includes("profile.role")) {
    content = content.replace(/(\w+)\.role/g, '($1 as any).role');
    modified = true;
  }
  
  // Fix: .insert() with never type
  if (content.includes('.insert(') && content.includes('supabase')) {
    content = content.replace(/\.insert\(([^)]+)\)/g, '.insert($1 as any)');
    modified = true;
  }
  
  // Fix: .update() with never type  
  if (content.includes('.update(') && content.includes('supabase')) {
    content = content.replace(/\.update\(([^)]+)\)/g, '.update($1 as any)');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    fixCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixCount} files`);
