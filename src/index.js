import Papa from 'papaparse'
import { env } from './modules/config'
import { Cartera } from './modules/db/cartera'

let cartera = new Cartera()

// cartera.getAllInvoices()

const fs = require('fs')

let fileStream = fs.createReadStream(env.cartera_sap_file) // path.resolve(os.tmpdir(), 'fz3temp-3', 'product.txt')
Papa.parse(fileStream, {
  header: true,
  complete: csvParsed => {
    cartera.checkAndUpsert(csvParsed.data).then(() => {
      return cartera.checkAndDelete(csvParsed.data)
    }).then(() => {
      // cartera.connection.end()
    }).catch(err => {
      console.log('Puto error en un check', err)
    })
    fileStream.destroy()
  },
  error: err => {
    console.error('Puto error al leer el archivo de texto', err)
    fileStream.destroy()
  }
})
