const fs = require('fs')
const fsPromises = fs.promises;
const path = require('path');
const { exit } = require('process');
let zlib = require('zlib');

function getFullDirSync(basePath) {
    let ret = { basePath: basePath, files: [], paths: [] };
    get('');
    function get(relativePath) {
        let fullPath = path.join(basePath, relativePath);
        let files = fs.readdirSync(fullPath);
        let dirs = []
        for (let i = 0; i < files.length; i++) {
            let fullFilename = path.join(fullPath, files[i]);
            let stats = fs.statSync(fullFilename);
            if (stats.isFile()) {
                ret.files.push(relativePath + '/' + files[i]);
            }
            else if (stats.isDirectory()) {
                dirs.push(files[i])
            }
        }
        for (let i = 0; i < dirs.length; i++) {
            let thisPath = relativePath + '/' + dirs[i];
            ret.paths.push(thisPath);
            get(thisPath);
        }
    }
    return ret;
}

function mkdirp(dir) {
    if (fs.existsSync(dir)) return true;

    let list = [];
    let thisDir = dir;
    while (true) {
        let pathinfo = path.parse(thisDir);
        list.push(pathinfo.base);
        thisDir = pathinfo.dir;
        if (fs.existsSync(thisDir)) break;
        if (pathinfo.dir == pathinfo.root) break;
    }
    for (let i = list.length - 1; i >= 0; i--) {
        thisDir = thisDir + path.sep + list[i];
        fs.mkdirSync(thisDir);
    }
    return fs.existsSync(dir);
}
//打包
exports.ymZlibPack = async function (sourecDir, outFilename, exts) {
    let stats = fs.statSync(sourecDir);

    if (!stats.isDirectory) { //目录
        console.error('只能压缩一个目录')
        exit;
    }
    let ret = getFullDirSync(sourecDir)
    let files = ret.files;

    let packInfo = { files: [] }
    let zipFullBuf = Buffer.alloc(0);
    let offset = 0
    for (let i = 0; i < files.length; i++) {
        if (exts && exts != '') {
            let ext = path.extname(files[i])
            if (exts.indexOf(ext) < 0) {
                console.warn('跳过文件', files[i])
                continue
            }
        }
        let fileInfo = {}
        fileInfo.name = files[i]
        let fullFilename = path.join(sourecDir, fileInfo.name)
        let fsStat = await fsPromises.stat(fullFilename)
        fileInfo.size = fsStat.size
        let fileBuf = fs.readFileSync(fullFilename)
        let zipBuf = zlib.gzipSync(fileBuf)

        zipFullBuf = Buffer.concat([zipFullBuf, zipBuf])
        fileInfo.offset = offset
        fileInfo.zsize = zipBuf.length
        offset += zipBuf.length
        packInfo.files.push(fileInfo)
    }
    let packInfoStr = JSON.stringify(packInfo)
    let packInfoBuf = new Buffer.from(packInfoStr)
    let outFull
    if (path.isAbsolute(outFilename)) {
        outFull = outFilename
    } else {
        outFull = path.resolve(process.cwd(), outFilename)
        //outFull = path.resolve(__dirname, outFilename)
    }

    if (fs.existsSync(outFull)) {
        fs.unlinkSync(outFull)
    }
    let outFileHeadBuf = new Buffer.from('ymgzipv1        ')
    outFileHeadBuf.offset = 8
    outFileHeadBuf.writeInt32LE(packInfoBuf.length, 8)
    outFileHeadBuf.writeInt32LE(0, 12)


    let filehandle = await fsPromises.open(outFull, 'a')
    await fsPromises.appendFile(filehandle, outFileHeadBuf)
    await fsPromises.appendFile(filehandle, packInfoBuf)
    await fsPromises.appendFile(filehandle, zipFullBuf)
    await filehandle.close()
}

exports.ymUnzlibPack = async function (zlibPackFile, outDir) {
    try {
        let source = path.isAbsolute(zlibPackFile) ? zlibPackFile : path.resolve(process.cwd(), zlibPackFile)
        let targetDir = path.isAbsolute(outDir) ? outDir : path.resolve(process.cwd(), outDir)

        if (!fs.existsSync(source))
            return new Error('file not find ' + source);

        let sourceBuf = await fsPromises.readFile(source)

        let fileHead = sourceBuf.toString('utf-8', 0, 8)
        if (fileHead != 'ymgzipv1')
            return new Error('file format error ' + source);;

        let jsonLen = sourceBuf.readInt32LE(8)
        let jsonStr = sourceBuf.toString('utf-8', 16, 16 + jsonLen)
        let packInfo = JSON.parse(jsonStr)

        if (!mkdirp(targetDir))
            return new Error('创建目录失败:' + targetDir);

        let offsetHead = 16 + jsonLen
        for (let i = 0; i < packInfo.files.length; i++) {
            let file = packInfo.files[i];
            let targetFilename = path.resolve(targetDir, '.' + file.name)
            let targetDir2 = path.dirname(targetFilename)
            if (!mkdirp(targetDir2))
                return new Error('创建目录失败:' + targetDir);

            const zBuf = sourceBuf.subarray(offsetHead + file.offset, offsetHead + file.offset + file.zsize)
            let fileBuf = zlib.unzipSync(zBuf)
            if (fileBuf.length != file.size)
                return new Error('文件解压失败:' + file.name);

            await fsPromises.writeFile(targetFilename, fileBuf)
        }
        return new Error('ok');
    } catch (err) {
        return err;
    }
}

