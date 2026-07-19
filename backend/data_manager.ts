import * from 'types';
import { Pool } from 'pg';

export default class DataManager {
    static readonly host: string = "";
    static readonly database_user: string = "";
    static readonly database_name: string = "";

    pool: Pool;


    constructor(port: number) {
        pool = new Pool({
          user: database_user,
          host: host,
          database: database_name,
          password: process.env.DB_PASSWORD,
          port: port,
        });
    }

    

}








