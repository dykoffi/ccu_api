"use strict";
const express = require('express'); // utiliser le framework express pour faciliter le dev
const app = express(); // use la fonction app de express
const cors = require('cors'); //pour les requetes cross origins
const logger = require('morgan'); //pour l'authentification de mes requetes
const createError = require('http-errors'); // generer les erreurs hhtp
const path = require('path'); //gerer les chemins
const cookieparser = require('cookie-parser')

//activation des fonctionnalités de l'API
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'))); //definition du repertoire static
app.use(logger('dev'));
app.use(cookieparser()); //activation des cookies

//APPLICATION DES MDDLEWARES

//DÉFINITION DES ROUTES
app.use('/', require('./routes/index'))

//
app.use((req, res, next) => { next(createError(404)) })
app.use((err, req, res, next) => { console.log(err.message); })

//
module.exports = app