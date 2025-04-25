const ymds = require('../../../')

class daSample {
    constructor(_cnnStr) {
        this.cnnParams = _cnnStr
        console.debug('sample datasource http _cnnStr:', _cnnStr);
    }
    async testCnn() {
        return {
            ok: true,
            result: {
                version: "1.0.0",
                hello: "world",
            },
        }
    }
    async getTableNames() {
        let tables = ['dict'];
        let views = [];
        return {
            ok: true,
            result: {
                tables: tables,
                views: views,
            },
        };
    }

    async getFieldInfo(tableName) {
        console.debug('datasource http getFieldInfo tableName', tableName);
        let result = [
            { "名称": "id", "类型": "INTEGER", "注释": "", },
            { "名称": "key", "类型": "TEXT", "注释": "", },
            { "名称": "v", "类型": "TEXT", "注释": "", },
        ]
        return {
            ok: true,
            result: result
        }
    }
    // 入口
    // let sqlObj = {
    //     sql: 'select * from dict where id <= :id',
    //     params: { id: 13 },
    //     //dynFilter: { s2: '%111', s1: 'aaa' },//动态过滤参数 可选
    //     page: { pageNum: 2, pageSize: 4, },//分页 可选
    //     //sortby: { id: 'desc', t2: 'asc' },
    //     sessions: { cuser: 'yimen' },
    //     limitRow: 5,

    // }

    async execSqlObjs(sqlObjs) {
        console.debug('datasource http getFieldInfo sqlObjs', sqlObjs);
        //出口

        let result = {
            meta: {
                pageMode: true,
                totalCount: 25,
                offset: 0,
                limit: 2,
                thisCount: 2,
            },
            rows: [
                { id: 1, key: "a",v:"hello world" },
                { id: 2, key: "b",v:"123汉字456" }
            ],
            cols: [
                { name: "id", dType: "INTEGER", },
                { name: "key", dType: "TEXT", },
                { name: "v", dType: "TEXT", }
            ],
        }

        return {
            ok: true,
            result: result
        }
    }

    async doEnd() {

    }
}

module.exports = {
    adapterName: "sample",
    iconType: "sample",
    create: function (cnnParams) {
        const da = new daSample(cnnParams);
        return da;
    },

    adapterCnnParamDesc: {
        sampleCnn: { ZH: "例子配置连接参数", datatype: "string", tag: "*", sort: 10 },
    },
};
