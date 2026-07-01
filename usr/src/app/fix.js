const fs = require('fs');
let content = fs.readFileSync('src/components/UI/EquipmentInventoryModal.tsx', 'utf8');

content = content.replace(/customQuantityOffsets\[([^\]]+)\] !== undefined \? customQuantityOffsets\[([^\]]+)\] : ([a-zA-Z0-9_.]+)\.quantity/g, 'Math.max(0, $3.quantity + (customQuantityOffsets[$1] || 0))');
content = content.replace(/customQuantityOffsets\[([^\]]+)\] !== undefined \? customQuantityOffsets\[([^\]]+)\] : ([a-zA-Z0-9_.]+)\.totalLength/g, 'Math.max(0, $3.totalLength + (customQuantityOffsets[$1] || 0))');

fs.writeFileSync('src/components/UI/EquipmentInventoryModal.tsx', content);
