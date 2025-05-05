import { showLoading, hideLoading, displayErrorMessage, updateAlgorithmResults, fetchResults, runOptimization, createSimpleChart } from '../utils.js';

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
        const genotype = document.getElementById('ga-genotype').value;
        const mutationType = document.getElementById('ga-mutation-type').value;
        const fitnessFunction = document.getElementById('ga-fitness-function').value;
        
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
            elitism: elitism,
            genotype: genotype,
            mutation_type: mutationType,
            fitness_function: fitnessFunction
        };
        
        console.log('Running GA with parameters:', parameters);
        
        // Run optimization
        const result = await runOptimization('ga', parameters);
        
        // Update UI with results
        if (result) {
            // Store the parameters in the result for reference
            result.population_size = populationSize;
            result.genotype = genotype;
            result.mutation_type = mutationType;
            
            // Show results section
            const resultsSection = document.getElementById('ga-results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            updateGAResults(result);
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
    
    // Update fitness and error rate
    const fitnessElement = document.getElementById('ga-fitness');
    if (fitnessElement) {
        // Use best accuracy as fitness if not explicitly provided
        const fitness = gaData.best_fitness || gaData.best_accuracy;
        fitnessElement.textContent = (fitness * 100).toFixed(2) + '%';
    }
    
    const errorElement = document.getElementById('ga-error');
    if (errorElement) {
        // Calculate error rate as 1 - accuracy
        const errorRate = 1 - (gaData.best_accuracy || 0);
        errorElement.textContent = (errorRate * 100).toFixed(2) + '%';
    }
    
    // Update population summary
    const initialPopElement = document.getElementById('ga-initial-population');
    if (initialPopElement) {
        // Use the population_size from the last run or a default value
        initialPopElement.textContent = gaData.population_size || '50';
    }
    
    const convergenceGenElement = document.getElementById('ga-convergence-gen');
    if (convergenceGenElement) {
        // Estimate convergence generation (when best accuracy was first achieved)
        let convergenceGen = gaData.accuracy_history.length;
        const bestAccuracy = gaData.best_accuracy;
        for (let i = 0; i < gaData.accuracy_history.length; i++) {
            if (gaData.accuracy_history[i] >= bestAccuracy) {
                convergenceGen = i + 1; // +1 because we're 0-indexed
                break;
            }
        }
        convergenceGenElement.textContent = convergenceGen;
    }
    
    const fitnessEvalsElement = document.getElementById('ga-fitness-evals');
    if (fitnessEvalsElement) {
        // Estimate total fitness evaluations
        const popSize = gaData.population_size || 50;
        const generations = gaData.accuracy_history.length;
        fitnessEvalsElement.textContent = popSize * generations;
    }
    
    // Update best individual
    const bestIndividualElement = document.getElementById('ga-best-individual');
    if (bestIndividualElement) {
        // Create a simulated best individual representation
        const bestIndividual = generateBestIndividualRepresentation(gaData);
        bestIndividualElement.textContent = bestIndividual;
    }
    
    // Create detailed iteration table
    createDetailedGAIterationTable(gaData);
}