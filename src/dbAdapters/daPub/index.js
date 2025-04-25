const utils = require("../../utils");

module.exports = {
    testCnn: async function (da) {
        let ret = await da.getCnn();
        if (!ret.ok) return ret;
        const cnn = ret.result;
        const sql = da.specialSQLs.testCnn;
        ret = await cnn.execSql(sql, {});
        if (!ret.ok) return ret;
        if ("C" in ret.result.rows[0]) return { ok: true, result: ret.result.rows[0].C };
        return {
            ok: true,
            result: ret.result.rows[0].c,
        };
    },

    getTableNames: async function (da, sql, params) {
        let ret = await da.getCnn();
        if (!ret.ok) return ret;
        const cnn = ret.result;

        let tables = [];
        let views = [];

        let sqlObj = {
            sql: sql,
            params: params,
            noLimitRow: true,
        };

        ret = await this.execSqlObj(da, cnn, sqlObj);
        if (ret.ok) {
            let rows = ret.result.rows;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let s类型 = row.类型.toLowerCase();
                if (s类型 == "table") tables.push(row.名称);
                else if (s类型 == "view") views.push(row.名称);
            }
        }
        await cnn.closeCnn();
        return {
            ok: true,
            result: {
                tables: tables,
                views: views,
            },
        };
    },

    getFieldInfo: async function (da, sql, params) {
        let ret = await da.getCnn();
        if (!ret.ok) return ret;
        const cnn = ret.result;
        let sqlObj = {
            sql: sql,
            params: params,
            noLimitRow: true,
        };
        ret = await this.execSqlObj(da, cnn, sqlObj);
        await cnn.closeCnn();
        if (!ret.ok) return ret;
        return {
            ok: true,
            result: ret.result.rows,
        };
    },

    execSqlObjs: async function (da, sqlObjs) {
        let ret = await da.getCnn();
        if (!ret.ok) return ret;
        let cnn = ret.result;
        try {
            //分析是数组,还是单个
            if (sqlObjs.sqlObjs && utils.jsTools.isArray(sqlObjs.sqlObjs)) {
                //数组
                let myRet = [];
                const tranMode = sqlObjs.tran;
                if (tranMode) {
                    ret = await cnn.tranBegin();
                    if (!ret.ok) return ret;
                }
                let objs = sqlObjs.sqlObjs;
                for (let i = 0; i < objs.length; i++) {
                    let obj = objs[i];
                    ret = await this.execSqlObj(da, cnn, obj);
                    if (!ret.ok) {
                        myRet.push({ err: ret.err });
                        if (tranMode) {
                            await cnn.tranRollback();
                            return ret;
                        }
                    } else {
                        myRet.push(ret.result);
                    }
                }
                if (tranMode) {
                    await cnn.tranCommit();
                }

                return {
                    ok: true,
                    result: myRet,
                };
            } else {
                //单个
                let obj = sqlObjs;
                if (sqlObjs.sqlObjs) obj = sqlObjs.sqlObjs;
                ret = await this.execSqlObj(da, cnn, obj);
                return ret;
            }
        } catch (err) {
            console.error("error:", err);
        } finally {
            await cnn.closeCnn();
        }
    },
    //归一化参数 处理sql语句
    processSqlObj(sqlObj) {
        const pageMode = sqlObj.page ? true : false;
        const sortMode = sqlObj.sortby ? true : false;
        const whereMode = sqlObj.dynFilter ? true : false;
        sqlObj.dynWhereStr = "";
        sqlObj.dynOrderByStr = "";
        if (sortMode || whereMode) {
            if (whereMode) {
                let whereStr = "";
                for (let keyName in sqlObj.dynFilter) {
                    let keyValue = sqlObj.dynFilter[keyName];
                    let isLike = false;
                    if (typeof keyValue === "string") {
                        let n = keyValue.indexOf("%");
                        if (n == 0 || n == keyValue.length - 1) isLike = true;
                    }
                    let paramName = "where_" + keyName;

                    let thisWhere = "";
                    if (isLike) thisWhere += `(${keyName} Like :${paramName})`;
                    else thisWhere += `(${keyName} = :${paramName})`;

                    if (whereStr != "") whereStr += " and ";
                    whereStr += thisWhere;
                    sqlObj.params[paramName] = keyValue;
                }
                sqlObj.dynWhereStr = whereStr;
            }
            if (sortMode) {
                let orderStr = "";
                for (let keyName in sqlObj.sortby) {
                    let keyValue = sqlObj.sortby[keyName];
                    if (orderStr != "") orderStr += ",";
                    orderStr += " " + keyName;
                    if (keyValue.toLowerCase() == "desc") orderStr += " desc";
                }
                sqlObj.dynOrderByStr = orderStr;
            }
        }
        if (pageMode) {
            const page = sqlObj.page;
            let page_offset = 0;
            let page_limit = 20;
            if ("pageSize" in page) page_limit = page.pageSize;
            if ("limit" in page) page_limit = page.limit;
            if (page_limit < 1) page_limit = 1;
            if (page_limit > 100) page_limit = 100;
            if ("pageNum" in page) page_offset = (page.pageNum - 1) * page_limit;
            else if ("offset" in page) page_offset = page.offset;
            if (page_offset < 0) page_offset = 0;
            sqlObj.sql = "\r\n" + sqlObj.sql + "\r\n";
            sqlObj.page = {
                page_offset: page_offset,
                page_limit: page_limit,
            };
        }
    },
    execSqlObj: async function (da, cnn, sqlObj) {
        let myRet = {};
        if (sqlObj.debug) myRet.debug = {};

        this.processSqlObj(sqlObj); //归一参数
        da.processSqlObj(cnn, sqlObj); //处理分页

        if (sqlObj.page) {
            if (sqlObj.debug) myRet.debug.sqlCount = sqlObj.pSQL.totalSQL;

            let ret = await cnn.execSql(sqlObj.pSQL.totalSQL, sqlObj.params, myRet.debug);
            if (!ret.ok) return ret;

            let totalCount = 0;
            if (ret.result.rows[0].c) {
                totalCount = ret.result.rows[0].c;
            } else {
                totalCount = ret.result.rows[0].C;
            }
            myRet.meta = {
                pageMode: true,
                totalCount: totalCount,
                offset: sqlObj.page.page_offset,
                limit: sqlObj.page.page_limit,
            };

            if (sqlObj.debug) myRet.debug.sqlPage = sqlObj.pSQL.dataSQL;
            ret = await cnn.execSql(sqlObj.pSQL.dataSQL, sqlObj.params, myRet.debug);
            if (!ret.ok) return ret;
            if (ret.result.info) myRet.info = ret.result.info;
            if (ret.result.rows) {
                myRet.rows = ret.result.rows;
                myRet.meta.thisCount = myRet.rows.length;
            } else {
                myRet.meta.thisCount = 0;
            }
            if (sqlObj.colInfo && ret.result.cols) myRet.cols = ret.result.cols;
        } else {
            //insert into  params 且为数组
            if (sqlObj.pSQL.dataSQL.toLowerCase().indexOf("insert") >= 0 && sqlObj.params && utils.jsTools.isArray(sqlObj.params)) {
                myRet.info = []
                for (let i = 0; i < sqlObj.params.length; i++) {
                    let params = sqlObj.params[i];
                    ret = await cnn.execSql(sqlObj.pSQL.dataSQL, params, myRet.debug);
                    if (!ret.ok) return ret;
                    if (ret.result.info) myRet.info.push(ret.result.info)
                }
            } else {
                ret = await cnn.execSql(sqlObj.pSQL.dataSQL, sqlObj.params, myRet.debug);
                if (!ret.ok) return ret;
                if (ret.result.info) myRet.info = ret.result.info;
                if (ret.result.rows) {
                    myRet.meta = {
                        pageMode: false,
                        totalCount: ret.result.rows.length,
                        offset: 0,
                        thisCount: ret.result.rows.length,
                    };

                    if (!sqlObj.noLimitRow && sqlObj.limitRow && ret.result.rows.length > sqlObj.limitRow) {
                        myRet.rows = ret.result.rows.slice(0, sqlObj.limitRow);
                        myRet.meta.thisCount = myRet.rows.length;
                    } else {
                        myRet.rows = ret.result.rows;
                    }
                } else {
                    myRet.meta = {
                        pageMode: false,
                        totalCount: 0,
                        offset: 0,
                        thisCount: 0,
                    };
                    myRet.rows = [];
                    if (ret.result.info) {
                        // ! fix 不是 select 时的参数 `affectedRows`
                        // dameng, oracle
                        if (!!ret.result.info.rowsAffected) {
                            myRet.meta.affectedRows = ret.result.info.rowsAffected;
                        }
                        // mssql
                        if (!!ret.result.info.rowCount) {
                            myRet.meta.affectedRows = ret.result.info.rowCount;
                        }
                        // mysql
                        if (!!ret.result.info.affectedRows) {
                            myRet.meta.affectedRows = ret.result.info.affectedRows;
                        }
                        // sqlLite
                        if (!!ret.result.info.changes) {
                            myRet.meta.affectedRows = ret.result.info.changes;
                        }
                        // myRet.meta.info = ret.result.info
                    }
                }

                // 只返回一条
                //if ((ret.result.rows) && (ret.result.rows.length>0)) myRet.row = ret.result.rows[0];
            }
            if (sqlObj.colInfo && ret.result.cols) myRet.cols = ret.result.cols;
        }

        return { ok: true, result: myRet };
    },
};
