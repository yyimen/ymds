const json5 = global.modManager && global.modManager.json5 ? global.modManager.json5 : require("json5");
const dss = require('../dbSources').dss;

async function expressHttpHandle(req, res, next) {
    try {
        if (!req.body) return res.json({ ok: false, msg: 'not find json param in body' })
        const body = req.body;
        if (!('fun' in body)) return res.json({ ok: false, msg: 'not find fun param in body' })
        const fun = body.fun;
        const funParams = body.funParams;
        console.debug('收到请求 fun', fun);
        if (!(fun in dss.dsIntfFuns)) return res.json({ ok: false, msg: 'not find function:' + fun })

        const ret = await dss.dsIntfFuns[fun](funParams)
        if (body.debug) {
            ret.debug = {
                req: {
                    fun: fun,
                    funParams: funParams
                }
            }
        }

        let resStr;
        if (body.json5) {
            res.set('Content-Type', 'application/json5');
            resStr = json5.stringify(ret);
        } else {
            res.set('Content-Type', 'application/json');
            resStr = JSON.stringify(ret);
        }
        let buf = Buffer.from(resStr);
        console.debug('响应 ', fun, '响应长度:', buf.length);
        res.send(buf);
        //return res.json(ret)
        return;
    } catch (err) {
        next(err);
    }
}

function httpHandle2(req, res, next) {
    res.send('pong2')
}
module.exports.expressHttpHandle = expressHttpHandle;