'use client';
import React, { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import JsBarcode from 'jsbarcode';

const BarcodeCard = ({ name, patronBarcode }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, patronBarcode, {
        format: 'ITF', // matches Zoho ITF example
        displayValue: true,
        lineColor: '#000',
        font: 'monospace',
        fontSize: 12,
        width: 2,
        height: 50,
        margin: 0,
      });
    }
  }, [patronBarcode]);

  return (
    <div
      className='flex flex-col items-center justify-center bg-white border border-gray-300 rounded'
      style={{
        width: '60mm',
        height: '40mm',
        padding: '2mm',
        boxSizing: 'border-box',
      }}
    >
      <h3 className='text-[10px] mb-[2mm] font-medium'>Dzuels Foundation</h3>
      <svg ref={svgRef}></svg>
      <p className='text-[10px] mt-[1mm]'>Name: {name}</p>
    </div>
  );
};

export default function BarcodePage() {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Patron Barcodes',
  });

  // Example DB data
  const patrons = [
    { name: 'Joy Bamigbade', patronBarcode: '20230338' },
    { name: 'Tolu Aina', patronBarcode: '20230339' },
  ];

  return (
    <div className='p-6 flex flex-col items-center'>
      <div
        ref={printRef}
        className='grid grid-cols-2 gap-4 print:grid-cols-3 print:gap-2'
      >
        {patrons.map((p) => (
          <BarcodeCard
            key={p.patronBarcode}
            name={p.name}
            patronBarcode={p.patronBarcode}
          />
        ))}
      </div>

      <button
        onClick={handlePrint}
        className='mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg'
      >
        Print Barcodes
      </button>
    </div>
  );
}
