const fs = require('fs');
let content = fs.readFileSync('src/components/UI/EquipmentInventoryModal.tsx', 'utf8');
let lines = content.split('\n');
let idx = lines.findIndex(l => l.includes('text-zinc-400")}>Banque:</span>'));
console.log(lines.slice(idx - 10, idx + 10).join('\n'));
