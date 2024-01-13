/*!
 * webspinner data module for MS SQL
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import mysql from 'mysql2/promise';
import mssql from 'mssql';

// TODO: Error management
export default async function Execute(datasource, command) {
    if (!datasource.connection) {
        const configDb = JSON.parse(datasource.config);
        if (datasource.type === 'mysql') {
            Object.defineProperty(datasource, 'connection', {
                enumerable: false,
                value: mysql.createPool(configDb)
            });
/*            Object.defineProperty(datasource, 'schema', {
                enumerable: false,
                value: await datasource.connection.execute(`
                    SELECT 'TABLES' as TYPE, 'TABLES' as NAME, '' as DATA_TYPE, '' as COLUMN_TYPE, '' as COLUMN_KEY, null as rows, 'TABLE' as PATH
                    UNION
                    SELECT 'TABLE', T.TABLE_NAME, '', '', '', T.TABLE_ROWS, concat_ws('/', 'TABLE', T.TABLE_NAME)
                        FROM information_schema.tables T 
                        WHERE T.TABLE_SCHEMA='${configDb.database}' and T.TABLE_TYPE = 'BASE TABLE'
                    UNION
                    SELECT 'COLUMN', C.COLUMN_NAME, C.DATA_TYPE, C.COLUMN_TYPE, C.COLUMN_KEY, null, concat_ws('/', 'TABLE', T.TABLE_NAME, C.COLUMN_NAME)
                        FROM information_schema.tables T inner join information_schema.columns C on T.TABLE_SCHEMA = C.TABLE_SCHEMA and T.TABLE_NAME = C.TABLE_NAME 
                        WHERE T.TABLE_SCHEMA='${configDb.database}' and T.TABLE_TYPE = 'BASE TABLE'
                    UNION
                    SELECT 'VIEWS', 'VIEWS', '', '', '', null, 'VIEW'
                    UNION
                    SELECT 'VIEW', V.TABLE_NAME, '', '', '', null, concat_ws('/', 'VIEW', V.TABLE_NAME)
                        FROM information_schema.views V
                        WHERE V.TABLE_SCHEMA='${configDb.database}'
                    UNION
                    SELECT 'COLUMN', C.COLUMN_NAME, C.DATA_TYPE, C.COLUMN_TYPE, C.COLUMN_KEY, null, concat_ws('/', 'VIEW', V.TABLE_NAME, C.COLUMN_NAME)
                        FROM information_schema.views V inner join information_schema.columns C on V.TABLE_SCHEMA = C.TABLE_SCHEMA and V.TABLE_NAME = C.TABLE_NAME
                        WHERE V.TABLE_SCHEMA='${configDb.database}'
                    UNION
                    SELECT 'ROUTINES', 'ROUTINES', '', '', '', null, 'ROUTINE'
                    UNION
                    SELECT R.ROUTINE_TYPE, R.ROUTINE_NAME, '', '', '', null, concat_ws('/', 'ROUTINE', R.ROUTINE_TYPE, R.ROUTINE_NAME)
                        FROM information_schema.ROUTINES R
                        WHERE R.ROUTINE_SCHEMA='${configDb.database}'
                    UNION
                    SELECT 'PARAMETER', ifnull(P.PARAMETER_NAME, 'RETURN'), P.DATA_TYPE, P.DTD_IDENTIFIER, ifnull(P.PARAMETER_MODE, ''), null, concat_ws('/', 'ROUTINE', R.ROUTINE_TYPE, R.ROUTINE_NAME, P.PARAMETER_NAME)
                        FROM information_schema.ROUTINES R left join information_schema.PARAMETERS P ON R.ROUTINE_SCHEMA = P.SPECIFIC_SCHEMA and R.ROUTINE_NAME = P.SPECIFIC_NAME
                        WHERE R.ROUTINE_SCHEMA='${configDb.database}'`)
            });*/
        } else if (datasource.type === 'mssql') {
            configDb.server = configDb.host;
            Object.defineProperty(datasource, 'connection', {
                enumerable: false,
                value: await mssql.connect(configDb)
            });

        } else {
            let err = new ReferenceError(`Connection error ${datasource.name} `);
            throw err;
        }
            return [[{}], [{}]];
    }

    if (datasource.type === 'mysql')
        return await datasource.connection.execute(command);
    else if (datasource.type === 'mssql')
        return await datasource.connection.execute(command);

    return [[{}], [{}]];
}
