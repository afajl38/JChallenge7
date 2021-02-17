var express           = require("express"),
    fs                = require("fs"),
    rimraf            = require("rimraf"),
    mkdirp            = require("mkdirp"),
    app               = express(),
    multiparty        = require('multiparty'),
    bodyParser        = require('body-parser'),
    fs                = require('fs'),
    bodyParser        = require('body-parser'),
    session           = require('express-session'),
    $                 = require( 'jquery' ),
    mysql             = require('mysql'),
    path              = require('path'),
    fileInputName     = process.env.FILE_INPUT_NAME || "qqfile",
    uploadedFilesPath = 'uploads',
    chunkDirName      = "chunks",
    port              = 8190,
    moveFile          = require('move-file');
    maxFileSize       = process.env.MAX_FILE_SIZE || 0; // in bytes, 0 for unlimited



app.listen(8190);
app.post("/fineupload001", onUpload);
app.delete("/fineuploads/:uuid", onDeleteFile);
var con = mysql.createConnection({
    host: "10.11.90.16",
    user: "study",
    password: "Study1111%",
    database: "Study",
    multipleStatements:true
});


var plato = [];


function onUpload(req, res) {
    var form = new multiparty.Form();

    form.parse(req, function(err, fields, files) {
        var partIndex = fields.qqpartindex;

        // text/plain is required to ensure support for IE9 and older
        res.set("Content-Type", "text/plain");

        if (partIndex == null) {
            onSimpleUpload(fields, files[fileInputName][0], res);
        }
        else {
            onChunkedUpload(fields, files[fileInputName][0], res);
        }
    });
}
function onSimpleUpload(fields, file, res) {
    var uuid = fields.qquuid,
        responseData = {
            success: false
        };

    file.name = fields.qqfilename;
    plato.push(uuid);
    if (isValid(file.size)) {
        moveUploadedFile(file, uuid, function() {
                responseData.success = true;
                res.send(responseData)},
            function() {
                responseData.error = "Problem copying the file!";
                res.send(responseData);
            });
    }
    else {
        failWithTooBigFile(responseData, res);
    }
}
function onChunkedUpload(fields, file, res) {
    var size = parseInt(fields.qqtotalfilesize),
        uuid = fields.qquuid,
        index = fields.qqpartindex,
        totalParts = parseInt(fields.qqtotalparts),
        responseData = {
            success: false
        };

    file.name = fields.qqfilename;
    if (isValid(size)) {
        storeChunk(file, uuid, index, totalParts, function() {
                if (index < totalParts - 1) {
                    responseData.success = true;
                    res.send(responseData);
                }
                else {
                    combineChunks(file, uuid, function() {
                            responseData.success = true;
                            res.send(responseData);
                        },
                        function() {
                            responseData.error = "Problem conbining the chunks!";
                            res.send(responseData);
                        });
                }
            },
            function(reset) {
                responseData.error = "Problem storing the chunk!";
                res.send(responseData);
            });
    }
    else {
        failWithTooBigFile(responseData, res);
    }
}
function failWithTooBigFile(responseData, res) {
    responseData.error = "Too big!";
    responseData.preventRetry = true;
    res.send(responseData);
}
function onDeleteFile(req, res) {
    var uuid = req.params.uuid,
        dirToDelete = uploadedFilesPath + uuid;
    dirToDelete = uploadedFilesPath;

    rimraf(dirToDelete, function(error) {
        if (error) {
            console.error("Problem deleting file! " + error);
            res.status(500);
        }

        res.send();
    });
}
function isValid(size) {
    return maxFileSize === 0 || size < maxFileSize;
}
function finemoveFile(destinationDir, sourceFile, destinationFile, success, failure) {
console.log(destinationDir);
    console.log(sourceFile);

console.log(destinationFile);
    mkdirp(destinationDir, function(error) {
        var sourceStream, destStream;

        if (error) {
            console.error("Problem creating directory " + destinationDir + ": " + error);
            failure();
        }
        else {
            sourceStream = fs.createReadStream(sourceFile);
            destStream = fs.createWriteStream(destinationFile);

            sourceStream
                .on("error", function(error) {
                    console.error("Problem copying file: " + error.stack);
                    destStream.end();
                    failure();
                })
                .on("end", function(){
                    destStream.end();
                    success();
                })
                .pipe(destStream);
        }
    });
}
function moveUploadedFile(file, uuid, success, failure) {
    var destinationDir = uploadedFilesPath + "/",
        fileDestination = destinationDir + file.name;
    plato.push(fileDestination);
    finemoveFile(destinationDir, file.path, fileDestination, success, failure);
}
function storeChunk(file, uuid, index, numChunks, success, failure) {
    var destinationDir = uploadedFilesPath + "/" + chunkDirName + "/",
        chunkFilename = getChunkFilename(index, numChunks),
        fileDestination = destinationDir + chunkFilename;
    finemoveFile(destinationDir, file.path, fileDestination, success, failure);
}
function combineChunks(file, uuid, success, failure) {
    var chunksDir = uploadedFilesPath + "/" + chunkDirName + "/",
        destinationDir = uploadedFilesPath  + "/",
        fileDestination = destinationDir + file.name;


    fs.readdir(chunksDir, function(err, fileNames) {
        var destFileStream;

        if (err) {
            console.error("Problem listing chunks! " + err);
            failure();
        }
        else {
            fileNames.sort();
            destFileStream = fs.createWriteStream(fileDestination, {flags: "a"});

            appendToStream(destFileStream, chunksDir, fileNames, 0, function() {
                    rimraf(chunksDir, function(rimrafError) {
                        if (rimrafError) {
                            console.log("Problem deleting chunks dir! " + rimrafError);
                        }
                    });
                    success();
                },
                failure);
        }
    });
}
function appendToStream(destStream, srcDir, srcFilesnames, index, success, failure) {
    if (index < srcFilesnames.length) {
        fs.createReadStream(srcDir + srcFilesnames[index])
            .on("end", function() {
                appendToStream(destStream, srcDir, srcFilesnames, index + 1, success, failure);
            })
            .on("error", function(error) {
                console.error("Problem appending chunk! " + error);
                destStream.end();
                failure();
            })
            .pipe(destStream, {end: false});
    }
    else {
        destStream.end();
        success();
    }
}
function getChunkFilename(index, count) {
    var digits = new String(count).length,
        zeros = new Array(digits + 1).join("0");

    return (zeros + index).slice(-digits);
}



app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true}));
// parse application/json
app.use(bodyParser.json());



app.get('/fineupload003',function(req,res){




});
// app.get('/fineupload002',function(req,res) {
//     var Status = req.query.status;
//     plato.push(Status);
//     console.log(plato);
//     var sql = "INSERT INTO Study.Jasonchallenge7(uniqueid,filename,status) VALUES (?)";
//     // console.log(Status);
//     // console.log(!!Status);
//     plato = [];
//     if(!!Status){
//         con.query(sql, [],function (err, results) {
//             console.log(err);
//             console.log(results);
//         });
//     }else{
//         res.send('Incorrect input ')
//     };
// });


