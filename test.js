const ExcelJS = require('exceljs');
const { transformContacts } = require('./utils/fonctions')

async function go() {
    const workbook = new ExcelJS.Workbook();
    await workbook.csv.readFile('./contacts.csv');
    const sheet = workbook.getWorksheet()
    sheet.eachRow((row,i)=>{
        row._cells.forEach(cell => {
            try {
                let value = sheet.getCell(cell.address).value
                value != null && console.log(sheet.getCell(cell.address));
                sheet.getCell(cell.address).value = value instanceof Object ? value : transformContacts(sheet.getCell(cell.address).value.toString(), "non")
            } catch (error) {

            }
        });
    })
    await workbook.csv.writeFile("ccu-contacts.csv");
}

go()