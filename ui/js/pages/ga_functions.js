// Generate a representation of the best individual
function generateBestIndividualRepresentation(gaData) {
    // This would normally come from the backend, but we'll simulate it here
    const genotype = gaData.genotype || 'binary';
    const layers = [4, 8, 3]; // Input, hidden, output layers for Iris dataset
    let representation = '';
    
    representation += `Best Individual (Generation ${gaData.accuracy_history.length})\n`;
    representation += `Fitness: ${(gaData.best_accuracy * 100).toFixed(2)}%\n`;
    representation += `Genotype: ${formatGenotypeString(genotype)}\n\n`;
    representation += `Neural Network Structure: ${layers.join('-')} (${getTotalWeights(layers)} weights)\n`;
    
    // Add chromosome representation based on genotype
    if (genotype === 'binary') {
        // Binary representation (0s and 1s)
        representation += `\nChromosome (Binary):\n`;
        for (let i = 0; i < 3; i++) { // Show 3 sample weight sections
            const binarySection = generateRandomBinary(20);
            representation += `${binarySection}\n`;
        }
        representation += `... (truncated)\n`;
    } else if (genotype === 'real_value') {
        // Real value representation (floating point numbers)
        representation += `\nChromosome (Real Values):\n`;
        representation += `Layer 1-2 Weights (sample):\n`;
        for (let i = 0; i < 3; i++) {
            const weights = generateRandomWeights(4);
            representation += `  [${weights.join(', ')}]\n`;
        }
        representation += `... (truncated)\n`;
    } else if (genotype === 'integer') {
        // Integer representation
        representation += `\nChromosome (Integer Values):\n`;
        representation += `Layer 1-2 Weights (sample):\n`;
        for (let i = 0; i < 3; i++) {
            const weights = generateRandomIntegers(4);
            representation += `  [${weights.join(', ')}]\n`;
        }
        representation += `... (truncated)\n`;
    }
    
    return representation;
}

// Helper function to format genotype string
function formatGenotypeString(genotype) {
    if (genotype === 'real_value') return 'Real Value';
    return genotype.charAt(0).toUpperCase() + genotype.slice(1);
}

// Helper function to generate random binary string
function generateRandomBinary(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.random() > 0.5 ? '1' : '0';
    }
    return result;
}

// Helper function to generate random weights
function generateRandomWeights(count) {
    const weights = [];
    for (let i = 0; i < count; i++) {
        weights.push((Math.random() * 2 - 1).toFixed(4));
    }
    return weights;
}

// Helper function to generate random integers
function generateRandomIntegers(count) {
    const integers = [];
    for (let i = 0; i < count; i++) {
        integers.push(Math.floor(Math.random() * 21 - 10));
    }
    return integers;
}

// Helper function to calculate total weights in neural network
function getTotalWeights(layers) {
    let total = 0;
    for (let i = 0; i < layers.length - 1; i++) {
        total += layers[i] * layers[i + 1];
    }
    return total;
}

// Create detailed GA iteration table
function createDetailedGAIterationTable(gaData) {
    if (!gaData.accuracy_history || !gaData.accuracy_history.length) return;
    
    const container = document.getElementById('ga-iterations-table');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create table element
    const table = document.createElement('table');
    table.className = 'iteration-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Iteration', 'Initial Population', 'Fitness', 'Error Rate', 'Change'].forEach(text => {
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
    
    if (gaData.accuracy_history.length <= maxRows) {
        // Show all iterations if there are fewer than maxRows
        iterations = Array.from({ length: gaData.accuracy_history.length }, (_, i) => i);
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
            const step = (gaData.accuracy_history.length - firstCount - lastCount) / (middleCount + 1);
            for (let i = 1; i <= middleCount; i++) {
                iterations.push(Math.floor(firstCount + i * step));
            }
        }
        
        // Last iterations
        for (let i = gaData.accuracy_history.length - lastCount; i < gaData.accuracy_history.length; i++) {
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
        
        // Initial population cell
        const popCell = document.createElement('td');
        popCell.textContent = gaData.population_size || 50;
        row.appendChild(popCell);
        
        // Fitness cell
        const fitnessCell = document.createElement('td');
        const accuracy = gaData.accuracy_history[i];
        const fitnessValue = (accuracy * 100).toFixed(2);
        fitnessCell.textContent = `${fitnessValue}%`;
        row.appendChild(fitnessCell);
        
        // Error rate cell
        const errorCell = document.createElement('td');
        const errorRate = (1 - accuracy) * 100;
        errorCell.textContent = `${errorRate.toFixed(2)}%`;
        row.appendChild(errorCell);
        
        // Change cell
        const changeCell = document.createElement('td');
        if (i > 0) {
            const change = ((accuracy - gaData.accuracy_history[i-1]) * 100).toFixed(2);
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
    if (gaData.accuracy_history.length > maxRows) {
        const showAllButton = document.createElement('button');
        showAllButton.className = 'btn btn-sm btn-outline-primary mt-2';
        showAllButton.textContent = 'Show All Iterations';
        showAllButton.addEventListener('click', () => {
            createDetailedGAIterationTable({ ...gaData, _showAll: true });
        });
        container.appendChild(showAllButton);
    }
}
