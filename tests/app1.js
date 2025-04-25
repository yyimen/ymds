const ymds = require('../')

//注册数据适配器(例子)
ymds.dss.regDbAdapter(ymds.daSample)
//测试一下导出的utils
console.log('md5:',ymds.utils.jsTools.md5str('123'))
ymds.httpServerStart(3500)