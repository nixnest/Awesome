var domain = 'nixne.st'
var port = '1680'
var root = '/home/zack/image-host'

var express = require('express');
var cors = require('cors');
var path = require('path');
var fs = require('fs');
var app = express();
var atob = require('atob');
var crypto = require('crypto');
var fileUpload = require('express-fileupload')
var schedule = require('node-schedule');
var rimraf = require('rimraf');

app.use(express.json({limit: '50mb'}));
app.use(cors());
app.use(fileUpload())
app.enable('trust proxy')
var pubClean = schedule.scheduleJob(' 0 * * * *', function() {
    var pubDir = root + '/images/i/'
    fs.readdir(pubDir, function (err, files) {
        files.forEach(function(file, index) {
            fs.stat(path.join(pubDir, file), function (err, stat) {
                var endTime, now;
                if (err) {
                    return console.error(err);
                }
                now = new Date().getTime();
                endTime = new Date(stat.ctime).getTime() + 864000;
                if (now > endTime) {
                    return rimraf(path.join(pubDir, file), function(err){
                        if (err) {
                            return console.error(err);
                        }
                        console.log('Cleaned up the public folder')
                    })
                }
            })
        })
    })
});
app.get('/*', function (req, res) {
    var host = req.headers.host
    var sub = host.split(".")[0]
    res.contentType('image/png')
    res.sendFile(root + '/images/' + sub + req.url)
});

app.post('/image', function (req, res) {
    var users = require('./users.json')
    if(!req.files.uploadFile) {
        res.status(500).send({ error: 'No file uploaded'})
        return;
    }
    if(!req.headers[`upload-key`]) {
        var key = 'i'
    } else {
        var key = req.headers[`upload-key`];
    }
    if(!users.hasOwnProperty(key)){
        res.status(500).send({ error: 'incorrect key' });
        console.log("incorrect key")
        return;
    }
    if (req.files.uploadFile.mimetype.indexOf('image/') <= -1) {
        res.status(500).send({error: 'File format not supported'})
        return;
    }
    var dir = './images/' + users[key].dir
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    imgData = req.files.uploadFile.data;
    var fileName = crypto.createHash("sha512").update(imgData, "binary").digest("hex").substring(0,6) + path.extname(req.files.uploadFile.name)
    var finalPath = dir + '/' + fileName
    var url  = 'https://' + users[key].dir + '.' + domain + '/' + fileName
    fs.appendFile('log.txt', req.ip + ' Uploads ' + finalPath + "\n", function (err) {
        if (err) throw err;
            console.log(req.ip + ' Uploads ' + finalPath) 
        })
    fs.writeFile(finalPath, imgData, (err) => {
        if (err) {
            res.status(500).send({error: 'Something went wrong. Try again'})
            throw err
        }
        res.status(200).send({link: url})
        delete(users)
    })
});
app.listen(port)
console.log('Ready.')
