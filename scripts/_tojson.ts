import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Directory and output file setup
const OUTPUT_CSV_PREFIX = 'institutions';
const COMBINED_CSV_FILE = 'combined_institutions.csv';
const COMBINED_JSON_FILE = 'combined_institutions.json';

// Helper function to convert strings to camelCase
function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => (index === 0 ? match.toLowerCase() : match.trim().charAt(0).toUpperCase()));
}

// Function to transform keys of an object to camelCase and lowercase
function transformKeysToCamelCase(data) {
  return data.map((row) => {
    const transformedRow = {};
    for (const key in row) {
      transformedRow[toCamelCase(key)] = row[key];
    }
    return transformedRow;
  });
}

// Function to combine all CSV files into one
async function combineCSVFiles() {
  const csvFiles = fs.readdirSync('.').filter((file) => file.startsWith(OUTPUT_CSV_PREFIX) && file.endsWith('.csv'));

  if (csvFiles.length === 0) {
    console.log('No CSV files found to combine.');
    return;
  }

  let combinedData = [];
  let headersAdded = false;

  for (const file of csvFiles) {
    const fileContent = fs.readFileSync(path.join('.', file), 'utf8');
    const parsedData = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    if (!headersAdded) {
      combinedData.push(parsedData.meta.fields);
      headersAdded = true;
    }

    parsedData.data.forEach((row) => {
      if (Object.values(row).some((value) => value !== null && value !== '')) {
        combinedData.push(Object.values(row));
      }
    });
  }

  // Convert combined data to CSV format and save
  const csvOutput = Papa.unparse(combinedData);
  fs.writeFileSync(COMBINED_CSV_FILE, csvOutput);
  console.log(`Combined CSV saved as ${COMBINED_CSV_FILE}`);

  // Convert combined CSV data to JSON format, transform keys, and save
  const jsonData = Papa.parse(csvOutput, { header: true }).data; // Parse CSV into JSON
  const camelCasedData = transformKeysToCamelCase(jsonData);
  fs.writeFileSync(COMBINED_JSON_FILE, JSON.stringify(camelCasedData, null, 2));
  console.log(`Combined JSON saved as ${COMBINED_JSON_FILE}`);
}

// Run the combine function
combineCSVFiles();
