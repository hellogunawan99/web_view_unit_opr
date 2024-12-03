const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

require('dotenv').config();

const moment = require('moment');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Konfigurasi koneksi database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Endpoint untuk menambahkan unit details
app.post('/api/add-unit-details', (req, res) => {
  const units = req.body;
  
  const query = `
    INSERT INTO unit_opr 
    (id_unit, type_unit, status_opr, lokasi, tanggal) 
    VALUES ?
  `;

  const values = units.map(unit => [
    unit.id_unit, 
    unit.type_unit, 
    unit.status_opr, 
    unit.lokasi, 
    unit.tanggal
  ]);

  connection.query(query, [values], (error, results) => {
    if (error) {
      console.error('Error inserting units:', error);
      return res.status(500).json({ 
        message: 'Gagal menambahkan data', 
        error: error.message 
      });
    }

    res.status(200).json({ 
      message: 'Data berhasil ditambahkan', 
      count: units.length 
    });
  });
});

app.get('/api/get-unit-details', (req, res) => {
    const query = `
      SELECT
        MAX(unit_opr.id_unit) AS id_unit,
        MAX(unit_opr.type_unit) AS type_unit,
        MAX(unit_opr.status_opr) AS status_opr,
        MAX(unit_opr.lokasi) AS lokasi,
        MAX(unit_opr.tanggal) AS tanggal,
        MAX(CASE 
          WHEN unit.status = 0 THEN 'Installed'
          WHEN unit.status = 1 THEN 'Uninstall'
          ELSE 'Uninstall'
        END) AS status_jigsaw
      FROM
        unit_opr
      LEFT JOIN
        unit ON unit_opr.id_unit = unit.id
      WHERE
        (unit_opr.id_unit, unit_opr.waktu) IN (
          SELECT id_unit, MAX(waktu)
          FROM unit_opr
          GROUP BY id_unit
        )
      GROUP BY unit_opr.id_unit
    `;
  
    connection.query(query, (error, results) => {
      if (error) {
        return res.status(500).json({ 
          message: 'Gagal mengambil data', 
          error: error.message 
        });
      }
      // Format tanggal menggunakan moment.js
      const formattedRows = results.map(row => ({
          ...row,
          tanggal: moment(row.tanggal).format('YYYY-MM-DD')
      }));
      res.json(formattedRows);
    });
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});