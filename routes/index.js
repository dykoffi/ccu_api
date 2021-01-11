const express = require('express')
const router = express.Router();
const { basename } = require('path');
const { rm, existsSync } = require('fs')
const { dealFile } = require('../utils')
const Busboy = require('busboy')
const cron = require('node-cron');
const moment = require('moment')

router
    .post('/upload', (req, res, next) => {
        let idsession = req.headers.idsession.split('/').join('')
        let busboy
        let filesDeal = []
        let response = false
        let envoie = setTimeout(() => { console.log("init time"); }, 1000);
        try {
            busboy = new Busboy({ headers: req.headers })
            busboy
                .on('file', async function (fieldname, fileStream, filename, encoding, mimetype) {
                    let time = moment().add(4, 'minute')
                    let min = time.get('minute')
                    let heure = time.get('hour')
                    let jour = time.get('DDD')
                    let mois = time.get('month') + 1
                    let fl = await dealFile(idsession, fileStream, basename(filename))
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
                    }, 2000);

                })
                .on('finish', async () => {
                })
            req
                .pipe(busboy)
        } catch (err) {
            return next(err)
        }
    })
    .get('/download/:folder/:file', (req, res, next) => {
        res.download(`./public/_files/${req.params.folder}/${req.params.file}`, () => {
            console.log("Download");
        })
    })
    .get('/initsession', (req, res, next) => {
        let idsession = req.headers.idsession.split('/').join('')
        if (existsSync(`./public/_files/${idsession}`)) {
            rm(`./public/_files/${idsession}`, { force: true, recursive: true },()=>{
                res.end()
            })
        }
    })
module.exports = router