'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type ProductRow = Record<string, string>;

const COLUMN_ALIASES = {
  partNumber: ['part number', 'part_number', 'partnumber', 'pn', 'sku'],
  name: ['product name', 'description', 'name', 'product description'],
  family: ['category', 'product family', 'family'],
  compatibility: ['compatibility', 'oem', 'compatible models'],
  specs: ['length', 'speed', 'type', 'cable type', 'specifications'],
  notes: ['notes', 'remark', 'comments']
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function pickField(row: ProductRow, aliases: string[]): string {
  const keys = Object.keys(row);
  const matchedKey = keys.find((key) => aliases.includes(normalizeKey(key)));
  return matchedKey ? row[matchedKey] ?? '' : '';
}

function toRows(input: unknown[]): ProductRow[] {
  return input
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value === undefined || value === null ? '' : String(value)])
      )
    )
    .filter((row) => Object.values(row).some((v) => v.trim() !== ''));
}

export default function Home() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/data/products.csv')
      .then((response) => response.text())
      .then((csvText) => {
        const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
        setRows(toRows(parsed.data));
      })
      .catch(() => setError('Could not load default product file.'));
  }, []);

  const filterColumns = useMemo(() => {
    if (!rows.length) return [];
    const candidates = ['product family', 'category', 'oem', 'speed', 'cable type', 'type'];
    return Object.keys(rows[0]).filter((key) => candidates.includes(normalizeKey(key)));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const partNumber = pickField(row, COLUMN_ALIASES.partNumber);
      const matchQuery = partNumber.toLowerCase().includes(query.trim().toLowerCase());
      if (!matchQuery) return false;

      return Object.entries(filters).every(([column, selected]) => {
        if (!selected) return true;
        return (row[column] ?? '').toLowerCase() === selected.toLowerCase();
      });
    });
  }, [rows, query, filters]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');

    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = () => {
      try {
        if (extension === 'csv') {
          const text = String(reader.result ?? '');
          const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
          setRows(toRows(parsed.data));
          return;
        }

        if (extension === 'xlsx' || extension === 'xls') {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
          setRows(toRows(parsed));
          return;
        }

        if (extension === 'json') {
          const json = JSON.parse(String(reader.result ?? '[]')) as unknown[];
          setRows(toRows(json));
          return;
        }

        setError('Unsupported file type. Please upload CSV, XLSX, XLS, or JSON.');
      } catch {
        setError('Could not parse the uploaded file. Please verify the format.');
      }
    };

    if (extension === 'xlsx' || extension === 'xls') reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }

  return (
    <main>
      <h1>Product Search</h1>
      <p className="muted">Search by full or partial part number and optionally narrow down with available filters.</p>
      <div className="card">
        <div className="controls">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by part number" />
          <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleUpload} />
          {filterColumns.map((column) => {
            const values = Array.from(new Set(rows.map((row) => row[column]).filter(Boolean))).sort();
            return (
              <select
                key={column}
                value={filters[column] ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, [column]: e.target.value }))}
              >
                <option value="">All {column}</option>
                {values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            );
          })}
        </div>

        {error && <p>{error}</p>}

        <table>
          <thead>
            <tr>
              <th>Part Number</th>
              <th>Product Name/Description</th>
              <th>Category/Product Family</th>
              <th>Compatibility/OEM</th>
              <th>Length/Speed/Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={`${pickField(row, COLUMN_ALIASES.partNumber)}-${index}`}>
                <td>{pickField(row, COLUMN_ALIASES.partNumber)}</td>
                <td>{pickField(row, COLUMN_ALIASES.name)}</td>
                <td>{pickField(row, COLUMN_ALIASES.family)}</td>
                <td>{pickField(row, COLUMN_ALIASES.compatibility)}</td>
                <td>{pickField(row, COLUMN_ALIASES.specs)}</td>
                <td>{pickField(row, COLUMN_ALIASES.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredRows.length && <p>No matching products found.</p>}
      </div>
    </main>
  );
}
