"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Image from "next/image";

const TabelPengguna = () => {
  const [units, setUnits] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const fileInputRef = useRef(null);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/data");
        setUnits(response.data);
        setIsDataLoaded(true);  // Set this to true once data is fetched
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
        "ID Unit": unit.name,
        "Type Unit": unit.type,
        "Status Operasi": unit.status_opr,
        "Lokasi": unit.lokasi,
        "Pit": unit.pit,
        "Tanggal": unit.tanggal,
        "Status": unit.status === null 
          ? "Uninstall" 
          : unit.status === 1 
          ? "Uninstall" 
          : "Installed"
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
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        return;
      }
  
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maks 5MB');
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
            "ID Unit", "Type Unit", "Status Operasi", "Lokasi", "Pit", "Tanggal"
          ];
          
          const headers = Object.keys(jsonData[0] || {});
          const isValidStructure = expectedHeaders.every(header => 
            headers.includes(header)
          );
  
          if (!isValidStructure) {
            alert('Struktur file Excel tidak sesuai');
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }
  
          // Validasi Status Operasi
          const invalidStatusRows = jsonData.filter(row => 
            !['operasi', 'standby'].includes(row["Status Operasi"]?.toLowerCase())
          );
  
          if (invalidStatusRows.length > 0) {
            const invalidStatuses = [...new Set(invalidStatusRows.map(row => row["Status Operasi"]))];
            alert(`Status operasi tidak valid: ${invalidStatuses.join(', ')}. Hanya "operasi" dan "standby" yang diperbolehkan.`);
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }
  
          // Validasi Lokasi
          const invalidLokasiRows = jsonData.filter(row => 
            !['hw', 'lw', 'north ob'].includes(row["Lokasi"].toLowerCase())
          );
  
          if (invalidLokasiRows.length > 0) {
            const invalidLokasies = [...new Set(invalidLokasiRows.map(row => row["Lokasi"]))];
            alert(`Lokasi tidak valid: ${invalidLokasies.join(', ')}. Hanya "HW", "LW" dan "NORTH OB" yang diperbolehkan.`);
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }
  
          // Validasi Pit
          const invalidPitRows = jsonData.filter(row => 
            !['central', 'north'].includes(row["Pit"].toLowerCase())
          );
  
          if (invalidPitRows.length > 0) {
            const invalidPites = [...new Set(invalidPitRows.map(row => row["Pit"]))];
            alert(`Pit tidak valid: ${invalidPites.join(', ')}. Hanya "CENTRAL" dan "NORTH" yang diperbolehkan.`);
            if (fileInputRef.current) {
              fileInputRef.current.value = null;
            }
            return;
          }
  
          // Get current timestamp
          const uploadTimestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
  
          const newData = jsonData.map((row) => {
            // Konversi tanggal Excel ke format yang valid
            let convertedDate;
            if (typeof row["Tanggal"] === 'number') {
              const excelDate = new Date(Date.UTC(1900, 0, row["Tanggal"] - 1));
              convertedDate = excelDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
            } else {
              convertedDate = row["Tanggal"];
            }
          
            return {
              id_unit: row["ID Unit"],
              type_unit: row["Type Unit"],
              status_opr: row["Status Operasi"].toLowerCase(),
              lokasi: row["Lokasi"].toLowerCase(),
              pit: row["Pit"].toLowerCase(),
              tanggal: convertedDate,
              waktu: uploadTimestamp  // Menggunakan nama kolom 'waktu' sesuai struktur database
            };
          });
  
          axios
            .post("http://localhost:8000/api/add-unit-details", newData)
            .then((response) => {
              // Fetch updated data after upload
              return axios.get("http://localhost:8000/data");
            })
            .then((response) => {
              setUnits(response.data);
              alert(`Berhasil mengunggah ${newData.length} data`);
              if (fileInputRef.current) {
                fileInputRef.current.value = null;
              }
            })
            .catch((err) => {
              console.error("Error adding data:", err);
              alert('Gagal mengunggah data');
              if (fileInputRef.current) {
                fileInputRef.current.value = null;
              }
            });
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Gagal memproses file');
          if (fileInputRef.current) {
            fileInputRef.current.value = null;
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Gagal membaca file');
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
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="font-bold text-lg text-gray-800">Status Operasi, Lokasi, Pit & Tanggal Update</h1>
            <h1 className="font-bold font-small text-gray-800">== Format ==</h1>
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex">
                <span className="w-16 font-semibold">Status Operasi</span>
                <span>: Operasi & Standby</span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold">Lokasi</span>
                <span>: HW, LW & North OB</span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold">Pit</span>
                <span>: North & Central</span>
              </div>
              <div className="flex">
                <span className="w-16 font-semibold">Tanggal</span>
                <span>: Tanggal Update File _ contoh (2025-01-20)</span>
              </div>
            </div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="font-bold text-4xl text-gray-800">Population Unit</h1>
          </div>

          <div>
            <Image
              src="/LOGO ADARO ENERGY - SIS (LANDSCAPE).png"
              alt="Logo"
              width={250}
              height={100}
              className="rounded-xl"
            />
          </div>
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
          {isDataLoaded ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-center">
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>No</span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("name")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>ID Unit</span>
                      <span className={`ml-2 ${sortColumn === "name" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("type")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Type</span>
                      <span className={`ml-2 ${sortColumn === "type" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("status_opr")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Status Operasi</span>
                      <span className={`ml-2 ${sortColumn === "status_opr" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("lokasi")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Lokasi</span>
                      <span className={`ml-2 ${sortColumn === "lokasi" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("pit")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Pit</span>
                      <span className={`ml-2 ${sortColumn === "pit" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("tanggal")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Tanggal Update</span>
                      <span className={`ml-2 ${sortColumn === "tanggal" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                  <th className="py-3 px-6 text-center" onClick={() => handleSort("status")}>
                    <div className="flex items-center cursor-pointer justify-center">
                      <span>Status</span>
                      <span className={`ml-2 ${sortColumn === "status" ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`}></span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {units.map((unit, index) => (
                  <tr
                    key={unit.name}
                    className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div>{index + 1}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div className="font-bold">{unit.name}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div>{unit.type}</div>
                    </td>
                    <td className={`py-3 px-6 text-center whitespace-nowrap ${getStatusOprBackground(unit.status_opr)}`}>
                      <div className="font-bold">{unit.status_opr?.toUpperCase() || '-'}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap font-bold">
                      <div>{unit.lokasi?.toUpperCase() || '-'}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap font-bold">
                      <div>{unit.pit?.toUpperCase() || '-'}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div>{unit.tanggal || '-'}</div>
                    </td>
                    <td className={`py-3 px-6 text-center whitespace-nowrap 
                      ${unit.status === 0 ? 'bg-green-300' : (unit.status === 1 || unit.status === null) ? 'bg-red-300' : ''}`}
                    >
                      <div className="font-bold">{unit.status === 0 ? 'Installed' : unit.status === 1 || unit.status === null ? 'Uninstall' : '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>Loading...</div> // Tampilkan loading sementara data belum dimuat
          )}
        </div>
      </div>
    </div>
  );
};

export default TabelPengguna;