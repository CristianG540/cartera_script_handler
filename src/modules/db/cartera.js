import { Utils as u } from '../utils'

import Promise from 'bluebird'
import _ from 'lodash'
import mysql from 'mysql'

export class Cartera {
  constructor () {
    this.connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'dev_josefa'
    })
    this.connection.connect(err => {
      if (err) { throw err }
    })
  }

  /**
   * Esta funcion se encarga de verificar si la factura ya esta en la bd
   * si no esta en la bd entonces se inserta, si ya esta se modifica
   * si una factura esta en la bd pero no esta en el csv entonces se elimina de la bd
   *
   * @param {any} csvInvoices
   * @memberof Cartera
   */
  async checkAndUpsert (csvInvoices) {
    let invoices = await this.getAllInvoices()

    this.doTransaction(() => {
      _.each(csvInvoices, csvInvoice => {
        // En esta variable guardo el indice de la factura
        let iDbInvoice = u.binarySearch(invoices, 'codigo', csvInvoice.factura)
        if (_.has(invoices[iDbInvoice], 'codigo') && invoices[iDbInvoice].codigo === csvInvoice.factura) {
          // console.log(this.invoices[iDbInvoice])
        } else {
          this.insert(
            csvInvoice.factura,
            csvInvoice.valorFac,
            csvInvoice.ValorTotalFac,
            csvInvoice.codCliente,
            csvInvoice.codVendedor,
            csvInvoice.fecha,
            csvInvoice.fechaVencimiento
          )
        }
      })
    })
  }

  /**
   * Recorro todas las facturas que tengo en mysql, y por cada factura
   * lo que hago es buscarla en el dataser de facturas que saco del archivo csv
   * si la factura de mysql no esta en los datos del archivo csv entonce elimino
   * dicha fctura de mysql
   *
   * @param {any} csvInvoices Recibo un array de objetos con las facturas de un archivo csv directo de SAP
   * @memberof Cartera
   */
  async checkAndDelete (csvInvoices) {
    let invoices = await this.getAllInvoices()

    this.doTransaction(() => {
      _.each(invoices, DbInvoice => {
        /**
         * Aqui simplemente busco la factura de mysql en el dataset de facturas csv
         * si encuentro la factura en el dataset entonces recupero el indice
         * esta funcion es mucho mas rapida que un find de lodash
         */
        let idxInvoice = u.binarySearch(csvInvoices, 'factura', DbInvoice.codigo)
        if (_.has(csvInvoices[idxInvoice], 'factura') && csvInvoices[idxInvoice].factura === DbInvoice.codigo) {
          // console.log(this.invoices[iDbInvoice])
        } else {
          this.delete(DbInvoice.codigo)
        }
      })
    })
  }

  doTransaction (dbFun) {
    this.connection.beginTransaction(err => {
      if (err) { throw err }

      dbFun()

      this.connection.commit((err) => {
        if (err) {
          return this.connection.rollback(() => {
            throw err
          })
        }
        console.log('success!')
      })
    })
  }

  getAllInvoices () {
    return new Promise((resolve, reject) => {
      this.connection.query('SELECT * FROM `cartera` ORDER BY `cartera`.`codigo` ASC', (error, results, fields) => {
        if (error) { reject(error) }
        resolve(results)
      })
    })
  }

  insert (codigo, valor, valorTotal, codCliente, codVendedor, fechaEmision, fechaVencimiento) {
    this.connection.query({
      sql: 'INSERT INTO `dev_josefa`.`cartera` (`codigo`, `valor`, `valor_total`, `cod_cliente`, `cod_vendedor`, `fecha_emision`, `fecha_vencimiento`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      values: [codigo, parseInt(valor, 10), parseInt(valorTotal, 10), codCliente, parseInt(codVendedor, 10), fechaEmision, fechaVencimiento]
    }, (error, results, fields) => {
      if (error) {
        return this.connection.rollback(() => {
          throw error
        })
      }
      console.log('Se inserto: ', results)
    })
  }

  delete (codigo) {
    this.connection.query({
      sql: 'DELETE FROM `cartera` WHERE `cartera`.codigo = ?',
      values: [codigo]
    }, (error, results, fields) => {
      if (error) {
        return this.connection.rollback(() => {
          throw error
        })
      }
      console.log('Se elimino: ', results)
    })
  }
}
