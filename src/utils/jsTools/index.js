const json5 = global.modManager && global.modManager.json5 ? global.modManager.json5 : require("json5");
const crypto = require('crypto');

exports.isObject = function (val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

exports.isArray = function (val) {
    return Array.isArray(val);
};

exports.md5str = function (str) {
    const md5 = crypto.createHash("md5");
    md5.update(str);
    const strRet = md5.digest('hex');
    return strRet
}

exports.fmtJson = function(obj){
    return json5.stringify(obj, { space: '  ', quote: '"' })
}


