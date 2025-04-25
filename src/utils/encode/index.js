const crypto = require('crypto');

module.exports = {
    desEncrypt: function (message, key) {// DES 加密
        key = key.length >= 8 ? key.slice(0, 8) : key.concat('0'.repeat(8 - key.length))
        const keyHex = Buffer.from(key)
        const cipher = crypto.createCipheriv('des-cbc', keyHex, keyHex)
        let c = cipher.update(message, 'utf8', 'base64')
        c += cipher.final('base64')
        return c
    },

    desDecrypt: function (text, key) {// DES 解密
        key = key.length >= 8 ? key.slice(0, 8) : key.concat('0'.repeat(8 - key.length))
        const keyHex = Buffer.from(key)
        const cipher = crypto.createDecipheriv('des-cbc', keyHex, keyHex)
        let c = cipher.update(text, 'base64', 'utf8')
        c += cipher.final('utf8')
        return c
    },

    ymAesEncode: function (str, keyStr) {
        let key = crypto.createHash('md5').update(keyStr).digest(); //MD5(keyStr) 16 字节作为 key  
        let iv = ''; //ecb 没有 iv

        let cipherChunks = [];
        let cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
        cipher.setAutoPadding(true);
        cipherChunks.push(cipher.update(str, 'utf8', 'base64'));
        cipherChunks.push(cipher.final('base64'));
        return cipherChunks.join('');
    },

    ymAesDecode: function (str, keyStr) {
        let key = crypto.createHash('md5').update(keyStr).digest(); //MD5(keyStr) 16 字节作为 key  ;
        let iv = ''; //ecb 没有 iv

        let cipherChunks = [];
        let decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(str, 'base64', 'utf8'));
        cipherChunks.push(decipher.final('utf8'));
        return cipherChunks.join('');
    },

    Ae1Encode: function (str) {
        return this.ymAesEncode(str, '1232');
    },
    Ae1Decode: function (str) {
        return this.ymAesDecode(str, '1232');
    },

    ymAesEncodeUrl: function (str, keyStr) {
        let key = crypto.createHash('md5').update(keyStr).digest(); //MD5(keyStr) 16 字节作为 key  
        let iv = ''; //ecb 没有 iv

        let cipherChunks = [];
        let cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
        cipher.setAutoPadding(true);
        cipherChunks.push(cipher.update(str, 'utf8', 'base64url'));
        cipherChunks.push(cipher.final('base64url'));
        return cipherChunks.join('');
    },

    ymAesDecodeUrl: function (str, keyStr) {
        let key = crypto.createHash('md5').update(keyStr).digest(); //MD5(keyStr) 16 字节作为 key  ;
        let iv = ''; //ecb 没有 iv

        let cipherChunks = [];
        let decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(str, 'base64url', 'utf8'));
        cipherChunks.push(decipher.final('utf8'));
        return cipherChunks.join('');
    },

    Au1Encode: function (str) {
        return this.ymAesEncodeUrl(str, '1232');
    },
    Au1Decode: function (str) {
        return this.ymAesDecodeUrl(str, '1232');
    },

    Au1EncodeWithBom(str) {
        return 'AU1:' + this.Au1Encode(str);
    },
    Au1DecodeWithBom: function (str) {
        let str2 = str
        if (str.length > 3) {
            let p1 = str.substring(0, 3);
            if (p1 == 'AU1') {
                str2 = str.substring(4, str.length);
            }
        }
        return this.Au1Decode(str2);
    },

    EncodeWithBom: function (str, BomHead) {
        let p1 = BomHead.toUpperCase();
        if (p1 == 'ORG') return 'ORG:' + str;
        if (p1 == 'AU1') return 'AU1:' + this.Au1Encode(str);
        if (p1 == 'AE1') return 'AE1:' + this.Ae1Encode(str);
        return str;
    },

    DecodeWithBom: function (str) {
        if (str.length > 3) {
            let p1 = str.substring(0, 3);
            if (p1 == 'ORG') return str.substring(4, str.length);
            if (p1 == 'AU1') return this.Au1Decode(str.substring(4, str.length));
            if (p1 == 'AE1') return this.Ae1Decode(str.substring(4, str.length));
        }
        return str;
    }
}  