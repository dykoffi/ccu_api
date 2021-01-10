const { Transform } = require('stream')
const { transformToCivNumber } = require('./fonctions')

/**
 * Partitionner le fichier VCF en plusieurs Cartes
 * @class
 */
exports.sequenceToLine = class sequenceToLine extends Transform {
    /**
     * @constructs
     * @param {*} options 
     */
    constructor(options) {
        super({ ...options, objectMode: true })
        this.str = ""
    }

    _transform(chunk, encoding, callback) {
        this.str += chunk.toString()
        callback()
    }

    _flush(callback) {
        let tab = []
        let fin = this.str.split('\r\n').length !== 1 ? '\r\n' : '\n'
        tab = this.str.split(fin).map(elt => elt + fin)
        tab.pop()
        this.push(tab)
        callback()
    }
}
exports.vcfModifyNumber = class vcfModifyNumber extends Transform {
    constructor(options) {
        super({ ...options, objectMode: true })
    }
    _transform(chunk, enc, call) {
        chunk.forEach(line => {
            if (/^(TEL)/.test(line)) {
                let tab = line.split(':')
                let prefix = tab[0]
                let fin = tab[1].split("\r\n").length !== 1 ? "\r\n" : "\n"
                let num = tab[1].split(fin)[0]
                this.push(prefix + ':' + transformToCivNumber(num) + fin)
            } else { this.push(line) }
        });
        call()
    }
    _flush(callback) {
        callback()
    }
}

exports.cspModifyNumber = class cspModifyNumber extends Transform {
    constructor(options) {
        super({ ...options, objectMode: true })
        this.str = ""
    }

    _transform(chunk, enc, call) {
        chunk.forEach(line => {
            let tab = line.split(';')
            let fin = tab[tab.length - 1].split("\r\n").length !== 1 ? "\r\n" : "\n"
            tab.forEach((cell, i) => {
                let data = cell
                if (data.includes('/')) {
                    let tab = data.split('/')
                    data = tab.pop()
                    this.str += tab.map(contact => transformToCivNumber(contact)).join('/') + '/'
                }
                if (data.includes(fin)) {
                    let num = data.split(fin)[0]
                    this.str += transformToCivNumber(num) + fin
                } else {
                    this.str += transformToCivNumber(data) + ";"
                }
            })
        });
        call()
    }
    _flush(callback) {
        let tab = []
        let fin = this.str.split('\r\n').length !== 1 ? '\r\n' : '\n'
        tab = this.str.split(fin).map(elt => elt + fin)
        tab.pop()
        this.push(tab)
        callback()
    }
}

exports.csvModifyNumber = class csvModifyNumber extends Transform {
    constructor(options) {
        super({ ...options, objectMode: true })
    }
    _transform(chunk, enc, call) {
        chunk.forEach(line => {
            let tab = line.split(',')
            let fin = tab[tab.length - 1].split("\r\n").length !== 1 ? "\r\n" : "\n"
            tab.forEach((cell, i) => {
                let data = cell
                if (data.includes('/')) {
                    let tab = data.split('/')
                    data = tab.pop()
                    this.push(tab.map(contact => transformToCivNumber(contact)).join('/') + '/')
                }
                if (data.includes(fin)) {
                    let num = data.split(fin)[0]
                    this.push(transformToCivNumber(num) + fin)
                } else {
                    this.push(transformToCivNumber(data) + ",")
                }
            })
        });
        call()
    }
    _flush(callback) {
        callback()
    }
}