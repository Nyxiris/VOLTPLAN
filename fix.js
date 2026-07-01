const fs = require('fs');
let content = fs.readFileSync('src/components/UI/EquipmentInventoryModal.tsx', 'utf8');
console.log(content.indexOf('paymentMethods'));
