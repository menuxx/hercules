// https://github.com/mysqljs/mysql

const mysql = require('mysql')

export const prod_pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'nizhuantech.com',
  user            : 'root',
  password        : 'FNQ31287twv',
  database        : 'menuxx_prd',
  port            : 65321
})

export const dev_pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'rm-uf68lsw07o293t779o.mysql.rds.aliyuncs.com',
  user            : 'qurenjiadb',
  password        : '1s$kh8g!1',
  database        : 'menuxx',
  port            : 3006
})

