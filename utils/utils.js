const { existsSync, mkdirSync, createWriteStream, rm } = require('fs')
const { sequenceToLine, vcfModifyNumber, csvModifyNumber, cspModifyNumber } = require('./class.js')
const { transformContacts } = require('./fonctions.js')
const { join, basename, extname } = require('path')
const unzipper = require('unzipper')
const zl = require("zip-lib");
const ExcelJS = require('exceljs');

function updateVCF(folder, fileStream, fileName, indice) {
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
            .pipe(new vcfModifyNumber(indice))
            .pipe(createWriteStream(join('public/_files', folder, 'ccu-' + file)))
            .on("finish", () => {
                resolve(join('public/_files', folder, 'ccu-' + file))
            })
    })

}

function updateCSV(folder, fileStream, fileName, indice) {
    let file = fileName
    let i = 0
    while (existsSync(join('public/_files', folder, 'ccu-' + file))) {
        file = fileName
        file = file.split(".csv").join(`(${++i}).csv`)
    }
    return new Promise((resolve, reject) => {
        fileStream
            .pipe(new sequenceToLine())
            .pipe(new cspModifyNumber(indice))
            .pipe(new csvModifyNumber(indice))
            .pipe(createWriteStream(join('public/_files', folder, 'ccu-' + file)))
            .on("finish", () => {
                resolve(join('public/_files', folder, 'ccu-' + file))
            })
    })
}

function updateEXCEL(folder, fileStream, fileName, indice) {
    let file = fileName
    let i = 0
    while (existsSync(join('public/_files', folder, 'ccu-' + file))) {
        file = fileName
        file = file.split(".csv").join(`(${++i}).csv`)
    }
    return new Promise(async (resolve, reject) => {
        const workbookR = new ExcelJS.stream.xlsx.WorkbookReader('./cidliste.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.read(fileStream);
        const sheet = workbook.getWorksheet()
        workbookR.read()
        workbookR.on('worksheet', async worksheet => {
            worksheet.on('row', row => {
                row._cells.forEach(cell => {
                    try {
                        let value = sheet.getCell(cell.address).value
                        if (value instanceof Object) {
                            sheet.getCell(cell.address).value = value
                        }
                        else if (value === null) {
                            sheet.getCell(cell.address).value = null
                        }
                        else {
                            value = value.toString()
                            if (value.includes('/')) {
                                let tab = value.split('/')
                                sheet.getCell(cell.address).value = tab.map(contact => transformContacts(contact, indice)).join(' / ')
                            } else if (value.includes(':') && value.split(':').length === 2) {
                                let tab = value.split(':')
                                sheet.getCell(cell.address).value = tab[0] + " : " + transformContacts(tab[1], indice)
                            } else {
                                sheet.getCell(cell.address).value = transformContacts(value.toString(), indice)
                            }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                });

            });
        });
        workbookR.on('end', async () => {
            await workbook.xlsx.writeFile(join('public/_files', folder, 'ccu-' + file));
            resolve(join('public/_files', folder, 'ccu-' + file))
        });
    })
}
function updateZIP(folder, fileStream, fileName, indice) {
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
                            .pipe(new cspModifyNumber(indice))
                            .pipe(new csvModifyNumber(indice))
                            .pipe(createWriteStream(join('public/_files', folder, 'zipTemp', 'ccu-' + fileBaseName)))
                    } else if (fileExt === '.vcf') {
                        entrySequence
                            .pipe(new vcfModifyNumber(indice))
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
exports.updateEXCEL = updateEXCEL