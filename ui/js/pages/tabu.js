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
    
    // Show results section
    const resultsSection = document.getElementById('tabu-results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    // Update search summary
    updateSearchSummary(tabuData);
    
    // Create detailed iteration table
    createTabuIterationTable(tabuData);
    
    // Initialize visualization
    initSearchVisualization(tabuData);
    
    // Setup tab navigation
    setupTabNavigation();
}

// Update search summary with Tabu Search data
function updateSearchSummary(tabuData) {
    // Update total moves
    const totalMovesElement = document.getElementById('tabu-total-moves');
    if (totalMovesElement) {
        const iterations = tabuData.accuracy_history?.length || 0;
        const movesPerIteration = 5; // Approximate moves evaluated per iteration
        totalMovesElement.textContent = iterations * movesPerIteration;
    }
    
    // Update tabu rejections
    const tabuRejectionsElement = document.getElementById('tabu-rejections');
    if (tabuRejectionsElement) {
        // Simulate tabu rejections (approximately 30% of total moves)
        const iterations = tabuData.accuracy_history?.length || 0;
        const movesPerIteration = 5;
        const rejectionRate = 0.3;
        const rejections = Math.floor(iterations * movesPerIteration * rejectionRate);
        tabuRejectionsElement.textContent = rejections;
    }
    
    // Update aspiration criteria met
    const aspirationCountElement = document.getElementById('tabu-aspiration-count');
    if (aspirationCountElement) {
        // Simulate aspiration criteria (approximately 10% of total moves)
        const iterations = tabuData.accuracy_history?.length || 0;
        const movesPerIteration = 5;
        const aspirationRate = 0.1;
        const aspirationCount = Math.floor(iterations * movesPerIteration * aspirationRate);
        aspirationCountElement.textContent = aspirationCount;
    }
}

