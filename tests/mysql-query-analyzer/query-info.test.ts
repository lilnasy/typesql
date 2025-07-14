import assert from 'node:assert';
import { extractQueryInfo } from '../../src/mysql-query-analyzer/parse';
import { dbSchema } from './create-schema';
import type { QueryInfoResult } from '../../src/mysql-query-analyzer/types';

describe('QueryInfoResult test', () => {
	it('SELECT id FROM mytable1', () => {
		const sql = 'SELECT id FROM mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id as value FROM mytable1', () => {
		const sql = 'SELECT id as value FROM mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'value',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id, name FROM mytable2', () => {
		const sql = 'SELECT id, name FROM mytable2';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				},
				{
					name: 'name',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id+id FROM mytable1', () => {
		const sql = 'SELECT id+id FROM mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id+id',
					type: 'bigint',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id+double_value FROM mytable3', () => {
		const sql = 'SELECT id+double_value FROM mytable3';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id+double_value',
					type: 'double',
					notNull: false,
					table: 'mytable3'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT datetime_column FROM all_types', () => {
		const sql = 'SELECT datetime_column FROM all_types e WHERE datetime_column >= ?';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'datetime_column',
					type: 'datetime',
					notNull: true,
					table: 'e'
				}
			],
			parameters: [
				{
					type: 'datetime',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT ? FROM mytable3', () => {
		const sql = 'SELECT ? FROM mytable3';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: '?',
					type: 'any',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'any',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT CASE WHEN id = 1 then ? else id END from mytable1', () => {
		const sql = 'SELECT CASE WHEN id = 1 then ? else id END from mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'CASE WHEN id = 1 then ? else id END',
					type: 'int',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT CASE WHEN id = 1 then ? else id END from mytable1', () => {
		const sql = 'SELECT CASE WHEN id = 1 then ? else id END from mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'CASE WHEN id = 1 then ? else id END',
					type: 'int',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT ?+id from mytable1', () => {
		const sql = 'SELECT ?+id from mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: '?+id',
					type: 'double',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'double',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('infer case with subselect', () => {
		const sql = 'SELECT case when id=1 then ? else (select id from mytable1 where id = 1) end from mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'case when id=1 then ? else (select id from mytable1 where id = 1) end',
					type: 'int',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it(`SELECT concat_ws('/', ?, ?, ?) FROM mytable1`, () => {
		const sql = `SELECT concat_ws('/', ?, ?, ?) FROM mytable1`;
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: `concat_ws('/', ?, ?, ?)`,
					type: 'varchar',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'varchar',
					notNull: true
				},
				{
					type: 'varchar',
					notNull: true
				},
				{
					type: 'varchar',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT * FROM mytable1', () => {
		const sql = 'SELECT * FROM mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT (SELECT ? FROM mytable2) FROM mytable1', () => {
		const sql = 'SELECT (SELECT id FROM mytable2) FROM mytable1';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: '(SELECT id FROM mytable2)',
					type: 'int',
					notNull: false,
					table: ''
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT ?=id, ?=name FROM (SELECT id, name FROM mytable2) t', () => {
		const sql = 'SELECT ?=id, ?=name FROM (SELECT id, name FROM mytable2) t';

		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: '?=id',
					type: 'tinyint',
					notNull: true,
					table: ''
				},
				{
					name: '?=name',
					type: 'tinyint',
					notNull: false,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				},
				{
					type: 'varchar',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('parse a select with 3-levels nested select (with alias)', () => {
		const sql = `
        select id from(
			select matricula as id from(
				select name as matricula from mytable2
			) t1
		) t2`;
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'varchar',
					notNull: false,
					table: 't2'
				}
			],
			parameters: []
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('select * from subquery', () => {
		const sql = `
		select * from(
			select name, name as descr, id as value from mytable2
		) t2 where t2.value = ?`;

		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'name',
					type: 'varchar',
					notNull: false,
					table: 't2'
				},
				{
					name: 'descr',
					type: 'varchar',
					notNull: false,
					table: 't2'
				},
				{
					name: 'value',
					type: 'int',
					notNull: true,
					table: 't2'
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('parse a select with UNION and parameters', async () => {
		const sql = `
        SELECT id, value FROM mytable1 where value = ?
			UNION
        SELECT id, name FROM mytable2 where name = ?
			UNION
        SELECT id, id FROM mytable3 where double_value = ?`;

		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: ''
				},
				{
					name: 'value',
					type: 'varchar',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'int',
					notNull: true
				},
				{
					type: 'varchar',
					notNull: true
				},
				{
					type: 'double',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id FROM mytable1 ORDER BY ?', async () => {
		const sql = 'SELECT id FROM mytable1 ORDER BY ?';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [],
			orderByColumns: ['id', 'mytable1.id', 'value', 'mytable1.value']
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id FROM mytable1 LIMIT ?', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT ?';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					type: 'bigint',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id FROM mytable1 LIMIT ?, ?', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT ?, ?';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				}
			],
			parameters: [
				{
					type: 'bigint',
					notNull: true
				},
				{
					type: 'bigint',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});

	it('SELECT id FROM mytable1 LIMIT 1', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT 1';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 LIMIT 1,10', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT 1, 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 LIMIT 10,1', async () => {
		const sql = 'SELECT id FROM mytable1 LIMIT 10, 1';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 WHERE id = 1 LIMIT 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id = 1 LIMIT 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 WHERE id+id = 1', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id + id = 1';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 WHERE 1 = id LIMIT 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE 1 = id LIMIT 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 WHERE 1 = id LIMIT 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE 1 = id + id';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 WHERE id > 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id > 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 WHERE id > 10 and id = 11', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id > 10 and id = 11';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 WHERE id > 10 or id = 5', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id > 10 or id = 5';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 WHERE id > 10 or (id = 5 or id = 6)', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE id > 10 or(id = 5 or id = 6)';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 WHERE (id = 5 or id = 6) and id = 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE(id = 5 or id = 6) and id = 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, false);
	});

	it('SELECT id FROM mytable1 WHERE value = 1 LIMIT 10', async () => {
		const sql = 'SELECT id FROM mytable1 WHERE value = 1 LIMIT 10';
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT id FROM mytable1 UNION...', async () => {
		const sql = `
        SELECT id FROM mytable1 WHERE id = 1
		UNION
        SELECT id FROM mytable2 WHERE id = 1`;
		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT value FROM mytable1 WHERE value > 1 and value is null', async () => {
		const sql = 'SELECT value FROM mytable1 WHERE value > 1 and value is null';

		const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
		assert.deepStrictEqual(actual.multipleRowsResult, true);
	});

	it('SELECT :startDate, ADDDATE(:startDate, 31) as deadline', async () => {
		const sql = 'SELECT :startDate, ADDDATE(:startDate, 31) as deadline';
		const actual = extractQueryInfo(sql, dbSchema);

		const expected: QueryInfoResult = {
			kind: 'Select',
			multipleRowsResult: false,
			columns: [
				{
					name: '?', //TODO: Should be dateName?
					type: 'datetime',
					notNull: true,
					table: ''
				},
				{
					name: 'deadline',
					type: 'datetime',
					notNull: true,
					table: ''
				}
			],
			parameters: [
				{
					type: 'datetime',
					notNull: true
				},
				{
					type: 'datetime',
					notNull: true
				}
			]
		};

		assert.deepStrictEqual(actual, expected);
	});
});
