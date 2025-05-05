// Particle Swarm Optimization page functionality
import { showLoading, hideLoading, displayErrorMessage, updateAlgorithmResults, createSimpleChart, fetchResults, runOptimization, createIterationTable } from '../utils.js';

// Initialize the page
export function init() {
    console.log('Initializing PSO page');
    setupEventListeners();
    setupRangeInputs();
    loadResults();
}

// Set up event listeners
function setupEventListeners() {
    const runButton = document.getElementById('pso-run-btn');
    if (runButton) {
        runButton.addEventListener('click', runPSO);
    }
}

// Set up range input displays
function setupRangeInputs() {
    const rangeInputs = [
        'pso-inertia',
        'pso-cognitive',
        'pso-social'
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

// Run the PSO algorithm
async function runPSO() {
    try {
        // Show loading indicator
        showLoading();
        
        // Get parameters from form
        const swarmSize = parseInt(document.getElementById('pso-swarm-size').value);
        const iterations = parseInt(document.getElementById('pso-iterations').value);
        const inertia = parseFloat(document.getElementById('pso-inertia').value);
        const cognitiveCoef = parseFloat(document.getElementById('pso-cognitive').value);
        const socialCoef = parseFloat(document.getElementById('pso-social').value);
        
        // Validate parameters
        if (isNaN(swarmSize) || swarmSize <= 0) {
            throw new Error('Swarm size must be a positive number');
        }
        
        if (isNaN(iterations) || iterations <= 0) {
            throw new Error('Number of iterations must be a positive number');
        }
        
        if (isNaN(inertia) || inertia < 0 || inertia > 1) {
            throw new Error('Inertia weight must be a number between 0 and 1');
        }
        
        if (isNaN(cognitiveCoef) || cognitiveCoef < 0) {
            throw new Error('Cognitive coefficient must be a non-negative number');
        }
        
        if (isNaN(socialCoef) || socialCoef < 0) {
            throw new Error('Social coefficient must be a non-negative number');
        }
        
        // Create parameters object
        const parameters = {
            swarm_size: swarmSize,
            iterations: iterations,
            inertia: inertia,
            cognitive_coef: cognitiveCoef,
            social_coef: socialCoef
        };
        
        console.log('Running PSO with parameters:', parameters);
        
        // Run optimization
        const result = await runOptimization('pso', parameters);
        
        // Update UI with results
        if (result) {
            updatePSOResults(result);
            
            // Show results section
            const resultsSection = document.getElementById('pso-results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            // Create iteration table
            createIterationTable(result.accuracy_history, 'pso-iterations-table');
        } else {
            throw new Error('No results data available for PSO');
        }
    } catch (error) {
        console.error('Error running PSO:', error);
        displayErrorMessage(`Error running PSO: ${error.message}`);
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

// Load existing results if available
async function loadResults() {
    try {
        const results = await fetchResults();
        if (results && results.pso) {
            updatePSOResults(results.pso);
        }
    } catch (error) {
        console.warn('Could not load existing results:', error);
    }
}

// Chart instance variable to allow updating
let psoChart = null;

// Update UI with PSO results
function updatePSOResults(psoData) {
    // Update accuracy and time
    updateAlgorithmResults(psoData, 'pso');
    
    // Update chart
    if (psoData.accuracy_history && psoData.accuracy_history.length > 0) {
        // If chart already exists, destroy it first
        if (psoChart) {
            psoChart.destroy();
        }
        
        // Create new chart
        psoChart = createSimpleChart('pso-chart-container', psoData.accuracy_history, 'var(--pso-color)', 'PSO Accuracy');
    }
}
