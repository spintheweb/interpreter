/*!
 * webspinner data module for MS SQL
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { connect, query } from 'mssql'

async () => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await connect('Server=localhost,1433;Database=database;User Id=username;Password=password;Encrypt=true')
        const result = await query`select * from mytable where id = ${value}`
        console.dir(result)
    } catch (err) {
        // ... error checks
    }
}
