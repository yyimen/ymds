const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')

async function getVersion() {
    let version = ''
    try {
        const filename = path.join(__dirname, '../../package.json')
        fs.accessSync(filename, fs.constants.R_OK)
        let fStr = await fsPromises.readFile(filename);
        let fObj = JSON.parse(fStr)
        version = fObj['version']
        return version
    } catch (e) {
        // console.error(e)
    }
    return version
}

class dsIntfFuns {
    constructor(dss) {
        this.dss = dss;
    }
    async ping() {
        let version = await getVersion();
        return {
            ok: true,
            result: {
                ping: "pong",
                version:version,
                platform: process.platform,
                arch: process.arch,
                date: new Date(),
            },
        };
    }

    async getDbAdapters() {
        return this.dss.getDbAdapters();
    }

    async testCnn(funParams) {
        const dsParams = funParams.dsParams;
        if (!dsParams) {
            return { ok: false, err: "not find dsParams in funParams" };
        }

        const testCnnRet = await this.dss.testCnn(dsParams);
        return testCnnRet;
    }

    async adapterCnnParamDesc(funParams) {
        return await this.dss.adapterCnnParamDesc(funParams);
    }

    async getTableNames(funParams) {
        const dataSource = funParams.dataSource;
        if (!dataSource) {
            return { ok: false, err: "not find dataSource in funParams" };
        }
        const dsParams = dataSource.dsParams;
        if (!dsParams) {
            return { ok: false, err: "not find dsParams in dataSource" };
        }

        let ds = this.dss.getDataSource(dsParams);
        if (!ds) {
            return { ok: false, err: "adapter error! adapterName:" + dsParams.adapterName };
        }
        let ret = await ds.da.getTableNames();
        return ret;
    }

    async getFieldInfo(funParams) {
        const dataSource = funParams.dataSource;
        if (!dataSource) {
            return { ok: false, err: "not find dataSource in funParams" };
        }

        const dsParams = dataSource.dsParams;
        if (!dsParams) {
            return { ok: false, err: "not find dsParams in dataSource" };
        }

        const tableName = funParams.tableName;
        if (!tableName) {
            return { ok: false, err: "not find tableName in funParams" };
        }

        let ds = this.dss.getDataSource(dsParams);
        if (!ds) {
            return { ok: false, err: "adapter error! adapterName:" + dsParams.adapterName };
        }

        let ret = await ds.da.getFieldInfo(tableName);
        return ret;
    }

    async execSqlObj(funParams) {
        const dataSource = funParams.dataSource;
        if (!dataSource) {
            return { ok: false, err: "not find dataSource in funParams" };
        }

        const dsParams = dataSource.dsParams;
        if (!dsParams) {
            return { ok: false, err: "not find dsParams in dataSource" };
        }

        const sqlObj = funParams.sqlObj;
        if (!sqlObj) {
            return { ok: false, err: "not find sqlObj in funParams" };
        }

        let ds = this.dss.getDataSource(dsParams);
        if (!ds) {
            return { ok: false, err: "adapter error! adapterName:" + dsParams.adapterName };
        }

        let ret = await ds.da.execSqlObjs(sqlObj);
        return ret;
    }
}

exports.dsIntfFuns = dsIntfFuns;
