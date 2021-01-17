#!/usr/bin/env node
const { extname, join } = require('path')
const fs = require('fs')
const { updateVCF, updateCSV, updateZIP } = require('./utils');

/**
 * 
 * @param {*} fileStream 
 * @param {String} fileName 
 */
async function dealFile(folder, fileStream, fileName, indice) {
    if (!fs.existsSync(join('public/_files', folder))) {
        fs.mkdirSync(join('public/_files', folder))
    }
    if (fileName) {
        let fileExt = extname(fileName)
        switch (fileExt) {
            case '.vcf': return await updateVCF(folder, fileStream, fileName);
            case '.csv': return await updateCSV(folder, fileStream, fileName);
            case '.zip': return await updateZIP(folder, fileStream, fileName);
            default: console.log(`(Erreur) : fichier ${fileExt} non pris en charge`); return undefined;
        }
    }
}


exports.dealFile = dealFile
