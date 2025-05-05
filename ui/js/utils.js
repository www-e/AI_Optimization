// Utility functions for the Hybrid AI Optimization UI

/**
 * Show the loading spinner
 */
export function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

/**
 * Hide the loading spinner
 */
export function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Display an error message
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the message in milliseconds
 */
export function displayErrorMessage(message, duration = 5000) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add to the main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.prepend(errorDiv);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            errorDiv.classList.add('fade-out');
            setTimeout(() => errorDiv.remove(), 500);
        }, duration);
    }
}

/**
 * Format algorithm name for display
 * @param {string} algorithm - The algorithm identifier
 * @returns {string} The formatted algorithm name
 */
export function formatAlgorithmName(algorithm) {
    switch (algorithm) {
        case 'ga':
            return 'Genetic Algorithm';
        case 'pso':
            return 'Particle Swarm Optimization';
        case 'aco':
            return 'Ant Colony Optimization';
        case 'tabu':
            return 'Tabu Search';
        default:
            return algorithm;
    }
}

/**
 * Get algorithm color
 * @param {string} algorithm - The algorithm identifier
 * @returns {string} The CSS color variable
 */
export function getAlgorithmColor(algorithm) {
    switch (algorithm) {
        case 'ga':
            return 'var(--ga-color)';
        case 'pso':
            return 'var(--pso-color)';
        case 'aco':
            return 'var(--aco-color)';
        case 'tabu':
            return 'var(--tabu-color)';
        default:
            return 'var(--primary)';
    }
}

/**
 * Fetch results from the server
 * @returns {Promise<Object>} The results data
 */
export async function fetchResults() {
    try {
        const response = await fetch('assets/results.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching results:', error);
        throw error;
    }
}

/**
 * Update the results display for a specific algorithm
 * @param {Object} algorithmData - The algorithm data
 * @param {string} algorithm - The algorithm identifier
 */
export function updateAlgorithmResults(algorithmData, algorithm) {
    // Find result elements
    const accuracyElement = document.getElementById(`${algorithm}-accuracy`);
    const timeElement = document.getElementById(`${algorithm}-time`);
    
    if (accuracyElement) {
        // Check for both final_accuracy and best_accuracy fields
        const accuracy = algorithmData?.final_accuracy !== undefined ? algorithmData.final_accuracy : 
                        algorithmData?.best_accuracy !== undefined ? algorithmData.best_accuracy : undefined;
        
        if (accuracy !== undefined) {
            accuracyElement.textContent = `${(accuracy * 100).toFixed(2)}%`;
        } else {
            accuracyElement.textContent = 'N/A';
        }
    }
    
    if (timeElement) {
        if (algorithmData && algorithmData.execution_time) {
            timeElement.textContent = `${algorithmData.execution_time.toFixed(2)}s`;
        } else {
            timeElement.textContent = 'N/A';
        }
    }
}

/**
 * Create a simple chart using Chart.js (simplified version for algorithm pages)
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - The data points
 * @param {string} color - The color for the chart
 * @param {string} label - The label for the dataset
 * @returns {Chart} The created chart instance
 */
export function createSimpleChart(containerId, data, color, label = 'Accuracy') {
    return createChart(containerId, data, color, label);
}

/**
 * Create a table showing iteration data
 * @param {Array|Object} data - Array of accuracy values or object with iteration data
 * @param {string} containerId - ID of the container element
 * @param {number} maxRows - Maximum number of rows to show (default: 20)
 * @param {Object} options - Additional options for the table
 */
