const express = require('express')
const router = express.Router();
const { join, basename } = require('path');
const { dealFile } = require('../utils')
const { sendEmail } = require('../utils/fonctions')
const Busboy = require('busboy')

router
    .post('/upload/:email', (req, res, next) => {
        let enMail = req.params.email
        let mail = Buffer.from(enMail, 'base64').toString('ascii')
        let busboy
        let filesDeal = []
        let response = false
        let envoie = setTimeout(() => { console.log("init time"); }, 1000);
        try {
            busboy = new Busboy({ headers: req.headers })
            busboy
                .on('file', async function (fieldname, fileStream, filename, encoding, mimetype) {
                    let fl = await dealFile(enMail, fileStream, basename(filename))
                    filesDeal.push(fl)
                    let filesDealFinish = filesDeal.map(file => ({ filename: basename(file), path: file }))
                    clearTimeout(envoie)
                    envoie = setTimeout(() => {
                        sendEmail(mail, filesDealFinish).then(() => {
                            filesDeal = []
                            if (!response) {
                                res.header({
                                    'Sameorigin': 'lax',
                                    'Cache-Control': 'must-revalidate',
                                    'Access-Control-Allow-Origin':'*',
                                    'Access-Control-Request-Headers': '*',
                                    'Access-Control-Allow-Methods': "POST, OPTIONS",
                                })
                                res.end("Traitement terminé, veuillez vérifier votre mail.")
                                response = true
                            }
                        })
                    }, 1500);

                })
                .on('finish', async () => {
                })
            req
                .pipe(busboy)
        } catch (err) {
            return next(err)
        }
    })
module.exports = router