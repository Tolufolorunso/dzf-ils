'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import styles from '../patrons.module.css';

const BarcodeCard = ({
  name,
  patronBarcode,
  onDownload,
  onPrint,
  showActions = false,
}) => {
  const svgRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, patronBarcode, {
        format: 'CODE128',
        displayValue: false,
        lineColor: '#000000',
        width: 3,
        height: 60,
        margin: 0,
        background: 'transparent',
      });
    }
  }, [patronBarcode]);

  const handleDownloadCard = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#f8f9fa',
        width: 320,
        height: 200,
      });

      const link = document.createElement('a');
      link.download = `barcode-${patronBarcode}-${name.replace(
        /\s+/g,
        '-'
      )}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (onDownload) onDownload();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    const cardHTML = cardRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background: white;
            }
            .barcode-card {
              width: 320px !important;
              height: 200px !important;
              background: #f8f9fa !important;
              border: 2px solid #e9ecef !important;
              border-radius: 8px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding: 20px !important;
              box-sizing: border-box !important;
              font-family: Arial, sans-serif !important;
            }
            .foundation-name {
              font-size: 18px !important;
              color: #6c757d !important;
              font-weight: 400 !important;
              margin: 0 !important;
              letter-spacing: 1px !important;
              text-transform: uppercase !important;
            }
            .barcode-container {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              flex: 1 !important;
              margin: 15px 0 !important;
            }
            .barcode-number {
              font-size: 20px !important;
              font-weight: bold !important;
              color: #212529 !important;
              margin: 10px 0 !important;
              font-family: 'Courier New', monospace !important;
              letter-spacing: 2px !important;
            }
            .patron-name-container {
              width: 100% !important;
              text-align: center !important;
              margin-top: 10px !important;
              padding-top: 10px !important;
              border-top: 1px solid #dee2e6 !important;
            }
            .name-label {
              font-size: 14px !important;
              color: #6c757d !important;
              font-weight: 500 !important;
            }
            .patron-name-text {
              font-size: 16px !important;
              color: #212529 !important;
              margin-left: 6px !important;
              font-weight: 500 !important;
            }
            .card-actions { display: none !important; }
            @page { size: A4; margin: 20mm; }
          </style>
        </head>
        <body>
          ${cardHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      if (onPrint) onPrint();
    }, 250);
  };

  return (
    <div ref={cardRef} className={styles.barcodeCard}>
      {showActions && (
        <div className={styles.cardActions}>
          <button
            className={styles.cardActionBtn}
            onClick={handleDownloadCard}
            title='Download as Image'
          >
            📥
          </button>
          <button
            className={styles.cardActionBtn}
            onClick={handlePrintCard}
            title='Print Card'
          >
            🖨️
          </button>
        </div>
      )}

      <div className={styles.cardHeader}>
        <h3 className={styles.foundationName}>Dzuels Foundation</h3>
      </div>

      <div className={styles.barcodeContainer}>
        <svg ref={svgRef} className={styles.barcodeSvg}></svg>
      </div>

      <div className={styles.barcodeNumber}>{patronBarcode}</div>

      <div className={styles.patronNameContainer}>
        <span className={styles.nameLabel}>Name:</span>
        <span className={styles.patronNameText}>{name}</span>
      </div>
    </div>
  );
};

export default function GenerateBarcodePage() {
  const [patrons, setPatrons] = useState([]);
  const [filteredPatrons, setFilteredPatrons] = useState([]);
  const [selectedPatrons, setSelectedPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef();

  useEffect(() => {
    fetchPatrons();
  }, []);

  useEffect(() => {
    filterPatrons();
  }, [patrons, searchTerm]);

  const fetchPatrons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patrons');
      const data = await response.json();

      if (data.status) {
        setPatrons(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch patrons');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Patrons fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPatrons = () => {
    if (!searchTerm.trim()) {
      setFilteredPatrons(patrons);
      return;
    }

    const filtered = patrons.filter((patron) => {
      const fullName = `${patron.firstname} ${patron.surname}`.toLowerCase();
      const barcode = patron.barcode?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      return fullName.includes(search) || barcode.includes(search);
    });

    setFilteredPatrons(filtered);
  };

  const capitalize = (text) => {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  };

  const getInitials = (patron) => {
    const first = patron.firstname?.charAt(0) || '';
    const last = patron.surname?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const handlePatronSelect = (patronId, isChecked) => {
    if (isChecked) {
      setSelectedPatrons((prev) => [...prev, patronId]);
    } else {
      setSelectedPatrons((prev) => prev.filter((id) => id !== patronId));
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedPatrons(filteredPatrons.map((patron) => patron._id));
    } else {
      setSelectedPatrons([]);
    }
  };

  const handleGenerate = () => {
    if (selectedPatrons.length === 0) {
      setError('Please select at least one patron to generate barcodes.');
      return;
    }
    setShowPrintView(true);
  };

  const getSelectedPatronData = () => {
    return patrons.filter((patron) => selectedPatrons.includes(patron._id));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patron Barcodes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .print-container { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 5mm; 
              padding: 10mm;
            }
            .barcode-card {
              width: 85mm;
              height: 54mm;
              border: 1px solid #ccc;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: white;
              padding: 4mm;
              page-break-inside: avoid;
            }
            .foundation-name {
              font-size: 14px;
              color: #666;
              margin-bottom: 8px;
              font-weight: normal;
            }
            .barcode-svg { margin: 8px 0; }
            .barcode-number {
              font-size: 16px;
              font-weight: bold;
              margin: 4px 0;
              color: #000;
            }
            .patron-name-container {
              text-align: center;
              margin-top: 4px;
            }
            .name-label {
              font-size: 12px;
              color: #666;
            }
            .patron-name-text {
              font-size: 12px;
              color: #000;
              margin-left: 4px;
            }
            @page { 
              size: A4; 
              margin: 10mm; 
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadAllImages = async () => {
    try {
      const selectedData = getSelectedPatronData();
      const html2canvas = (await import('html2canvas')).default;

      // Create a zip file for multiple downloads
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const patron of selectedData) {
        // Create a temporary card for each patron
        const tempCard = document.createElement('div');
        tempCard.style.position = 'absolute';
        tempCard.style.left = '-9999px';
        tempCard.style.width = '320px';
        tempCard.style.height = '200px';
        tempCard.innerHTML = `
          <div style="
            width: 320px;
            height: 200px;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 20px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          ">
            <div style="width: 100%; text-align: center; margin-bottom: 10px;">
              <h3 style="font-size: 18px; color: #6c757d; font-weight: 400; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
                Dzuels Foundation
              </h3>
            </div>
            <div style="display: flex; justify-content: center; align-items: center; flex: 1; margin: 15px 0;">
              <svg id="barcode-${patron.barcode}"></svg>
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #212529; margin: 10px 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">
              ${patron.barcode}
            </div>
            <div style="width: 100%; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
              <span style="font-size: 14px; color: #6c757d; font-weight: 500;">Name:</span>
              <span style="font-size: 16px; color: #212529; margin-left: 6px; font-weight: 500;">
                ${capitalize(patron.firstname)} ${capitalize(patron.surname)}
              </span>
            </div>
          </div>
        `;

        document.body.appendChild(tempCard);

        // Generate barcode for this card
        const barcodeElement = tempCard.querySelector(
          `#barcode-${patron.barcode}`
        );
        if (barcodeElement) {
          JsBarcode(barcodeElement, patron.barcode, {
            format: 'CODE128',
            displayValue: false,
            lineColor: '#000000',
            width: 3,
            height: 60,
            margin: 0,
            background: 'transparent',
          });
        }

        // Convert to canvas and add to zip
        const canvas = await html2canvas(tempCard, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#f8f9fa',
          width: 320,
          height: 200,
        });

        const imageData = canvas.toDataURL('image/png').split(',')[1];
        const fileName = `barcode-${patron.barcode}-${capitalize(
          patron.firstname
        )}-${capitalize(patron.surname)}.png`;
        zip.file(fileName, imageData, { base64: true });

        document.body.removeChild(tempCard);
      }

      // Generate and download zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `patron-barcodes-${
        new Date().toISOString().split('T')[0]
      }.zip`;
      link.click();

      setSuccess(
        `Downloaded ${selectedData.length} barcode images as ZIP file!`
      );
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download images. Please try again.');
    }
  };

  if (showPrintView) {
    const selectedPatronData = getSelectedPatronData();

    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Barcode Preview</h1>
            <p className={styles.pageSubtitle}>
              {selectedPatronData.length} barcode(s) ready for print or download
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant='secondary' onClick={() => setShowPrintView(false)}>
              ← Back to Selection
            </Button>
            <Button variant='secondary' onClick={handleDownloadAllImages}>
              📥 Download Images
            </Button>
            <Button variant='primary' onClick={handlePrint}>
              🖨️ Print Barcodes
            </Button>
          </div>
        </div>

        {success && (
          <Alert
            type='success'
            message={success}
            onClose={() => setSuccess('')}
          />
        )}
        {error && (
          <Alert type='error' message={error} onClose={() => setError('')} />
        )}

        <div className={styles.previewContainer}>
          <div ref={printRef} className={styles.barcodeGrid}>
            {selectedPatronData.map((patron) => (
              <BarcodeCard
                key={patron.barcode}
                name={`${capitalize(patron.firstname)} ${capitalize(
                  patron.surname
                )}`}
                patronBarcode={patron.barcode}
                showActions={true}
                onDownload={() =>
                  setSuccess(
                    `Downloaded barcode for ${capitalize(
                      patron.firstname
                    )} ${capitalize(patron.surname)}`
                  )
                }
                onPrint={() =>
                  setSuccess(
                    `Printed barcode for ${capitalize(
                      patron.firstname
                    )} ${capitalize(patron.surname)}`
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>🏷️ Barcode Generator</h1>
          <p className={styles.pageSubtitle}>
            Select patrons to generate professional barcode cards
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href='/patrons'>
            <Button variant='secondary'>← Back to Patrons</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}
      {success && (
        <Alert
          type='success'
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      <div className={styles.modernContainer}>
        <div className={styles.searchSection}>
          <Input
            label='🔍 Search Patrons'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search by name or barcode...'
          />
        </div>

        <div className={styles.selectionPanel}>
          <div className={styles.selectionStats}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{filteredPatrons.length}</div>
              <div className={styles.statLabel}>Available Patrons</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{selectedPatrons.length}</div>
              <div className={styles.statLabel}>Selected</div>
            </div>
          </div>

          <div className={styles.bulkActions}>
            <Button
              variant='secondary'
              onClick={() => handleSelectAll(true)}
              disabled={filteredPatrons.length === 0}
            >
              Select All
            </Button>
            <Button
              variant='secondary'
              onClick={() => handleSelectAll(false)}
              disabled={selectedPatrons.length === 0}
            >
              Clear All
            </Button>
            <Button
              variant='primary'
              onClick={handleGenerate}
              disabled={selectedPatrons.length === 0}
            >
              Generate ({selectedPatrons.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading patrons...</p>
          </div>
        ) : filteredPatrons.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{searchTerm ? '🔍' : '👥'}</div>
            <h3>{searchTerm ? 'No Matching Patrons' : 'No Patrons Found'}</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'There are no patrons in the system yet.'}
            </p>
            {!searchTerm && (
              <Link href='/patrons/new'>
                <Button variant='primary'>Add New Patron</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.patronsGrid}>
            {filteredPatrons.map((patron) => (
              <div
                key={patron._id}
                className={`${styles.patronCard} ${
                  selectedPatrons.includes(patron._id) ? styles.selected : ''
                }`}
                onClick={() =>
                  handlePatronSelect(
                    patron._id,
                    !selectedPatrons.includes(patron._id)
                  )
                }
              >
                <div className={styles.patronCardHeader}>
                  <Avatar
                    size='md'
                    src={patron.image_url?.secure_url}
                    initial={getInitials(patron)}
                  />
                  <div className={styles.checkboxContainer}>
                    <input
                      type='checkbox'
                      checked={selectedPatrons.includes(patron._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handlePatronSelect(patron._id, e.target.checked);
                      }}
                      className={styles.modernCheckbox}
                    />
                  </div>
                </div>
                <div className={styles.patronCardBody}>
                  <h3 className={styles.patronCardName}>
                    {capitalize(patron.firstname)} {capitalize(patron.surname)}
                  </h3>
                  <p className={styles.patronCardBarcode}>{patron.barcode}</p>
                  <div className={styles.patronCardMeta}>
                    <span className={styles.patronType}>
                      {patron.patronType}
                    </span>
                    <span className={styles.patronGender}>{patron.gender}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
