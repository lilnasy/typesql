import { type Connection, type Pool, createPool } from 'mysql2/promise';
import { type Either, right, left, isLeft } from 'fp-ts/lib/Either';
import type { MySqlDialect, TypeSqlError } from './types';
import type { ColumnSchema, Table } from './mysql-query-analyzer/types';
import { ResultAsync } from 'neverthrow';

const connectionNotOpenError: TypeSqlError = {
	name: 'Connection error',
	description: 'The database connection is not open.'
};

export async function createMysqlClientForTest(databaseUri: string): Promise<MySqlDialect> {
	const client = await createMysqlClient(databaseUri);
	if (client.isErr()) {
		throw Error('Error createMysqlClientForTest');
	}
	return client.value;
}

export function createMysqlClient(databaseUri: string): ResultAsync<MySqlDialect, TypeSqlError> {
	return ResultAsync.fromThrowable(
		async () => {
			const pool = await createPool(databaseUri);
			//@ts-ignore
			const schema = pool.pool.config.connectionConfig.database;
			const databaseVersion = await getDatabaseVersion(pool);

			const result: MySqlDialect = {
				type: 'mysql2',
				client: pool,
				databaseVersion,
				schema,
				isVersion8: isVersion8(databaseVersion)
			};
			return result;
		},
		(err) => {
			const error = err as Error;
			const connError: TypeSqlError = {
				name: 'Connection error',
				description: error.message
			};
			return connError;
		}
	)()
}

async function getDatabaseVersion(conn: Connection) {
	const [rows] = await conn.execute('select @@version as version');
	const mySqlVersion = (rows as any[])[0].version;
	return mySqlVersion;
}

export function loadMysqlSchema(conn: Connection, schema: string): ResultAsync<ColumnSchema[], TypeSqlError> {
	const sql = `
        SELECT 
            TABLE_SCHEMA as "schema", TABLE_NAME as "table", 
            COLUMN_NAME as "column", 
            IF(data_type = 'enum', COLUMN_TYPE, DATA_TYPE) as "column_type", 
            if(IS_NULLABLE='NO', true, false) as "notNull",
            COLUMN_KEY as "columnKey",
            IF(EXTRA = 'auto_increment', true, false) as "autoincrement"
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION
        `;


	return ResultAsync.fromThrowable(
		async () => {
			const result1 = conn.execute(sql, [schema]).then((res) => {
				const columns = res[0] as ColumnSchema[];
				return columns.map((col) => ({ ...col, notNull: !!+col.notNull })); //convert 1 to true, 0 to false
			});
			return result1;
		},
		(err) => {
			const error = err as Error;
			const connError: TypeSqlError = {
				name: 'Connection error',
				description: error.message
			};
			return connError;
		}
	)();
}

export function loadMySqlTableSchema(conn: Connection, schema: string, tableName: string
): ResultAsync<ColumnSchema[], TypeSqlError> {
	const sql = `
    SELECT 
        TABLE_SCHEMA as "schema", 
        TABLE_NAME as "table", 
        COLUMN_NAME as "column", 
        IF(data_type = 'enum', COLUMN_TYPE, DATA_TYPE) as "column_type",
        IF(IS_NULLABLE='NO', true, false) as "notNull",
        COLUMN_KEY as "columnKey",
        IF(EXTRA = 'auto_increment', true, false) as "autoincrement"
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ?
    AND TABLE_NAME = ?
    ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;

	return ResultAsync.fromThrowable(
		async () => {
			return conn.execute(sql, [schema, tableName]).then((res) => {
				const columns = res[0] as ColumnSchema[];
				return columns;
			})
		},
		(err: any) => {
			const error = err as Error;
			const connError: TypeSqlError = {
				name: 'Connection error',
				description: error.message
			};
			return connError;
		})()

}

export async function selectTablesFromSchema(conn: Connection): Promise<Either<TypeSqlError, Table[]>> {
	const sql = `
    SELECT 
        table_schema as "schema",
        table_name as "table"
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE' and table_schema = database() 
    order by "schema", "table"
    `;

	return conn.execute(sql).then((res) => {
		const columns = res[0] as ColumnSchema[];
		return right(columns);
	});
}

export async function explainSql(pool: Pool, sql: string): Promise<Either<TypeSqlError, boolean>> {
	const conn = await pool.getConnection();
	return conn
		.prepare(sql)
		.then(() => {
			return right(true);
		})
		.catch((err: any) => createInvalidSqlError(err))
		.finally(() => {
			conn.release();
		});
}

function createInvalidSqlError(err: any) {
	const error: TypeSqlError = {
		name: 'Invalid sql',
		description: err.message
	};
	return left(error);
}

function isVersion8(mySqlVersion: string) {
	return mySqlVersion.startsWith('8.');
}
