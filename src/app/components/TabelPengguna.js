"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const TabelPengguna = () => {
  const [units, setUnits] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/get-unit-details");
        setUnits(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleSort = (column) => {
    const newOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newOrder);

    const sortedData = [...units].sort((a, b) => {
      if (a[column] < b[column]) {
        return newOrder === "asc" ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return newOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    setUnits(sortedData);
  };

  const downloadExcelWithData = () => {
    try {
      const downloadData = units.map(unit => ({
        "ID Unit": unit.id_unit,
        "Type Unit": unit.type_unit,
        "Status Opr": unit.status_opr,
        "Lokasi": unit.lokasi,
        "Tanggal": unit.tanggal,
        "Status Jigsaw": unit.status_jigsaw
      }));

      const worksheet = XLSX.utils.json_to_sheet(downloadData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Unit Data");
      XLSX.writeFile(workbook, "unit_data.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert('Gagal mengunduh data');
    }
  };
  
  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Hanya file Excel yang diperbolehkan');
        // Reset input file menggunakan ref
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        return;
      }
  
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maks 5MB');
        // Reset input file menggunakan ref
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        return;
      }
  
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = reader.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
          const expectedHeaders = [
            "ID Unit", "Type Unit", "Status Opr", "Lokasi", "Tanggal"
          ];
          
          const headers = Object.keys(jsonData[0] || {});
          const isValidStructure = expectedHeaders.every(header => 
            headers.includes(header)
          );
  
          if (!isValidStructure) {
            alert('Struktur file Excel tidak sesuai');
            // Reset input file menggunakan ref
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }

          // Validasi Status Operasi
          const invalidStatusRows = jsonData.filter(row => 
            !['operasi', 'standby'].includes(row["Status Opr"].toLowerCase())
          );

          if (invalidStatusRows.length > 0) {
            const invalidStatuses = [...new Set(invalidStatusRows.map(row => row["Status Opr"]))];
            alert(`Status operasi tidak valid: ${invalidStatuses.join(', ')}. Hanya "operasi" dan "standby" yang diperbolehkan.`);
            // Reset input file menggunakan ref
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }
  
          const newData = jsonData.map((row) => {
            // Konversi tanggal Excel ke format yang valid
            let convertedDate;
            if (typeof row["Tanggal"] === 'number') {
              // Konversi nomor tanggal Excel ke format Date
              const excelDate = new Date(Date.UTC(1900, 0, row["Tanggal"] - 1));
              convertedDate = excelDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
            } else {
              // Jika sudah dalam format string, gunakan langsung
              convertedDate = row["Tanggal"];
            }
  
            return {
              id_unit: row["ID Unit"],
              type_unit: row["Type Unit"],
              status_opr: row["Status Opr"].toLowerCase(), // Konversi ke lowercase untuk konsistensi
              lokasi: row["Lokasi"],
              tanggal: convertedDate
            };
          });
  
          axios
            .post("http://localhost:3001/api/add-unit-details", newData)
            .then((response) => {
              // Fetch updated data after upload
              return axios.get("http://localhost:3001/api/get-unit-details");
            })
            .then((response) => {
              setUnits(response.data);
              alert(`Berhasil mengunggah ${newData.length} data`);
              // Reset input file setelah upload berhasil
              if (fileInputRef.current) {
                fileInputRef.current.value = null;
              }
            })
            .catch((err) => {
              console.error("Error adding data:", err);
              alert('Gagal mengunggah data');
              // Reset input file jika upload gagal
              if (fileInputRef.current) {
                fileInputRef.current.value = null;
              }
            });
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Gagal memproses file');
          // Reset input file menggunakan ref
          if (fileInputRef.current) {
            fileInputRef.current.value = null;
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Gagal membaca file');
        // Reset input file menggunakan ref
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      };
      
      reader.readAsBinaryString(file);
    }
  };

  // Function to get background color for Status Jigsaw
  const getStatusOprBackground = (status) => {
    switch(status) {
      case 'operasi':
        return 'bg-green-300'; // Light green background
      case 'standby':
        return 'bg-orange-300';   // Light red background
      default:
        return '';              // No special background
    }
  };
  
  const getStatusJigsawBackground = (status) => {
    switch(status) {
      case 'Installed':
        return 'bg-green-300'; // Light green background
      case 'Uninstall':
        return 'bg-red-300';   // Light red background
      default:
        return '';              // No special background
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="container mx-auto p-6 max-w-screen-xl bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">UNIT OPERASI</h1>
        </div>

        <div className="flex justify-between p-4">
          <button
            onClick={downloadExcelWithData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Download Excel (With Data)
          </button>
          <input
            ref={fileInputRef}  // Tambahkan ref di sini
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex justify-center overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-center" onClick={() => handleSort("id_unit")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>No</span>
                    <span className={`ml-2 ${sortColumn === "id_unit" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("id_unit")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>ID Unit</span>
                    <span className={`ml-2 ${sortColumn === "id_unit" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("type_unit")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>Type Unit</span>
                    <span className={`ml-2 ${sortColumn === "type_unit" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("status_opr")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>Status Opr</span>
                    <span className={`ml-2 ${sortColumn === "status_opr" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("lokasi")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>Lokasi</span>
                    <span className={`ml-2 ${sortColumn === "lokasi" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("tanggal")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>Tanggal Update</span>
                    <span className={`ml-2 ${sortColumn === "tanggal" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
                <th className="py-3 px-6 text-center" onClick={() => handleSort("status_jigsaw")}>
                  <div className="flex items-center cursor-pointer justify-center">
                    <span>Status Jigsaw</span>
                    <span className={`ml-2 ${sortColumn === "status_jigsaw" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {units.map((unit, index) => (
                <tr
                  key={unit.id_unit}
                  className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-6 text-center whitespace-nowrap">
                    <div>{index + 1}</div>
                  </td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">
                    <div className="font-bold">{unit.id_unit}</div>
                  </td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">
                    <div>{unit.type_unit}</div>
                  </td>
                  <td className={`py-3 px-6 text-center whitespace-nowrap ${getStatusOprBackground(unit.status_opr)}`}>
                    <div className="font-bold">{unit.status_opr}</div>
                  </td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">
                    <div>{unit.lokasi}</div>
                  </td>
                  <td className="py-3 px-6 text-center whitespace-nowrap">
                    <div>{unit.tanggal}</div>
                  </td>
                  <td className={`py-3 px-6 text-center whitespace-nowrap ${getStatusJigsawBackground(unit.status_jigsaw)}`}>
                    <div className="font-bold">{unit.status_jigsaw}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabelPengguna;