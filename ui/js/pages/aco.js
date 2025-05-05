// Ant Colony Optimization page functionality
import { showLoading, hideLoading, displayErrorMessage, updateAlgorithmResults, createSimpleChart, fetchResults, runOptimization, createIterationTable } from '../utils.js';

// Initialize the page
export function init() {
    console.log('Initializing ACO page');
    setupEventListeners();
    setupRangeInputs();
    loadResults();
}

// Set up event listeners
function setupEventListeners() {
    const runButton = document.getElementById('aco-run-btn');
    if (runButton) {
        runButton.addEventListener('click', runACO);
    }
}

// Set up range input displays
function setupRangeInputs() {
    const rangeInputs = [
        'aco-pheromone-importance',
        'aco-heuristic-importance',
        'aco-evaporation-rate'
    ];
    
    rangeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const valueDisplay = input.nextElementSibling;
            input.addEventListener('input', () => {
                valueDisplay.textContent = input.value;
            });
        }
    });
}

// Run the ACO algorithm
async function runACO() {
    try {
        // Show loading indicator
        showLoading();
        
        // Get parameters from form
        const antCount = parseInt(document.getElementById('aco-ant-count').value);
        const iterations = parseInt(document.getElementById('aco-iterations').value);
        const pheromoneImportance = parseFloat(document.getElementById('aco-pheromone-importance').value);
        const heuristicImportance = parseFloat(document.getElementById('aco-heuristic-importance').value);
        const evaporationRate = parseFloat(document.getElementById('aco-evaporation-rate').value);
        const initialPheromone = parseFloat(document.getElementById('aco-initial-pheromone').value);
        
        // Validate parameters
        if (isNaN(antCount) || antCount <= 0) {
            throw new Error('Ant count must be a positive number');
        }
        
        if (isNaN(iterations) || iterations <= 0) {
            throw new Error('Number of iterations must be a positive number');
        }
        
        if (isNaN(pheromoneImportance) || pheromoneImportance < 0) {
            throw new Error('Pheromone importance must be a non-negative number');
        }
        
        if (isNaN(heuristicImportance) || heuristicImportance < 0) {
            throw new Error('Heuristic importance must be a non-negative number');
        }
        
        if (isNaN(evaporationRate) || evaporationRate < 0 || evaporationRate > 1) {
            throw new Error('Evaporation rate must be a number between 0 and 1');
        }
        
        // Create parameters object
        const parameters = {
            ant_count: antCount,
            iterations: iterations,
            pheromone_importance: pheromoneImportance,
            heuristic_importance: heuristicImportance,
            evaporation_rate: evaporationRate,
            initial_pheromone: initialPheromone
        };
        
        console.log('Running ACO with parameters:', parameters);
        
        // Run optimization
        const result = await runOptimization('aco', parameters);
        
        // Update UI with results
        if (result) {
            updateACOResults(result);
            
            // Show results section
            const resultsSection = document.getElementById('aco-results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            // Create iteration table
            createIterationTable(result.accuracy_history, 'aco-iterations-table');
        } else {
            throw new Error('No results data available for Ant Colony Optimization');
        }
    } catch (error) {
        console.error('Error running ACO:', error);
        displayErrorMessage(`Error running Ant Colony Optimization: ${error.message}`);
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

// Load existing results if available
async function loadResults() {
    try {
        const results = await fetchResults();
        if (results && results.aco) {
            updateACOResults(results.aco);
        }
    } catch (error) {
        console.warn('Could not load existing results:', error);
    }
}

// Chart instance variable to allow updating
let acoChart = null;

// Update UI with ACO results
function updateACOResults(acoData) {
    // Update accuracy and time
    updateAlgorithmResults(acoData, 'aco');
    
    // Update chart
    if (acoData.accuracy_history && acoData.accuracy_history.length > 0) {
        // If chart already exists, destroy it first
        if (acoChart) {
            acoChart.destroy();
        }
        
        // Create new chart
        acoChart = createSimpleChart('aco-chart-container', acoData.accuracy_history, 'var(--aco-color)', 'ACO Accuracy');
    }
}
