const fs = require('fs');
const path = require('path');
function formatYYMMDD(date) {
    const year = (date.getFullYear() - 2020).toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份补零
    const day = date.getDate().toString().padStart(2, '0'); // 日期补零
    return `${year}${month}${day}`;
}
const filename = path.join(__dirname, '../package.json');
const packageJson = require(filename);
console.log('cur version:', packageJson.version)
let oldVerArray = packageJson.version.split('.')
for (let i = 0; i < oldVerArray.length; i++) {
    oldVerArray[i] = parseInt(oldVerArray[i])
}
let newBuild = parseInt(formatYYMMDD(new Date()))
if (newBuild == oldVerArray[2])
    oldVerArray[3]++
else{
    oldVerArray[2] = newBuild
    oldVerArray[3] = 0
}
let s = oldVerArray.join('.')
packageJson.version = s
fs.writeFileSync(filename, JSON.stringify(packageJson, null, 2));
