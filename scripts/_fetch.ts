import axios from 'axios';
import { writeFileSync } from 'fs';
import Papa from 'papaparse';

// Define the base API URL and pagination options
const BASE_API_URL = 'https://kelembagaan-api.kemnaker.go.id/v1/published-institutions';
const LIMIT = 100; // Fetch 100 items per request
const MAX_PAGE = null; // Set to null for unlimited pages
const OUTPUT_CSV_PREFIX = 'institutions';
const PROVINCES = [
  '3165c146-2174-4ab7-91e9-948fc4ef97ea',
  'e2749b3e-df73-4821-aad3-aa170c740fa1',
  'd5b90b58-bfb2-4afa-b754-d1280dabe9b3',
  'c3cf327f-6a6a-4bb0-8e30-5cac0c707640',
  'c63a30a8-db19-48a3-8782-0680555ae95b',
];

// Define the fields you want to extract with custom headers
const fieldMappings = {
  id: 'Identifier',
  name: 'Institution Name',
  owner: 'Owner',
  since: 'Established Since',
  address: 'Address',
  phone: 'Phone Number',
  email: 'Email',
  website: 'Website',
  status: 'Status',
  condition: 'Condition',
  'institution_type.name': 'Institution Type',
  'institutionable.license_number': 'License Number',
  'institutionable.tax_number': 'Tax Number',
  'postal_code.village.name': 'Village',
  'postal_code.village.sub_district.city.province.name': 'Province Name',
  'postal_code.village.sub_district.city.name': 'City Name',
  sectors: 'Sectors',
  popular_vocationals: 'Popular Vocationals',
};

// Helper function to get a nested value by string path
function getNestedValue(obj, path) {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

// Function to fetch additional data for each institution
async function fetchAdditionalData(institutionId) {
  const [sectorsResponse, popularVocationalsResponse] = await Promise.all([
    axios.get(`https://kelembagaan-api.kemnaker.go.id/v1/institutions/${institutionId}/sectors`),
    axios.get(`https://kelembagaan-api.kemnaker.go.id/v1/institutions/${institutionId}/popular-vocationals`),
  ]);

  const sectors = sectorsResponse.data.data
    .map((item) => item.sector?.name)
    .filter(Boolean)
    .join(', ');

  const popularVocationals = popularVocationalsResponse.data.data
    .map((item) => item.vocational?.name)
    .filter(Boolean)
    .join(', ');

  return { sectors, popular_vocationals: popularVocationals };
}

// Function to fetch a single page and save it immediately as a CSV
async function fetchAndSavePage(page) {
  const response = await axios.get(BASE_API_URL, {
    params: {
      page,
      limit: LIMIT,
      type: '',
      province: PROVINCES,
      city: '',
      name: '',
    },
  });

  const institutions = response.data.data;
  if (institutions.length > 0) {
    const enrichedInstitutions = await Promise.all(
      institutions.map(async (institution) => {
        const additionalData = await fetchAdditionalData(institution.id);
        return { ...institution, ...additionalData };
      }),
    );

    const dataForCSV = enrichedInstitutions.map((institution) => {
      const row = {};
      for (const [field, header] of Object.entries(fieldMappings)) {
        row[header] = getNestedValue(institution, field) ?? '';
      }
      return row;
    });

    const csv = Papa.unparse(dataForCSV);
    const fileName = `${OUTPUT_CSV_PREFIX}_page_${page}.csv`;
    writeFileSync(fileName, csv);
    console.log(`Saved ${fileName} with ${institutions.length} records.`);
    return true;
  } else {
    console.log(`No data available on page ${page}.`);
    return false; // Indicate no more data
  }
}

// Main function to fetch and save data page by page
async function main() {
  try {
    let page = 1;
    let moreData = true;

    while (moreData) {
      moreData = await fetchAndSavePage(page);
      console.log('moreDat', moreData);
      page++;
    }
  } catch (error) {
    console.error('Error fetching data or saving CSV:', error);
  }
}

main();
