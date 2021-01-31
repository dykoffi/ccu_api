const express = require('express')
const router = express.Router();
const { basename, extname } = require('path');
const { rm, existsSync } = require('fs')
const { dealFile } = require('../utils')
const Busboy = require('busboy')
const cron = require('node-cron');
const moment = require('moment')

router
    .post('/upload', (req, res, next) => {
        let idsession = req.headers.idsession.split('/').join('')
        let indice = req.headers.indice
        let busboy
        let filesDeal = []
        let response = false
        let envoie = setTimeout(() => { console.log("init time"); }, 1000);
        try {
            busboy = new Busboy({ headers: req.headers })
            busboy
                .on('file', async function (fieldname, fileStream, filename, encoding, mimetype) {
                    let fl = await dealFile(idsession, fileStream, basename(filename), indice)
                    if (fl) {
                        let time = moment().add(1, 'minute')
                        let min = time.get('minute')
                        let heure = time.get('hour')
                        let jour = time.get('DDD')
                        let mois = time.get('month') + 1
                        filesDeal.push(fl)
                        let task = cron.schedule(`${min} ${heure} ${jour} ${mois} *`, () => {
                            rm(fl, () => {
                                console.log("Suppression de fichier OK");
                            })
                        }, {
                            scheduled: false
                        });

                        task.start();
                        let filesDealFinish = filesDeal.map(file => ({ filename: basename(file), path: file.replace("public/_files/", "") }))
                        clearTimeout(envoie)
                        envoie = setTimeout(() => {
                            filesDeal = []
                            if (!response) {
                                res.json(filesDealFinish)
                                response = true
                            }
                        }, 1500);
                    } else {
                        if (filesDeal.length > 0) {
                            clearTimeout(envoie)
                            envoie = setTimeout(() => {
                                if (!response) {
                                    res.json(filesDealFinish)
                                    response = true
                                }
                            }, 1500);
                        } else {
                            clearTimeout(envoie)
                            envoie = setTimeout(() => {
                                if (!response) {
                                    res.status(203)
                                    res.end()
                                }
                            }, 1500);
                        }
                    }
                })
            req
                .pipe(busboy)
        } catch (err) {
            return next(err)
        }
    })
    .get('/download/:folder/:file', (req, res, next) => {
        if (existsSync(`./public/_files/${req.params.folder}/${req.params.file}`)) {
            res.download(`./public/_files/${req.params.folder}/${req.params.file}`, () => {
                console.log("Download");
            })
        } else {
            res.status(204)
            res.end("deleted")
        }

    })
    .get('/initsession', (req, res, next) => {
        let idsession = req.headers.idsession.split('/').join('')
        if (existsSync(`./public/_files/${idsession}`)) {
            rm(`./public/_files/${idsession}`, { force: true, recursive: true }, () => {
                res.end()
            })
        } else {
            res.end()
        }
    })

    .get('/count/visites')
    .get('/count/files')
module.exports = router