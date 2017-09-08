const express = require('express');
const http = require('http');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path')
const app = express();
var XLSX = require('xlsx');
const stream = require('stream');
app.use(bodyParser.json());

app.use(express.static(__dirname));

/* 上传文件 */

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./Images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});


var upload = multer({ storage: Storage }).array("imgUploader", 100); //Field name and max count


app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/api/Upload", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err)
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
});

/* 下载文件 */

// 显示服务器文件
app.get('/api/files', function (req, res) {
    // 显示服务器文件 
    // 文件目录
    var filePath = path.join(__dirname, './Images');
    fs.readdir(filePath, function (err, results) {
        if (err) throw err;
        if (results.length > 0) {
            var files = [];
            results.forEach(function (file) {
                if (fs.statSync(path.join(filePath, file)).isFile()) {
                    files.push(file);
                }
            })
            res.end(JSON.stringify({ files: files }));
        } else {
            res.end('当前目录下没有文件');
        }
    });
    //res.end("Something went wrong!")
});

// 实现文件下载 
/* app.get('/file/:fileName', function (req, res, next) {    
    var fileName = req.params.fileName;
    var filePath = path.join(__dirname, fileName);
    var stats = fs.statSync(filePath);
    if (stats.isFile()) {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=' + fileName,
            'Content-Length': stats.size
        });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.end(404);
    }
}); */

// 预览excle文件
app.get('/preview', function (req, res, next) {


    // 读取 Excel 文件
    const workbook = XLSX.readFile('./Images/my.xls');
    // 获取 Excel 中所有表名
    const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
    // res.end(JSON.stringify({sheetNames:sheetNames}))
    // 根据表名获取对应某张表  
    const worksheet = workbook.Sheets[sheetNames[0]];
    // 解析 Excel 生成 JSON
    res.end(JSON.stringify({ worksheet: XLSX.utils.sheet_to_html(worksheet) }))
});

// 下载并预览文件
app.get('/priviewAnyshare', function (req, res, next) {
    http.get("http://192.168.138.48:9028/anyshares3accesstestbucket/6F87467F2A0B4CA3B9C5C371F934D580/77FE23F941CD4CEC9238D2455788DB4D-i?response-content-disposition=attachment%3b%20filename%3d%22%25e5%2590%2588%25e5%2590%258c.xls1501212969537%252d311836(1).xls%22%3b%20filename*%3dutf%2d8%27%27%25e5%2590%2588%25e5%2590%258c.xls1501212969537%252d311836(1).xls&x-eoss-length=238592&userid=AKIAI6IFWLK557WYM23A&Expires=1502441958&Signature=ASZ%2fudhLhhoUpB8pzx0qV4o18xI%3d&x-as-userid=a9fe4614-7733-11e7-a804-005056af7c20", (result) => {
        const statusCode = result.statusCode;
        const contentType = result.headers['content-type'];
        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            console.log('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.log(error.message);

            // consume response data to free up memory
            result.resume();
            return;
        }
        // result.setEncoding('utf8');
        buffers = [];
        result.on('data', (chunk) => {
            buffers.push(chunk)
        });
        result.on('end', () => {
            try {
                var workbook = XLSX.read(Buffer.concat(buffers), { type: "buffer" });
                // 获取 Excel 中所有表名
                const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
                // res.end(JSON.stringify({sheetNames:sheetNames}))
                // 根据表名获取对应某张表  
                const worksheet = workbook.Sheets[sheetNames[0]];
                // 解析 Excel 生成 JSON
                res.end(JSON.stringify({file:XLSX.utils.sheet_to_html(worksheet)}))
            } catch (e) {
                console.log(e.message);
            }
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });

});


app.listen(2000, function (a) {
    console.log("Listening to port 2000");
});






