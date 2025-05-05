// Compare page functionality
import { showLoading, hideLoading, displayErrorMessage, fetchResults, formatAlgorithmName, getAlgorithmColor, createChart, createIterationTable } from '../utils.js';
import { runAllAlgorithms } from '../algorithms/compare.js';

// Initialize the page
export function init() {
    console.log('Initializing Compare page');
    setupEventListeners();
    loadParameterSummaries();
    loadResults();
}

// Set up event listeners
function setupEventListeners() {
    const runButton = document.getElementById('compare-run-btn');
    if (runButton) {
        runButton.addEventListener('click', runComparison);
    }
    
    // Set up accordion functionality
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('collapsed');
            const target = document.getElementById(button.getAttribute('data-bs-target').replace('#', ''));
            if (target) {
                target.classList.toggle('collapse');
            }
        });
    });
}

// Run comparison of all algorithms
async function runComparison() {
    try {
        showLoading();
        
        // Run all algorithms
        const results = await runAllAlgorithms();
        
        // Show results section
        const resultsSection = document.getElementById('comparison-results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
        // Update UI with results
        updateComparisonResults(results);
        
    } catch (error) {
        console.error('Error running comparison:', error);
        displayErrorMessage(`Error running algorithm comparison: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Load existing results if available
async function loadResults() {
    try {
        const results = await fetchResults();
        if (results) {
            // Show results section
            const resultsSection = document.getElementById('comparison-results');
            if (resultsSection) {
                resultsSection.style.display = 'block';
            }
            
            // Update UI with results
            updateComparisonResults(results);
        }
    } catch (error) {
        console.warn('Could not load existing results:', error);
    }
}

// Chart instances for comparison charts
let accuracyChart = null;
let timeChart = null;
let convergenceChart = null;

// Update UI with comparison results
function updateComparisonResults(results) {
    console.log('Updating comparison results with:', results);
    
    // Update table values
    const algorithms = ['ga', 'pso', 'aco', 'tabu'];
    
    // Arrays to store data for charts
    const algorithmNames = [];
    const accuracyData = [];
    const timeData = [];
    const convergenceData = [];
    const accuracyHistories = {};
    const colors = {
        ga: 'var(--ga-color)',
        pso: 'var(--pso-color)',
        aco: 'var(--aco-color)',
        tabu: 'var(--tabu-color)'
    };
    
    // Handle different response structures
    let algorithmsData = results;
    
    // Check if the response has an 'algorithms' property (from the 'all' endpoint)
    if (results.algorithms) {
        algorithmsData = results.algorithms;
    }
    
    // Process each algorithm
    algorithms.forEach(algo => {
        const accuracyElement = document.getElementById(`compare-${algo}-accuracy`);
        const timeElement = document.getElementById(`compare-${algo}-time`);
        const convergenceElement = document.getElementById(`compare-${algo}-convergence`);
        
        // Get algorithm data, handling both direct and nested structures
        const algoData = algorithmsData[algo];
        
        if (algoData) {
            // Add algorithm name for charts
            algorithmNames.push(formatAlgorithmName(algo));
            
            // Update accuracy - check for both final_accuracy and best_accuracy
            const accuracy = algoData?.final_accuracy !== undefined ? algoData.final_accuracy : 
                          algoData?.best_accuracy !== undefined ? algoData.best_accuracy : undefined;
            
            if (accuracyElement && accuracy !== undefined) {
                const accuracyPercent = (accuracy * 100).toFixed(2);
                accuracyElement.textContent = `${accuracyPercent}%`;
                accuracyData.push(parseFloat(accuracyPercent));
            } else {
                accuracyElement.textContent = 'N/A';
                accuracyData.push(0);
            }
            
            // Update time
            if (timeElement && algoData.execution_time) {
                timeElement.textContent = `${algoData.execution_time.toFixed(2)}s`;
                timeData.push(algoData.execution_time);
            } else {
                timeElement.textContent = 'N/A';
                timeData.push(0);
            }
            
            // Update convergence
            let convergenceValue = 0;
            if (convergenceElement && algoData.convergence_speed) {
                convergenceElement.textContent = `${algoData.convergence_speed}`;
                convergenceValue = parseInt(algoData.convergence_speed);
            } else if (convergenceElement && algoData.accuracy_history) {
                // Calculate convergence speed as the number of iterations to reach 90% of final accuracy
                const finalAccuracy = accuracy; // Use the accuracy we already determined
                const threshold = finalAccuracy * 0.9;
                let convergenceIteration = algoData.accuracy_history.findIndex(acc => acc >= threshold);
                if (convergenceIteration === -1) {
                    convergenceIteration = algoData.accuracy_history.length;
                }
                convergenceElement.textContent = `${convergenceIteration} iterations`;
                convergenceValue = convergenceIteration;
            } else {
                convergenceElement.textContent = 'N/A';
            }
            convergenceData.push(convergenceValue);
            
            // Store accuracy history for the convergence chart
            if (algoData.accuracy_history && algoData.accuracy_history.length > 0) {
                accuracyHistories[algo] = algoData.accuracy_history;
            }
        }
    });
    
    // Create accuracy comparison chart (bar chart)
    createAccuracyBarChart(algorithmNames, accuracyData);
    
    // Create time comparison chart (bar chart)
    createTimeBarChart(algorithmNames, timeData);
    
    // Create convergence comparison chart (line chart)
    createConvergenceLineChart(accuracyHistories);
    
    // Create iteration tables for each algorithm
    algorithms.forEach(algo => {
        const algoData = algorithmsData[algo];
        if (algoData && algoData.accuracy_history && algoData.accuracy_history.length > 0) {
            // Create a container for the iteration table if it doesn't exist
            let tableContainer = document.getElementById(`compare-${algo}-iterations-container`);
            if (!tableContainer) {
                tableContainer = document.createElement('div');
                tableContainer.id = `compare-${algo}-iterations-container`;
                tableContainer.className = 'table-container mt-4';
                
                const heading = document.createElement('h4');
                heading.textContent = `${formatAlgorithmName(algo)} Iterations`;
                tableContainer.appendChild(heading);
                
                const tableDiv = document.createElement('div');
                tableDiv.id = `compare-${algo}-iterations-table`;
                tableContainer.appendChild(tableDiv);
                
                // Find a good place to add the table
                const analysisSection = document.getElementById('algorithm-analysis');
                if (analysisSection) {
                    analysisSection.parentNode.insertBefore(tableContainer, analysisSection);
                }
            }
            
            // Create the iteration table
            createIterationTable(algoData.accuracy_history, `compare-${algo}-iterations-table`);
        }
    });

    // Update analysis
    updateAnalysis(results, algorithmNames, accuracyData, timeData, convergenceData);
}

// Create accuracy comparison bar chart
function createAccuracyBarChart(algorithmNames, accuracyData) {
    const container = document.getElementById('accuracy-chart-container');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Create canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Define colors for each algorithm
    const backgroundColors = [
        'rgba(54, 162, 235, 0.7)',  // GA - Blue
        'rgba(255, 99, 132, 0.7)',   // PSO - Red
        'rgba(75, 192, 192, 0.7)',   // ACO - Green
        'rgba(153, 102, 255, 0.7)'   // Tabu - Purple
    ];

    const borderColors = [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
    ];

    // Create chart
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: algorithmNames,
            datasets: [{
                label: 'Accuracy (%)',
                data: accuracyData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 5,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 11
                        }
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
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `Accuracy: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Create time comparison bar chart
function createTimeBarChart(algorithmNames, timeData) {
    const container = document.getElementById('time-chart-container');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Create canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Define colors for each algorithm
    const backgroundColors = [
        'rgba(54, 162, 235, 0.7)',  // GA - Blue
        'rgba(255, 99, 132, 0.7)',   // PSO - Red
        'rgba(75, 192, 192, 0.7)',   // ACO - Green
        'rgba(153, 102, 255, 0.7)'   // Tabu - Purple
    ];

    const borderColors = [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
    ];

    // Create chart
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: algorithmNames,
            datasets: [{
                label: 'Execution Time (s)',
                data: timeData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 5,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                            return value + 's';
                        },
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: 'Execution Time (seconds)',
                        color: 'var(--text-primary)',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `Time: ${context.parsed.y.toFixed(2)}s`;
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Create convergence line chart
function createConvergenceLineChart(accuracyHistories) {
    const container = document.getElementById('convergence-chart-container');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Create canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Prepare datasets
    const datasets = [];
    const colors = {
        ga: {
            border: 'rgba(54, 162, 235, 1)',
            background: 'rgba(54, 162, 235, 0.1)'
        },
        pso: {
            border: 'rgba(255, 99, 132, 1)',
            background: 'rgba(255, 99, 132, 0.1)'
        },
        aco: {
            border: 'rgba(75, 192, 192, 1)',
            background: 'rgba(75, 192, 192, 0.1)'
        },
        tabu: {
            border: 'rgba(153, 102, 255, 1)',
            background: 'rgba(153, 102, 255, 0.1)'
        }
    };
    
    // Find the maximum length of history arrays
    let maxLength = 0;
    for (const algo in accuracyHistories) {
        maxLength = Math.max(maxLength, accuracyHistories[algo].length);
    }

    // Create labels (iterations)
    const labels = Array.from({ length: maxLength }, (_, i) => i + 1);

    // Create datasets for each algorithm
    for (const algo in accuracyHistories) {
        const history = accuracyHistories[algo];
        if (history && history.length > 0) {
            datasets.push({
                label: formatAlgorithmName(algo),
                data: history.map(value => value * 100), // Convert to percentage
                borderColor: colors[algo].border,
                backgroundColor: colors[algo].background,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5
            });
        }
    }

    // Create chart
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 11
                        }
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
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        maxTicksLimit: 10,
                        font: {
                            size: 11
                        }
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
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'var(--text-primary)',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Iteration ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Update analysis section with detailed algorithm comparison
function updateAnalysis(results, algorithmNames, accuracyData, timeData, convergenceData) {
    const analysisElement = document.getElementById('algorithm-analysis');
    if (!analysisElement) return;
    
    // Get best algorithm
    const bestAlgorithm = results.best_algorithm || 'None';
    const bestAccuracy = results.best_accuracy || 0;
    
    // Define strengths and weaknesses for each algorithm
    const algorithmCharacteristics = {
        ga: {
            strengths: 'Good exploration, handles complex solution spaces well',
            weaknesses: 'Can be computationally expensive, may converge slowly'
        },
        pso: {
            strengths: 'Fast convergence, simple implementation, fewer parameters',
            weaknesses: 'May get trapped in local optima, sensitive to parameter settings'
        },
        aco: {
            strengths: 'Good for discrete problems, handles constraints well',
            weaknesses: 'Slower convergence, requires careful parameter tuning'
        },
        tabu: {
            strengths: 'Avoids local optima, good for constrained problems',
            weaknesses: 'Memory intensive, parameter selection can be difficult'
        }
    };
    
    // Create analysis text
    let analysisHTML = `
        <div class="analysis-section">
            <h4>Best Performing Algorithm: <span class="${bestAlgorithm}-text">${formatAlgorithmName(bestAlgorithm)}</span></h4>
            <p>With an accuracy of ${(bestAccuracy * 100).toFixed(2)}%</p>
        </div>
        
        <div class="analysis-section">
            <h4>Performance Analysis</h4>
            <div class="comparison-table-container">
                <table class="comparison-detail-table">
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Accuracy</th>
                            <th>Execution Time</th>
                            <th>Convergence</th>
                            <th>Efficiency</th>
                            <th>Strengths</th>
                            <th>Weaknesses</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Add analysis for each algorithm
    const algorithms = ['ga', 'pso', 'aco', 'tabu'];
    
    algorithms.forEach((algo, index) => {
        if (results.algorithms && results.algorithms[algo]) {
            const algoData = results.algorithms[algo];
            const accuracy = algoData.final_accuracy || algoData.best_accuracy || 0;
            const time = algoData.execution_time || 0;
            const convergence = convergenceData[index] || 'N/A';
            
            // Calculate efficiency (accuracy / time)
            const efficiency = time > 0 ? (accuracy / time).toFixed(4) : 'N/A';
            
            // Determine if this is the best algorithm
            const isBest = algo === bestAlgorithm;
            const rowClass = isBest ? 'best-algorithm' : '';
            
            analysisHTML += `
                <tr class="${rowClass}">
                    <td><span class="${algo}-text">${formatAlgorithmName(algo)}</span></td>
                    <td>${(accuracy * 100).toFixed(2)}%</td>
                    <td>${time.toFixed(2)}s</td>
                    <td>${convergence} iterations</td>
                    <td>${efficiency === 'N/A' ? 'N/A' : efficiency}</td>
                    <td>${algorithmCharacteristics[algo].strengths}</td>
                    <td>${algorithmCharacteristics[algo].weaknesses}</td>
                </tr>
            `;
        }
    });
    
    analysisHTML += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="analysis-section">
            <h4>Recommendations</h4>
            <p>
    `;
    
    // Add recommendations based on results
    if (bestAlgorithm !== 'None') {
        analysisHTML += `
            Based on the results, <span class="${bestAlgorithm}-text">${formatAlgorithmName(bestAlgorithm)}</span> 
            performed best for this dataset and neural network architecture. 
        </p>`;
        
        // Add specific recommendations based on the best algorithm
        switch (bestAlgorithm) {
            case 'ga':
                analysisHTML += `
                    <ul>
                        <li><strong>Parameter Tuning:</strong> Consider increasing the population size for better exploration and generations for more refinement.</li>
                        <li><strong>Crossover & Mutation:</strong> Experiment with different crossover methods and mutation rates to balance exploration and exploitation.</li>
                        <li><strong>Selection Strategy:</strong> Try different selection strategies like tournament or roulette wheel to see which works best.</li>
                    </ul>
                `;
                break;
            case 'pso':
                analysisHTML += `
                    <ul>
                        <li><strong>Parameter Tuning:</strong> Adjust the cognitive and social coefficients to fine-tune the balance between exploration and exploitation.</li>
                        <li><strong>Inertia Weight:</strong> Consider using a decreasing inertia weight strategy to improve convergence.</li>
                        <li><strong>Swarm Size:</strong> Experiment with different swarm sizes to find the optimal balance between diversity and computation time.</li>
                    </ul>
                `;
                break;
            case 'aco':
                analysisHTML += `
                    <ul>
                        <li><strong>Parameter Tuning:</strong> Adjust the pheromone importance and evaporation rate to improve performance.</li>
                        <li><strong>Ant Count:</strong> Increase the number of ants for better exploration of the solution space.</li>
                        <li><strong>Pheromone Strategy:</strong> Consider different pheromone update strategies to improve convergence.</li>
                    </ul>
                `;
                break;
            case 'tabu':
                analysisHTML += `
                    <ul>
                        <li><strong>Parameter Tuning:</strong> Adjust the tabu list size and neighborhood size to balance between exploration and exploitation.</li>
                        <li><strong>Step Size:</strong> Experiment with different step sizes to find the optimal balance between exploration and exploitation.</li>
                        <li><strong>Aspiration Criteria:</strong> Consider implementing aspiration criteria to allow promising moves even if they are tabu.</li>
                    </ul>
                `;
                break;
        }
        
        // Add general recommendations
        analysisHTML += `
            <p><strong>General Recommendations:</strong></p>
            <ul>
                <li><strong>Hybrid Approach:</strong> Consider combining ${formatAlgorithmName(bestAlgorithm)} with other algorithms to leverage their complementary strengths.</li>
                <li><strong>Neural Network Architecture:</strong> Experiment with different neural network architectures to see if they work better with this optimization approach.</li>
                <li><strong>Ensemble Methods:</strong> Consider using an ensemble of the best-performing algorithms to improve overall performance.</li>
            </ul>
        `;
    } else {
        analysisHTML += `
            <p>No algorithm data available. Run the comparison to see recommendations.</p>
        `;
    }
    
    analysisHTML += `</div>`;
    
    // Update the analysis element
    analysisElement.innerHTML = analysisHTML;
}

// Load parameter summaries from the individual algorithm pages
function loadParameterSummaries() {
    // GA parameters
    updateParameterSummary('ga', {
        'population-size': document.getElementById('ga-population-size')?.value || '50',
        'generations': document.getElementById('ga-generations')?.value || '100',
        'mutation-rate': document.getElementById('ga-mutation-rate')?.value || '0.1',
        'selection-method': document.getElementById('ga-selection-method')?.options[document.getElementById('ga-selection-method')?.selectedIndex || 0]?.text || 'Tournament',
        'crossover-method': document.getElementById('ga-crossover-method')?.options[document.getElementById('ga-crossover-method')?.selectedIndex || 0]?.text || 'Single Point',
        'elitism': document.getElementById('ga-elitism')?.value || '2'
    });
    
    // PSO parameters
    updateParameterSummary('pso', {
        'swarm-size': document.getElementById('pso-swarm-size')?.value || '30',
        'iterations': document.getElementById('pso-iterations')?.value || '100',
        'inertia': document.getElementById('pso-inertia')?.value || '0.7',
        'cognitive': document.getElementById('pso-cognitive')?.value || '1.5',
        'social': document.getElementById('pso-social')?.value || '1.5',
        'topology': document.getElementById('pso-topology')?.options[document.getElementById('pso-topology')?.selectedIndex || 0]?.text || 'Global Best'
    });
    
    // ACO parameters
    updateParameterSummary('aco', {
        'ant-count': document.getElementById('aco-ant-count')?.value || '20',
        'iterations': document.getElementById('aco-iterations')?.value || '100',
        'pheromone-importance': document.getElementById('aco-pheromone-importance')?.value || '1.0',
        'heuristic-importance': document.getElementById('aco-heuristic-importance')?.value || '2.0',
        'evaporation-rate': document.getElementById('aco-evaporation-rate')?.value || '0.5',
        'initial-pheromone': document.getElementById('aco-initial-pheromone')?.value || '0.1'
    });
    
    // Tabu parameters
    updateParameterSummary('tabu', {
        'iterations': document.getElementById('tabu-iterations')?.value || '100',
        'list-size': document.getElementById('tabu-list-size')?.value || '10',
        'neighborhood-size': document.getElementById('tabu-neighborhood-size')?.value || '20',
        'step-size': document.getElementById('tabu-step-size')?.value || '0.1',
        'aspiration': document.getElementById('tabu-aspiration')?.options[document.getElementById('tabu-aspiration')?.selectedIndex || 0]?.text || 'Best Solution',
        'diversification': document.getElementById('tabu-diversification')?.checked ? 'Enabled' : 'Disabled'
    });
}

// Update parameter summary in the comparison page
function updateParameterSummary(algorithm, parameters) {
    Object.keys(parameters).forEach(param => {
        const element = document.getElementById(`${algorithm}-summary-${param}`);
        if (element) {
            element.textContent = parameters[param];
        }
    });
}
