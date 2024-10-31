import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Directory and output file setup
const OUTPUT_CSV_PREFIX = 'institutions';
const COMBINED_CSV_FILE = 'combined_institutions.csv';

// Function to combine all CSV files into one
async function combineCSVFiles() {
  // Find all files that match the prefix and have a .csv extension
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
      // Add headers (field names) once, based on the first file
      combinedData.push(parsedData.meta.fields);
      headersAdded = true;
    }

    // Add the rows from parsed data (skip empty rows)
    parsedData.data.forEach((row) => {
      if (Object.values(row).some((value) => value !== null && value !== '')) {
        combinedData.push(Object.values(row));
      }
    });
  }

  // Convert combined data array back to CSV format and save to file
  const csvOutput = Papa.unparse(combinedData);
  fs.writeFileSync(COMBINED_CSV_FILE, csvOutput);
  console.log(`Combined CSV saved as ${COMBINED_CSV_FILE}`);
}

// Run the combine function
combineCSVFiles();