// Initialize search visualization
function initSearchVisualization(tabuData) {
    const canvas = document.getElementById('tabu-search-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = 'var(--bg-light, #f8f9fa)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Generate search trajectory
    const trajectory = generateSearchTrajectory(tabuData);
    
    // Draw tabu regions
    const tabuRegions = generateTabuRegions(trajectory);
    tabuRegions.forEach(region => {
        ctx.fillStyle = 'rgba(156, 39, 176, 0.1)';
        ctx.beginPath();
        ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(156, 39, 176, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Draw search trajectory
    if (trajectory.length > 1) {
        ctx.strokeStyle = 'var(--tabu-color, #9c27b0)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trajectory[0].x, trajectory[0].y);
        
        for (let i = 1; i < trajectory.length; i++) {
            ctx.lineTo(trajectory[i].x, trajectory[i].y);
        }
        
        ctx.stroke();
    }
    
    // Draw points along trajectory
    trajectory.forEach((point, index) => {
        // Different color for start, current, and best points
        if (index === 0) {
            // Start point
            ctx.fillStyle = 'rgba(156, 39, 176, 0.5)';
        } else if (index === trajectory.length - 1) {
            // Current point
            ctx.fillStyle = 'var(--tabu-color, #9c27b0)';
        } else if (point.isBest) {
            // Best point
            ctx.fillStyle = '#4caf50';
        } else {
            // Regular point
            ctx.fillStyle = 'rgba(156, 39, 176, 0.7)';
        }
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Update move details
    updateMoveDetails(trajectory, tabuRegions);
}

// Generate simulated search trajectory
function generateSearchTrajectory(tabuData) {
    const trajectory = [];
    const iterations = Math.min(tabuData.accuracy_history?.length || 10, 20);
    const canvasWidth = 400;
    const canvasHeight = 300;
    
    // Start point
    let x = Math.random() * (canvasWidth - 80) + 40;
    let y = Math.random() * (canvasHeight - 80) + 40;
    
    // Add start point
    trajectory.push({
        x,
        y,
        iteration: 0,
        fitness: Math.random() * 0.5,
        isBest: false
    });
    
    let bestFitness = trajectory[0].fitness;
    let bestIndex = 0;
    
    // Generate trajectory points
    for (let i = 1; i < iterations; i++) {
        // Random movement with some direction bias
        const moveX = (Math.random() - 0.5) * 40;
        const moveY = (Math.random() - 0.5) * 40;
        
        x = Math.max(20, Math.min(canvasWidth - 20, x + moveX));
        y = Math.max(20, Math.min(canvasHeight - 20, y + moveY));
        
        // Fitness based on accuracy history or random if not available
        const fitness = tabuData.accuracy_history ? tabuData.accuracy_history[i] : 
                      Math.min(1, trajectory[i-1].fitness + (Math.random() - 0.3) * 0.2);
        
        trajectory.push({
            x,
            y,
            iteration: i,
            fitness,
            isBest: false
        });
        
        // Update best point
        if (fitness > bestFitness) {
            bestFitness = fitness;
            bestIndex = i;
        }
    }
    
    // Mark the best point
    if (bestIndex > 0) {
        trajectory[bestIndex].isBest = true;
    }
    
    return trajectory;
}

// Generate tabu regions
function generateTabuRegions(trajectory) {
    const tabuRegions = [];
    
    // Create tabu regions around some points in the trajectory
    for (let i = 0; i < trajectory.length - 1; i += 2) {
        if (Math.random() > 0.5) { // Only create regions for some points
            tabuRegions.push({
                x: trajectory[i].x,
                y: trajectory[i].y,
                radius: 15 + Math.random() * 10,
                iteration: trajectory[i].iteration
            });
        }
    }
    
    return tabuRegions;
}

// Update move details display
function updateMoveDetails(trajectory, tabuRegions) {
    const detailsElement = document.getElementById('tabu-move-details');
    if (!detailsElement) return;
    
    // Get best point and current point
    const bestPoint = trajectory.find(p => p.isBest) || trajectory[trajectory.length - 1];
    const currentPoint = trajectory[trajectory.length - 1];
    
    let detailsText = 'Tabu Search Move Details:\n\n';
    
    // Best solution details
    detailsText += `Best Solution (Iteration ${bestPoint.iteration + 1}):\n`;
    detailsText += `  Position: (${bestPoint.x.toFixed(2)}, ${bestPoint.y.toFixed(2)})\n`;
    detailsText += `  Fitness: ${(bestPoint.fitness * 100).toFixed(2)}%\n\n`;
    
    // Current solution details
    detailsText += `Current Solution (Iteration ${currentPoint.iteration + 1}):\n`;
    detailsText += `  Position: (${currentPoint.x.toFixed(2)}, ${currentPoint.y.toFixed(2)})\n`;
    detailsText += `  Fitness: ${(currentPoint.fitness * 100).toFixed(2)}%\n\n`;
    
    // Tabu list details
    detailsText += `Tabu List (${tabuRegions.length} entries):\n`;
    tabuRegions.slice(0, 3).forEach((region, index) => {
        detailsText += `  Region ${index + 1}: Center (${region.x.toFixed(0)}, ${region.y.toFixed(0)}), Radius ${region.radius.toFixed(1)}\n`;
    });
    if (tabuRegions.length > 3) {
        detailsText += `  ... and ${tabuRegions.length - 3} more regions\n`;
    }
    
    detailsElement.textContent = detailsText;
}

// Create Tabu Search iteration table
function createTabuIterationTable(tabuData) {
    if (!tabuData.accuracy_history || !tabuData.accuracy_history.length) return;
    
    const container = document.getElementById('tabu-iterations-table');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create table element
    const table = document.createElement('table');
    table.className = 'iteration-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Iteration', 'Best Solution', 'Tabu List Size', 'Change'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Determine which iterations to show
    let iterations = [];
    const maxRows = 20;
    
    if (tabuData.accuracy_history.length <= maxRows) {
        // Show all iterations if there are fewer than maxRows
        iterations = Array.from({ length: tabuData.accuracy_history.length }, (_, i) => i);
    } else {
        // Show first 5, last 5, and some in the middle
        const firstCount = 5;
        const lastCount = 5;
        const middleCount = maxRows - firstCount - lastCount;
        
        // First iterations
        for (let i = 0; i < firstCount; i++) {
            iterations.push(i);
        }
        
        // Middle iterations (evenly distributed)
        if (middleCount > 0) {
            const step = (tabuData.accuracy_history.length - firstCount - lastCount) / (middleCount + 1);
            for (let i = 1; i <= middleCount; i++) {
                iterations.push(Math.floor(firstCount + i * step));
            }
        }
        
        // Last iterations
        for (let i = tabuData.accuracy_history.length - lastCount; i < tabuData.accuracy_history.length; i++) {
            iterations.push(i);
        }
    }
    
    // Add rows for selected iterations
    iterations.forEach(i => {
        const row = document.createElement('tr');
        
        // Iteration number cell
        const iterCell = document.createElement('td');
        iterCell.textContent = i + 1;
        row.appendChild(iterCell);
        
        // Best solution cell
        const bestCell = document.createElement('td');
        const accuracy = tabuData.accuracy_history[i];
        bestCell.textContent = `${(accuracy * 100).toFixed(2)}%`;
        row.appendChild(bestCell);
        
        // Tabu list size cell (simulated)
        const tabuListCell = document.createElement('td');
        // Simulate tabu list size (starts small, grows, then stabilizes)
        const tabuListSize = Math.min(tabuData.tabu_list_size || 10, Math.floor(i / 2) + 2);
        tabuListCell.textContent = tabuListSize;
        row.appendChild(tabuListCell);
        
        // Change cell
        const changeCell = document.createElement('td');
        if (i > 0) {
            const change = ((accuracy - tabuData.accuracy_history[i-1]) * 100).toFixed(2);
            const isPositive = change >= 0;
            changeCell.textContent = isPositive ? `+${change}%` : `${change}%`;
            changeCell.className = isPositive ? 'positive-change' : 'negative-change';
        } else {
            changeCell.textContent = '-';
        }
        row.appendChild(changeCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // Add 'Show All' button if data exceeds maxRows
    if (tabuData.accuracy_history.length > maxRows) {
        const showAllButton = document.createElement('button');
        showAllButton.className = 'btn btn-sm btn-outline-primary mt-2';
        showAllButton.textContent = 'Show All Iterations';
        showAllButton.addEventListener('click', () => {
            createTabuIterationTable({ ...tabuData, _showAll: true });
        });
        container.appendChild(showAllButton);
    }
}

// Setup tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('#tabu-data-tabs .nav-link');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs and tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding tab content
            const target = document.querySelector(tab.getAttribute('href'));
            if (target) {
                target.classList.add('active');
            }
        });
    });
}
