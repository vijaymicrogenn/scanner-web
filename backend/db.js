// db.js
import sql from "mssql";

const config = {
  user: "sa",
  password: "mgenn",
  server: "DESKTOP-T75V5EG",
  database: "webapp",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Connection pool promise
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch(err => {
    console.log("❌ Database Connection Failed! ", err.message);
    throw err;
  });

export { sql, poolPromise };   // named exports
export default config;         // default export
