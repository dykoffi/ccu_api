const nodemailer = require("nodemailer");
/**
 * Actualisaer un numero ivoirien en fonction des nouvelles 
 * normes de numerotation
 * @param {String} number 
 */
function transformToCivNumber(number) {
    let numero = number.split(' ').join('').split('-').join('').split('.').join('')
    if (/^(\+225|00225|225|\(\+225\)){0,1}\d{8}$/.test(numero)) {
        let num = numero.slice(-8)
        if ([2, 3].includes(parseInt(num[0]))) {
            //Numero fixe
            if (num[0] == 2) {
                //Abidjan
                switch (parseInt(num[2])) {
                    case 8: num = "21" + num; break;
                    case 0: num = "25" + num; break;
                    default: num = "27" + num; break;
                }
            }
            if (num[0] == 3) {
                //Intérieur du pays
                switch (parseInt(num[2])) {
                    case 0: num = "25" + num; break;
                    default: num = "27" + num; break;
                }
            }
        } else {
            //numero mobile
            switch (parseInt(num[1])) {
                case 0: case 1: case 2: case 3: num = "01" + num; break;
                case 4: case 5: case 6: num = "05" + num; break;
                case 7: case 8: case 9: num = "07" + num; break;
                default: break;
            }
        }
        return "+225 " + separate(num, 2)
    } else {
        return number
    }
}

/**
 * 
 * @param {String} chaine 
 * @param {*} indice 
 * @param {String} somme 
 */
function separate(chaine, indice, somme) {
    indice = indice === undefined ? 3 : indice
    somme = somme === undefined ? "" : somme
    if (chaine === undefined || chaine === null) return null
    try { chaine = chaine.toString() } catch (error) { }
    if (chaine.length <= indice) {
        return (chaine + somme)
    } else {
        somme = " " + chaine.substring(chaine.length - indice, chaine.length) + somme
        chaine = chaine.slice(0, chaine.length - indice)
        return separate(chaine, indice, somme)
    }
}
/**
 * 
 * @param {String} file 
 */
function getExtensionFile(file) {
    return file.split('.').pop()
}

/**
 * 
 * @param {String} mail 
 * @param {Array<String>} attachments 
 */
async function sendEmail(mail, attachments) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: "nodytic@gmail.com",
            pass: Buffer.from("QEFyaXN0aWRlNTU=", 'base64').toString('ascii'),
        },
    });

    await transporter.sendMail({
        from: 'CCU APP',
        to: mail,
        subject: "CCU | Receive Your Contact",
        html: `
                <h1>Hi</h1>
                <h3>Thanks for using CCu. below, your files</h3>
                `,
        attachments: attachments
    }).then(() => {
        console.log("mail send to " + mail);
    }).catch((err) => {
        console.log(err);
    })
}

exports.separate = separate
exports.getExtensionFile = getExtensionFile
exports.transformToCivNumber = transformToCivNumber
exports.sendEmail = sendEmail