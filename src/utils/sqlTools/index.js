function _convertSql(sql, replaceParamMode) { //replaceParamMode '' ? @name
    let ret = {
        orgsql: sql,
        paramNames: [],
        paramAlias: [],
        sql: sql
    };
    let buf = Buffer.from(sql);
    let step = 0; //0 空 1找对应的配对 2 找到: 3找到参数
    let stepChar = '';
    let convert = [];
    let name_array = [];
    let b2 = Buffer.from(':"\'`[]');
    let b3 = Buffer.from(' ,;)\r\n');
    let paramCount = 0;

    function foundParam() {
        paramCount++;
        let buf3 = Buffer.from(name_array);
        let name = buf3.toString();
        let aliasName = name;
        if (ret.paramNames.indexOf(name) >= 0) {
            aliasName = name + paramCount.toString()
        }
        ret.paramNames.push(name);
        ret.paramAlias.push(aliasName);

        let strReplace = '';
        if (replaceParamMode && replaceParamMode == '?') strReplace = '?';
        else if (replaceParamMode && replaceParamMode == '@name') strReplace = '@' + aliasName;
        else if (replaceParamMode && replaceParamMode == '$name') strReplace = '$' + aliasName;
        else if (replaceParamMode && replaceParamMode == '$count') strReplace = '$' + paramCount.toString();
        else if (replaceParamMode && replaceParamMode == ':name') strReplace = ':' + aliasName;
        else strReplace = aliasName;

        let buf4 = Buffer.from(strReplace);
        for (let j = 0; j < buf4.length; j++) convert.push(buf4[j]);
    }
    for (let i = 0; i < buf.length; i++) {
        let b = buf[i];
        if (step == 0) { // :
            if (b == b2[0]) {
                name_array = [];
                step = 2;
            }
            else if ((b == b2[1]) || (b == b2[2]) || (b == b2[3])) { // "'`
                step = 1;
                stepChar = b;
                convert.push(b);
            }
            else if (b == b2[4]) {   // [
                step = 1;
                stepChar = b2[5];
                convert.push(b);
            }
            else {
                convert.push(b);
            }
        }
        else if (step == 1) {
            convert.push(b);
            if (b == stepChar) step = 0;
        }
        else if (step == 2) { //找参数结尾
            if ((name_array.length == 0) && (b == b2[0])) {
                //找到了 ::
                step = 0;
                convert.push(b);
                convert.push(b);
            } else {
                if (b == b3[0] || b == b3[1] || b == b3[2] || b == b3[3] || b == b3[4] || b == b3[5] || b==b2[0]) {
                    foundParam();
                    step = 0;
                    if (b==b2[0]){
                        i=i-1;
                    }else{
                        convert.push(b);
                    }
                } else {
                    name_array.push(b);
                }
            }
        }
    }
    if (step == 2) {
        foundParam();
    }
    let buf2 = Buffer.from(convert);
    ret.sql = buf2.toString();
    return ret;
}

exports.convertSql = function (sql, replaceParamMode, paramValueObj) {
    let ret = _convertSql(sql, replaceParamMode)
    let paramValueArray = [];
    for (let i = 0; i < ret.paramNames.length; i++) {
        const paramName = ret.paramNames[i];
        let value = '';

        value = paramValueObj[paramName];
        if (value == undefined) value = ''; //obj对象里没有此值

        paramValueArray.push(value)
    }
    return {
        sql: ret.sql,
        paramNames:ret.paramAlias,
        paramValues: paramValueArray,
    };
}

exports.getSqlKeyword =function (sql) {
    const regex = /(?:SELECT|UPDATE|INSERT|DELETE)/gi;
    const matches = sql.match(regex);
    if (matches && (matches.length>0)) return matches[0].toUpperCase();
    return ''
}


