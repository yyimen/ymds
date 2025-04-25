const json5 = global.modManager && global.modManager.json5 ? global.modManager.json5 : require("json5");
const utils = require("../utils");
const dsIntf = require("./dsIntf.js");

let idIndex = 0;
class datasource {
    constructor(adapter, cnnStr) {
        idIndex++;
        this.idIndex = idIndex;
        // 处理加密的连接字符串 cnnStr
        if (typeof cnnStr === "string") {
            let decodeStr = utils.encode.DecodeWithBom(cnnStr);
            this.da = adapter.create(decodeStr);
        } else {
            this.da = adapter.create(cnnStr);
        }
    }
}

class classDSS {
    constructor() {
        this.dataSorceMap = new Map();
        this.dbAdapterMap = new Map();
        this.AdapterArray = [];

        // this.regDbAdapter();
        this.dsIntfFuns = new dsIntf.dsIntfFuns(this);
    }

    regDbAdapter(adapterObj) {
        this.dbAdapterMap.set(adapterObj.adapterName, adapterObj);
    }
    
    getDataSource(dsParams) {
        let adapterName = dsParams.adapterName || "";
        let adapter = this.dbAdapterMap.get(adapterName);
        if (!adapter)             return null;
        const idStr = utils.jsTools.md5str(json5.stringify(dsParams));
        let ds = this.dataSorceMap.get(idStr);
        if (ds) return ds;
        ds = new datasource(adapter, dsParams.cnnParamStr);
        ds.idStr = idStr;
        this.dataSorceMap.set(idStr, ds);
        return ds;
    }

    delDataSource(ds) {
        if (!ds) return;
        const idStr = ds.idStr;
        ds.da.doEnd();
        map.delete(idStr);
    }
    async getDbAdapters() {
        let AdapterArray = [];
        for (let [adapterName, adapter] of this.dbAdapterMap) {
            AdapterArray.push({
                adapterName: adapter.adapterName,
                iconType: adapter.iconType,
            });
        }
        return {
            ok: true,
            result: AdapterArray,
        };
    }

    async testCnn(dsParams) {
        let adapterName = dsParams.adapterName || "";
        let adapter = this.dbAdapterMap.get(adapterName);
        if (!adapter) {
            return {
                ok: false,
                err: "not find adapterName:" + adapterName,
            };
        }
        const dataSource = adapter.create(dsParams.cnnParamStr);
        const ret = await dataSource.testCnn();
        dataSource.doEnd();
        return ret;
    }

    async adapterCnnParamDesc(_adapterName) {
        let adapterName = _adapterName || "";
        let adapter = this.dbAdapterMap.get(adapterName);
        if (!adapter) {
            return {
                ok: false,
                err: "not find adapterName:" + adapterName,
            };
        }
        return {
            ok: true,
            result: adapter.adapterCnnParamDesc,
        };
    }
}

let dss = new classDSS();

module.exports.dss = dss;
module.exports.dsIntfFuns = dss.dsIntfFuns;