export function createIterationTable(data, containerId, maxRows = 20, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    
    // Handle different data formats
    let accuracyData = [];
    let fitnessData = [];
    let diversityData = [];
    let parameterData = [];
    
    // Check if data is an array (backward compatibility) or an object with detailed information
    if (Array.isArray(data)) {
        accuracyData = data;
    } else if (typeof data === 'object') {
        // Extract data from the object
        accuracyData = data.accuracy_history || [];
        fitnessData = data.fitness_history || [];
        diversityData = data.diversity_history || [];
        parameterData = data.parameter_history || [];
    }
    
    if (!accuracyData.length) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create table element
    const table = document.createElement('table');
    table.className = 'iteration-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Define columns based on available data
    const columns = ['Iteration', 'Accuracy', 'Change'];
    
    // Add fitness column if fitness data is available
    if (fitnessData.length > 0) {
        columns.push('Fitness');
    }
    
    // Add diversity column if diversity data is available
    if (diversityData.length > 0) {
        columns.push('Diversity');
    }
    
    // Add parameter columns if parameter data is available
    const parameterColumns = [];
    if (parameterData.length > 0 && parameterData[0]) {
        Object.keys(parameterData[0]).forEach(param => {
            parameterColumns.push(param);
            columns.push(param);
        });
    }
    
    // Create header cells
    columns.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Determine which iterations to show
    let iterations = [];
    
    if (accuracyData.length <= maxRows) {
        // Show all iterations if there are fewer than maxRows
        iterations = Array.from({ length: accuracyData.length }, (_, i) => i);
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
            const step = (accuracyData.length - firstCount - lastCount) / (middleCount + 1);
            for (let i = 1; i <= middleCount; i++) {
                iterations.push(Math.floor(firstCount + i * step));
            }
        }
        
        // Last iterations
        for (let i = accuracyData.length - lastCount; i < accuracyData.length; i++) {
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
        
        // Accuracy cell
        const accCell = document.createElement('td');
        const accuracy = (accuracyData[i] * 100).toFixed(2);
        accCell.textContent = `${accuracy}%`;
        row.appendChild(accCell);
        
        // Change cell
        const changeCell = document.createElement('td');
        if (i > 0) {
            const change = ((accuracyData[i] - accuracyData[i-1]) * 100).toFixed(2);
            const isPositive = change >= 0;
            changeCell.textContent = isPositive ? `+${change}%` : `${change}%`;
            changeCell.className = isPositive ? 'positive-change' : 'negative-change';
        } else {
            changeCell.textContent = '-';
        }
        row.appendChild(changeCell);
        
        // Fitness cell (if available)
        if (fitnessData.length > 0) {
            const fitnessCell = document.createElement('td');
            if (i < fitnessData.length) {
                fitnessCell.textContent = fitnessData[i].toFixed(4);
                // Add visual indicator for fitness improvement
                if (i > 0 && fitnessData[i] !== fitnessData[i-1]) {
                    const isImproved = fitnessData[i] > fitnessData[i-1];
                    fitnessCell.className = isImproved ? 'positive-change' : 'negative-change';
                }
            } else {
                fitnessCell.textContent = 'N/A';
            }
            row.appendChild(fitnessCell);
        }
        
        // Diversity cell (if available)
        if (diversityData.length > 0) {
            const diversityCell = document.createElement('td');
            if (i < diversityData.length) {
                diversityCell.textContent = diversityData[i].toFixed(4);
            } else {
                diversityCell.textContent = 'N/A';
            }
            row.appendChild(diversityCell);
        }
        
        // Parameter cells (if available)
        if (parameterData.length > 0 && parameterColumns.length > 0) {
            parameterColumns.forEach(param => {
                const paramCell = document.createElement('td');
                if (i < parameterData.length && parameterData[i] && parameterData[i][param] !== undefined) {
                    const value = parameterData[i][param];
                    paramCell.textContent = typeof value === 'number' ? value.toFixed(4) : value.toString();
                } else {
                    paramCell.textContent = 'N/A';
                }
                row.appendChild(paramCell);
            });
        }
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Create a container for the table with a scrollable area
    const tableContainer = document.createElement('div');
    tableContainer.className = 'iteration-table-container';
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
    
    // Add statistics summary
    if (accuracyData.length > 0) {
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'iteration-summary';
        
        // Calculate statistics
        const initialAccuracy = accuracyData[0] * 100;
        const finalAccuracy = accuracyData[accuracyData.length - 1] * 100;
        const bestAccuracy = Math.max(...accuracyData) * 100;
        const totalImprovement = finalAccuracy - initialAccuracy;
        
        // Find iteration with best accuracy
        const bestIterationIndex = accuracyData.indexOf(Math.max(...accuracyData));
        
        summaryDiv.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Initial Accuracy:</span>
                <span class="summary-value">${initialAccuracy.toFixed(2)}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Final Accuracy:</span>
                <span class="summary-value">${finalAccuracy.toFixed(2)}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Best Accuracy:</span>
                <span class="summary-value">${bestAccuracy.toFixed(2)}% (iteration ${bestIterationIndex + 1})</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Improvement:</span>
                <span class="summary-value ${totalImprovement >= 0 ? 'positive-change' : 'negative-change'}">
                    ${totalImprovement >= 0 ? '+' : ''}${totalImprovement.toFixed(2)}%
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Iterations:</span>
                <span class="summary-value">${accuracyData.length}</span>
            </div>
        `;
        
        container.appendChild(summaryDiv);
    }
    
    // Add 'Show All' button if data exceeds maxRows
    if (accuracyData.length > maxRows) {
        const showAllButton = document.createElement('button');
        showAllButton.className = 'btn btn-sm btn-outline-primary mt-2';
        showAllButton.textContent = 'Show All Iterations';
        showAllButton.addEventListener('click', () => {
            createIterationTable(data, containerId, accuracyData.length, options);
        });
        container.appendChild(showAllButton);
    }
}

/**
 * Create a chart using Chart.js
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - The data points
 * @param {string} color - The color for the chart
 * @param {string} label - The label for the dataset
 * @returns {Chart} The created chart instance
 */
export function createChart(containerId, data, color, label = 'Accuracy') {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear container
    container.innerHTML = '';
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Create labels (iteration numbers)
    const labels = Array.from({ length: data.length }, (_, i) => i + 1);
    
    // Convert accuracy values to percentages
    const percentData = data.map(value => value * 100);
    
    // Calculate moving average for smoother visualization
    const windowSize = Math.max(1, Math.floor(data.length / 20)); // 5% of data points
    const movingAvgData = [];
    
    for (let i = 0; i < percentData.length; i++) {
        let sum = 0;
        let count = 0;
        
        for (let j = Math.max(0, i - windowSize); j <= Math.min(percentData.length - 1, i + windowSize); j++) {
            sum += percentData[j];
            count++;
        }
        
        movingAvgData.push(sum / count);
    }
    
    // Create gradient fill
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    
    // Convert CSS variable to actual color value for gradient
    const tempDiv = document.createElement('div');
    tempDiv.style.color = color;
    document.body.appendChild(tempDiv);
    const computedColor = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    // Parse RGB values
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    let r, g, b;
    
    if (rgbMatch) {
        r = parseInt(rgbMatch[1]);
        g = parseInt(rgbMatch[2]);
        b = parseInt(rgbMatch[3]);
        
        // Add color stops with proper rgba format
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`);
    } else {
        // Fallback to a safe default if parsing fails
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.1)');
    }
    
    // Create chart
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: percentData,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    fill: false,
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHitRadius: 10,
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: 'white',
                    pointHoverBorderWidth: 2,
                    order: 1
                },
                {
                    label: `${label} (Trend)`,
                    data: movingAvgData,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'var(--text-primary)',
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    displayColors: true,
                    padding: 10,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Iteration ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `${label}: ${context.parsed.y.toFixed(2)}%`;
                            } else {
                                return `Trend: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 100,
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'var(--dark-border)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Accuracy (%)',
                        color: 'var(--text-primary)',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--text-secondary)',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'var(--dark-border)',
                        drawBorder: false,
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Iteration',
                        color: 'var(--text-primary)',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: {
                    top: 5,
                    right: 15,
                    bottom: 5,
                    left: 5
                }
            }
        }
    });
}

/**
 * Run an optimization algorithm
 * @param {string} algorithm - The algorithm identifier
 * @param {Object} parameters - The algorithm parameters
 * @returns {Promise<Object>} The results
 */
export async function runOptimization(algorithm, parameters) {
    showLoading();
    
    try {
        console.log(`Running ${algorithm} optimization with parameters:`, parameters);
        
        // Make an API call to the backend
        const response = await fetch(`/api/run/${algorithm}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parameters)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Get the results from the backend
        const results = await response.json();
        console.log(`Received results for ${algorithm}:`, results);
        
        // Check if the results contain an error
        if (results.error) {
            throw new Error(results.error);
        }
        
        return results;
    } catch (error) {
        console.error(`Error running ${algorithm} optimization:`, error);
        displayErrorMessage(`Error running ${algorithm} optimization: ${error.message}`);
        
        // Return a minimal valid result structure to prevent UI errors
        return {
            best_accuracy: 0,
            accuracy_history: [],
            execution_time: 0
        };
    } finally {
        hideLoading();
    }
}
