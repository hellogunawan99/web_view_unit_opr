"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

const TabelPengguna = () => {
  const [units, setUnits] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // First check authentication
        const authResponse = await axios.get('/api/auth-check');
        if (!authResponse.data.authenticated) {
          window.location.href = '/';
          return;
        }
        setIsAuthorized(true);

        // Then fetch data
        const response = await axios.get("http://localhost:8000/equipment");
        setUnits(response.data);
        setIsDataLoaded(true);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          window.location.href = '/';
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, []);

  const handleSort = (column) => {
    const newOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newOrder);

    const sortedData = [...units].sort((a, b) => {
      if (a[column] < b[column]) return newOrder === "asc" ? -1 : 1;
      if (a[column] > b[column]) return newOrder === "asc" ? 1 : -1;
      return 0;
    });

    setUnits(sortedData);
  };

  const getStatusOprBackground = (status) => {
    switch(status?.toLowerCase()) {
      case 'operasi': return 'bg-green-300';
      case 'standby': return 'bg-orange-300';
      default: return '';
    }
  };
  
  const getStatusJigsawBackground = (status) => {
    switch(status?.toLowerCase()) {
      case 'installed': return 'bg-green-300';
      case 'uninstall': return 'bg-red-300';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="container mx-auto p-6 max-w-screen-xl bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="font-bold text-lg text-gray-800">Status Operasi, Lokasi, Region & Pit</h1>
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

        <div className="flex justify-center overflow-x-auto">
          {isDataLoaded ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-center">No</th>
                  {["id_unit", "type", "status", "lokasi", "region", "pit", "status_jigsaw"].map((column) => (
                    <th key={column} className="py-3 px-6 text-center" onClick={() => handleSort(column)}>
                      <div className="flex items-center cursor-pointer justify-center">
                        <span>{column.replace('_', ' ').toUpperCase()}</span>
                        <span className={`ml-2 ${sortColumn === column ? (sortOrder === "asc" ? "arrow-up" : "arrow-down") : ""}`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {units.map((unit, index) => (
                  <tr key={unit.id_unit} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-center">{index + 1}</td>
                    <td className="py-3 px-6 text-center font-bold">{unit.id_unit}</td>
                    <td className="py-3 px-6 text-center">{unit.type || '-'}</td>
                    <td className={`py-3 px-6 text-center font-bold ${getStatusOprBackground(unit.status)}`}>
                      {unit.status?.toUpperCase() || '-'}
                    </td>
                    <td className="py-3 px-6 text-center font-bold">{unit.lokasi?.toUpperCase() || '-'}</td>
                    <td className="py-3 px-6 text-center font-bold">{unit.region?.toUpperCase() || '-'}</td>
                    <td className="py-3 px-6 text-center font-bold">{unit.pit?.toUpperCase() || '-'}</td>
                    <td className={`py-3 px-6 text-center font-bold ${getStatusJigsawBackground(unit.status_jigsaw)}`}>
                      {unit.status_jigsaw?.toUpperCase() || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xl text-gray-600">Loading data...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabelPengguna;
