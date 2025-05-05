// Genetic Algorithm page functionality
import { showLoading, hideLoading, displayErrorMessage, updateAlgorithmResults, fetchResults, runOptimization, createSimpleChart, createIterationTable } from '../utils.js';

// Initialize the page
export function init() {
    console.log('Initializing GA page');
    setupEventListeners();
    setupRangeInputs();
    loadResults();
}

// Set up event listeners
function setupEventListeners() {
    const runButton = document.getElementById('ga-run-btn');
    if (runButton) {
        runButton.addEventListener('click', runGeneticAlgorithm);
    }
}

// Set up range input displays
function setupRangeInputs() {
    const mutationRateInput = document.getElementById('ga-mutation-rate');
    if (mutationRateInput) {
        const mutationRateValue = mutationRateInput.nextElementSibling;
        mutationRateInput.addEventListener('input', () => {
            mutationRateValue.textContent = mutationRateInput.value;
        });
    }
}

// Run the Genetic Algorithm
async function runGeneticAlgorithm() {
    try {
        // Show loading indicator
        showLoading();
        
        // Get parameters from form
        const populationSize = parseInt(document.getElementById('ga-population-size').value);
        const generations = parseInt(document.getElementById('ga-generations').value);
        const mutationRate = parseFloat(document.getElementById('ga-mutation-rate').value);
        const selectionMethod = document.getElementById('ga-selection-method').value;
        const crossoverMethod = document.getElementById('ga-crossover-method').value;
        const elitism = parseInt(document.getElementById('ga-elitism').value);
        
        // Validate parameters
        if (isNaN(populationSize) || populationSize <= 0) {
            throw new Error('Population size must be a positive number');
        }
        
        if (isNaN(generations) || generations <= 0) {
            throw new Error('Number of generations must be a positive number');
        }
        
        if (isNaN(mutationRate) || mutationRate < 0 || mutationRate > 1) {
            throw new Error('Mutation rate must be a number between 0 and 1');
        }
        
        if (isNaN(elitism) || elitism < 0) {
            throw new Error('Elitism must be a non-negative number');
        }
        
        // Create parameters object
        const parameters = {
            population_size: populationSize,
            generations: generations,
            mutation_rate: mutationRate,
            selection_method: selectionMethod,
            crossover_method: crossoverMethod,
            elitism: elitism
        };
        
        console.log('Running GA with parameters:', parameters);
        
        // Run optimization
        const result = await runOptimization('ga', parameters);
        
        // Update UI with results
        if (result) {
            updateGAResults(result);
            
            // Show results section
            const resultsSection = document.getElementById('ga-results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            // Create iteration table
            createIterationTable(result.accuracy_history, 'ga-iterations-table');
        } else {
            throw new Error('No results data available for Genetic Algorithm');
        }
    } catch (error) {
        console.error('Error running Genetic Algorithm:', error);
        displayErrorMessage(`Error running Genetic Algorithm: ${error.message}`);
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

// Load existing results if available
async function loadResults() {
    try {
        const results = await fetchResults();
        if (results && results.ga) {
            updateGAResults(results.ga);
        }
    } catch (error) {
        console.warn('Could not load existing results:', error);
    }
}

// Chart instance variable to allow updating
let gaChart = null;

// Update UI with GA results
function updateGAResults(gaData) {
    // Update accuracy and time
    updateAlgorithmResults(gaData, 'ga');
    
    // Update chart
    if (gaData.accuracy_history && gaData.accuracy_history.length > 0) {
        // If chart already exists, destroy it first
        if (gaChart) {
            gaChart.destroy();
        }
        
        // Create new chart
        gaChart = createSimpleChart('ga-chart-container', gaData.accuracy_history, 'var(--ga-color)', 'GA Accuracy');
    }
}
