// Tabu Search page functionality
import { showLoading, hideLoading, displayErrorMessage, updateAlgorithmResults, createSimpleChart, fetchResults, runOptimization, createIterationTable } from '../utils.js';

// Initialize the page
export function init() {
    console.log('Initializing Tabu Search page');
    setupEventListeners();
    setupRangeInputs();
    loadResults();
}

// Set up event listeners
function setupEventListeners() {
    const runButton = document.getElementById('tabu-run-btn');
    if (runButton) {
        runButton.addEventListener('click', runTabuSearch);
    }
}

// Set up range input displays
function setupRangeInputs() {
    const stepSizeInput = document.getElementById('tabu-step-size');
    if (stepSizeInput) {
        const stepSizeValue = stepSizeInput.nextElementSibling;
        stepSizeInput.addEventListener('input', () => {
            stepSizeValue.textContent = stepSizeInput.value;
        });
    }
}

// Run the Tabu Search algorithm
async function runTabuSearch() {
    try {
        // Show loading indicator
        showLoading();
        
        // Get parameters from form
        const iterations = parseInt(document.getElementById('tabu-iterations').value);
        const tabuListSize = parseInt(document.getElementById('tabu-list-size').value);
        const neighborhoodSize = parseInt(document.getElementById('tabu-neighborhood-size').value);
        const stepSize = parseFloat(document.getElementById('tabu-step-size').value);
        
        // Validate parameters
        if (isNaN(iterations) || iterations <= 0) {
            throw new Error('Number of iterations must be a positive number');
        }
        
        if (isNaN(tabuListSize) || tabuListSize <= 0) {
            throw new Error('Tabu list size must be a positive number');
        }
        
        if (isNaN(neighborhoodSize) || neighborhoodSize <= 0) {
            throw new Error('Neighborhood size must be a positive number');
        }
        
        if (isNaN(stepSize) || stepSize <= 0) {
            throw new Error('Step size must be a positive number');
        }
        
        // Create parameters object
        const parameters = {
            iterations: iterations,
            tabu_list_size: tabuListSize,
            neighborhood_size: neighborhoodSize,
            step_size: stepSize
        };
        
        console.log('Running Tabu Search with parameters:', parameters);
        
        // Run optimization
        const result = await runOptimization('tabu', parameters);
        
        // Update UI with results
        if (result) {
            updateTabuResults(result);
            
            // Show results section
            const resultsSection = document.getElementById('tabu-results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            // Create iteration table
            createIterationTable(result.accuracy_history, 'tabu-iterations-table');
        } else {
            throw new Error('No results data available for Tabu Search');
        }
    } catch (error) {
        console.error('Error running Tabu Search:', error);
        displayErrorMessage(`Error running Tabu Search: ${error.message}`);
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

// Load existing results if available
async function loadResults() {
    try {
        const results = await fetchResults();
        if (results && results.tabu) {
            updateTabuResults(results.tabu);
        }
    } catch (error) {
        console.warn('Could not load existing results:', error);
    }
}

// Chart instance variable to allow updating
let tabuChart = null;

// Update UI with Tabu Search results
function updateTabuResults(tabuData) {
    // Update accuracy and time
    updateAlgorithmResults(tabuData, 'tabu');
    
    // Update chart
    if (tabuData.accuracy_history && tabuData.accuracy_history.length > 0) {
        // If chart already exists, destroy it first
        if (tabuChart) {
            tabuChart.destroy();
        }
        
        // Create new chart
        tabuChart = createSimpleChart('tabu-chart-container', tabuData.accuracy_history, 'var(--tabu-color)', 'Tabu Search Accuracy');
    }
}
