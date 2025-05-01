// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
// const { MongoClient } = require('mongodb'); 

// const app = express();
// const PORT = 3000; 

// const dbUri = 'mongodb+srv://gniresults:gni1234@cluster0.iqgr5ty.mongodb.net/Results?retryWrites=true&w=majority&appName=Cluster0';
// const dbName = 'Results'; 
// const collectionName = 'StudentResults'; 

// // Middleware
// app.use(cors()); // Allow cross-origin requests
// app.use(express.json()); // Parse JSON in requests

// // MongoDB Client
// let dbClient;

// // Connect to MongoDB
// async function connectMongo() {
//   try {
//     dbClient = await MongoClient.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
//     console.log("Connected to MongoDB");
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//   }
// }

// connectMongo();

// // Serve static files for the frontend (optional)
// app.use(express.static(path.join(__dirname, 'frontend')));

// // Endpoint to fetch all results
// app.get('/api/data', async (req, res) => {
//   try {
//     const db = dbClient.db(dbName); // Access the database
//     const collection = db.collection(collectionName); // Access the collection
//     // Fetch all documents from the collection
//     const results = await collection.find().toArray();
//     // console.log("Fetched results:", results); // Log the results

//     if (results.length === 0) {
//       return res.status(404).send('No results found');
//     }

//     res.json(results); // Send all results as JSON
//   } catch (error) {
//     console.error('Error fetching data from MongoDB:', error.message);
//     res.status(500).send('Could not fetch data from the database');
//   }
// });

// // Endpoint to fetch a specific result by roll number
// app.post('/getResults', async (req, res) => {
//   const { rollNumber } = req.body;

//   // Validate input
//   if (!rollNumber) {
//     return res.status(400).send('Roll Number is required');
//   }

//   try {
//     const db = dbClient.db(dbName);
//     const collection = db.collection(collectionName);

//     // Log the roll number being queried
//     console.log('Querying for roll number:', rollNumber);

//     // Find the result matching the roll number
//     const result = await collection.findOne({ rollNumber });

//     // Log the result found
//     console.log('Result found:', result);

//     if (!result) {
//       return res.status(404).send('Result not found for the given Roll Number');
//     }

//     res.json(result); // Send the matched result as JSON
//   } catch (error) {
//     console.error('Error fetching result by roll number:', error.message);
//     res.status(500).send('Could not fetch the result');
//   }
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
document.getElementById('rollNumberInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent the default action
    document.getElementById('searchButton').click(); // Trigger the click event on the submit button
  }
});
document.getElementById('searchButton').addEventListener('click', () => {
  const rollNumber = document.getElementById('rollNumberInput').value.trim();

  if (!rollNumber) {
    alert('Please enter a roll number');
    return;
  }

  // Show loading message
  const dataContainer = document.getElementById('data-container');
  dataContainer.innerHTML = '<p>Loading...</p>';

  fetch('http://localhost:3000/api/data') // Update URL if needed
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(rawData => {
      // console.log('Raw data:', rawData);

      // Clean the keys in the data
      const data = rawData.map(cleanKeys);

      // console.log('Cleaned data:', data);

      const sanitizedRollNumber = rollNumber.toString().trim();

      // Find data for the specific roll number
      const studentData = data.filter(item =>
        String(item.rollNumber || '').trim() === sanitizedRollNumber
      );

      console.log('Matched student data:', studentData);
      if (!studentData.length) {
        dataContainer.innerHTML = '<p>No results found for the entered roll number.</p>';
        document.getElementById('status').textContent = 'N/A';
        document.getElementById('sgpa').textContent = 'N/A';
        return;
      }

      // Render table with results
      renderTable(studentData);

      // Calculate and display status and SGPA
      calculateStatusAndSGPA(studentData);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      dataContainer.innerHTML = '<p>Failed to fetch data. Please try again later.</p>';
    });
});

// Function to clean keys in the data
function cleanKeys(obj) {
  const cleanedObj = {};
  Object.keys(obj).forEach(key => {
    // Remove unwanted characters and normalize key names
    const cleanedKey = key.replace(/[^\w]/g, '').trim();
    cleanedObj[cleanedKey] = obj[key];
  });
  return cleanedObj;
}

// Function to render table
function renderTable(studentData) {
  const dataContainer = document.getElementById('data-container');
  let tableHTML = `
    <table class="result-table">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Subject Name</th>
          <th>Grade</th>
          <th>Grade Point</th>
          <th>Credits</th>
        </tr>
      </thead>
      <tbody>
  `;

  studentData.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.SUBCODE}</td>
        <td>${item.SUBNAME}</td>
        <td>${item.GRADE_LETTER}</td>
        <td>${item.GRADE_POINT}</td>
        <td>${item.CREDITS}</td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  dataContainer.innerHTML = tableHTML;
}

// Function to calculate Pass/Fail status and SGPA
function calculateStatusAndSGPA(studentData) {
  const isFail = studentData.some(item => item.GRADE_LETTER === 'F' || item.GRADE_LETTER==='ABSENT');
  const statusElement = document.getElementById('status');
  const sgpaElement = document.getElementById('sgpa');

  // Update Pass/Fail status
  statusElement.textContent = isFail ? 'Fail' : 'Pass';
  statusElement.style.color = isFail ? 'red' : 'green';

  // Calculate SGPA
  if (isFail) {
    sgpaElement.textContent = 'N/A';
  } else {
    let totalGradePoints = 0;
    let totalCredits = 0;

    studentData.forEach(item => {
      const gradePoint = parseFloat(item.GRADE_POINT);
      const credits = parseFloat(item.CREDITS);
      totalGradePoints += gradePoint * credits;
      totalCredits += credits;
    });

    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    sgpaElement.textContent = sgpa;
  }
}
