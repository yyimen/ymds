
const express = global.modManager && global.modManager.express ? global.modManager.express : require("express");
const express_json5 = global.modManager && global.modManager.express_json5 ? global.modManager.express_json5 : require("express-json5");
// const json5 = global.modManager && global.modManager.json5 ? global.modManager.json5 : require("json5");
const expressHttpHandle = require('../httpIntf').expressHttpHandle;


let app;
function httpServerStart(port) {
    app = express()

    app.use(express_json5())
    app.use(express.urlencoded({ extended: false }))

    // 解决跨域问题
    app.all("*", function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');// 设置允许跨域的域名,*代表允许任意域名跨域
        res.header('Access-Control-Allow-Headers', 'content-type');// 允许的header类型
        res.header('Access-Control-Allow-Methods', 'DELETE,PUT,POST,GET,OPTIONS');// 跨域允许的请求方式
        if (req.method.toLowerCase() == 'options') res.send(200); // 让options 尝试请求快速结束
        else next();
    })

    app.get('/', (req, res) => {
        res.send('i am yimen datasource')
    })

    app.get('/ping', (req, res) => {
        res.json({
            ping:'pong',
            req: {
                cnnIP: req.socket.remoteAddress,
                //rawHeaders: req.rawHeaders,
                headers: req.headers,
                body: req.body,
                params: req.params,
                query: req.query,
                url: req.url,
            }
        });
    })

    app.post('/testpost', (req, res) => {
        res.json({
            ping:'pong',
            req: {
                cnnIP: req.socket.remoteAddress,
                //rawHeaders: req.rawHeaders,
                headers: req.headers,
                body: req.body,
                params: req.params,
                query: req.query,
                url: req.url,
            }
        });
    })

    app.post('/api2sql', expressHttpHandle)

    app.listen(port, '0.0.0.0', () => {
        console.debug(`http server app listening on port ${port}`)
    })
}

async function Test() {
    httpServerStart(3000)
}

if (require.main == module) Test();

module.exports.httpServerStart = httpServerStart;
module.exports.app = app