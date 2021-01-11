const { existsSync, mkdirSync, createWriteStream, rm } = require('fs')
const { sequenceToLine, vcfModifyNumber, csvModifyNumber, cspModifyNumber } = require('./class.js')
const { join, basename, extname } = require('path')
const unzipper = require('unzipper')
const zl = require("zip-lib");
function updateVCF(folder, fileStream, fileName) {
    let file = fileName
    let i = 0
    while (existsSync(join('public/_files', folder, 'ccu-' + file))) {
        file = fileName
        file = file.split(".vcf").join(`(${++i}).vcf`)
    }
    let timestamp = (new Date()).getTime().toString()
    return new Promise((resolve, reject) => {
        fileStream
            .pipe(new sequenceToLine())
            .pipe(new vcfModifyNumber())
            .pipe(createWriteStream(join('public/_files', folder, 'ccu-' + file)))
            .on("finish", () => {
                resolve(join('public/_files', folder, 'ccu-' + file))
            })
    })

}

function updateCSV(folder, fileStream, fileName) {
    let file = fileName
    let i = 0
    while (existsSync(join('public/_files', folder, 'ccu-' + file))) {
        file = fileName
        file = file.split(".csv").join(`(${++i}).csv`)
    }
    return new Promise((resolve, reject) => {
        fileStream
            .pipe(new sequenceToLine())
            .pipe(new cspModifyNumber())
            .pipe(new csvModifyNumber())
            .pipe(createWriteStream(join('public/_files', folder, 'ccu-' + file)))
            .on("finish", () => {
                resolve(join('public/_files', folder, 'ccu-' + file))
            })
    })
}


function updateZIP(folder, fileStream, fileName) {
    let file = fileName
    let i = 0
    while (existsSync(join('public/_files', folder, 'ccu-' + file))) {
        file = fileName
        file = file.split(".zip").join(`(${++i}).zip`)
    }
    return new Promise((resolve, reject) => {
        fileStream
            .pipe(unzipper.Parse())
            .on('entry', function (entry) {
                if (!existsSync(join('public/_files', folder, 'zipTemp'))) {
                    mkdirSync(join('public/_files', folder, 'zipTemp'))
                }
                let file = entry.path;
                let type = entry.type; // 'Directory' or 'File'
                if (type === "File") {
                    let fileBaseName = basename(file)
                    let fileExt = extname(file)
                    let entrySequence = entry.pipe(new sequenceToLine())
                    if (fileExt === '.csv') {
                        entrySequence
                            .pipe(new cspModifyNumber())
                            .pipe(new csvModifyNumber())
                            .pipe(createWriteStream(join('public/_files', folder, 'zipTemp', 'ccu-' + fileBaseName)))
                    } else if (fileExt === '.vcf') {
                        entrySequence
                            .pipe(new vcfModifyNumber())
                            .pipe(createWriteStream(join('public/_files', folder, 'zipTemp', 'ccu-' + fileBaseName)))
                    }
                }

            })
            .on('close', () => {
                zl.archiveFolder(join('public/_files', folder, 'zipTemp'), join('public/_files', folder, 'ccu-' + file))
                    .then(() => {
                        rm(join('public/_files', folder, 'zipTemp'), { recursive: true, force: true }, (err) => {
                            if (err) { console.log(err) }
                            else { resolve(join('public/_files', folder, 'ccu-' + file)) }
                        })
                    }).catch((err) => {
                        console.log(err);
                    })
            })
    })
}


exports.updateVCF = updateVCF
exports.updateCSV = updateCSV
exports.updateZIP = updateZIP