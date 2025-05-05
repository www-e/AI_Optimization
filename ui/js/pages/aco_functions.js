// Set up tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('#aco-data-tabs .nav-link');
    const tabContents = document.querySelectorAll('.tab-content .tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs and tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => {
                tc.classList.remove('show', 'active');
            });
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get the target content id from href attribute
            const targetId = tab.getAttribute('href');
            const targetContent = document.querySelector(targetId);
            
            if (targetContent) {
                targetContent.classList.add('show', 'active');
            }
        });
    });
}

// Initialize the path canvas
function initializePathCanvas() {
    pathCanvas = document.getElementById('aco-path-canvas');
    if (pathCanvas) {
        pathContext = pathCanvas.getContext('2d');
        resizePathCanvas();
    }
}

// Resize canvas to fit container
function resizePathCanvas() {
    if (pathCanvas) {
        const container = pathCanvas.parentElement;
        pathCanvas.width = container.clientWidth;
        pathCanvas.height = container.clientHeight;
    }
}

// Enrich the result data with visualization information
function enrichResultWithVisualizationData(result, parameters) {
    // This would normally come from the backend, but we'll simulate it here
    const antCount = parameters.ant_count;
    const iterations = parameters.iterations;
    
    // Generate nodes (feature points in the dataset)
    nodes = [];
    for (let i = 0; i < 10; i++) {
        nodes.push({
            id: i,
            x: Math.random() * 0.8 + 0.1,  // Keep away from edges
            y: Math.random() * 0.8 + 0.1
        });
    }
    
    // Generate pheromone matrix
    pheromoneMatrix = [];
    for (let i = 0; i < nodes.length; i++) {
        pheromoneMatrix[i] = [];
        for (let j = 0; j < nodes.length; j++) {
            // Higher pheromone on shorter distances
            if (i === j) {
                pheromoneMatrix[i][j] = 0;  // No self-loops
            } else {
                const distance = Math.sqrt(
                    Math.pow(nodes[i].x - nodes[j].x, 2) + 
                    Math.pow(nodes[i].y - nodes[j].y, 2)
                );
                // Inverse of distance as initial pheromone level
                pheromoneMatrix[i][j] = 0.1 + Math.random() * 0.9 * (1 - distance);
            }
        }
    }
    
    // Generate a best path
    bestPath = [];
    let current = 0;  // Start at node 0
    let visited = new Set([current]);
    bestPath.push(current);
    
    // Simple greedy path based on pheromone levels
    while (visited.size < nodes.length) {
        let maxPheromone = -1;
        let nextNode = -1;
        
        for (let i = 0; i < nodes.length; i++) {
            if (!visited.has(i) && pheromoneMatrix[current][i] > maxPheromone) {
                maxPheromone = pheromoneMatrix[current][i];
                nextNode = i;
            }
        }
        
        if (nextNode === -1) break;  // No more nodes to visit
        
        bestPath.push(nextNode);
        visited.add(nextNode);
        current = nextNode;
    }
    
    // Add the first node to complete the cycle
    bestPath.push(bestPath[0]);
    
    // Add visualization data to result
    result.visualization = {
        nodes: nodes,
        pheromone_matrix: pheromoneMatrix,
        best_path: bestPath,
        ant_count: antCount,
        convergence_iteration: Math.floor(iterations * 0.7),  // Simulate convergence at 70% of iterations
        pheromone_updates: iterations * antCount,
        path_probabilities: generatePathProbabilities()
    };
    
    return result;
}

// Generate path probabilities for visualization
function generatePathProbabilities() {
    const probabilities = [];
    
    // For each node, calculate probabilities to other nodes
    for (let i = 0; i < nodes.length; i++) {
        const nodeProbs = [];
        let sum = 0;
        
        // Calculate sum of pheromone levels for normalization
        for (let j = 0; j < nodes.length; j++) {
            if (i !== j) {
                sum += pheromoneMatrix[i][j];
            }
        }
        
        // Calculate probabilities
        for (let j = 0; j < nodes.length; j++) {
            if (i === j) {
                nodeProbs.push(0);  // No self-loops
            } else {
                nodeProbs.push(pheromoneMatrix[i][j] / sum);
            }
        }
        
        probabilities.push(nodeProbs);
    }
    
    return probabilities;
}

// Update colony summary information
function updateColonySummary(result) {
    if (result.visualization) {
        document.getElementById('aco-total-ants').textContent = result.visualization.ant_count;
        document.getElementById('aco-convergence-iter').textContent = result.visualization.convergence_iteration;
        document.getElementById('aco-pheromone-updates').textContent = result.visualization.pheromone_updates;
    }
}

// Create detailed iteration table
function createDetailedIterationTable(result) {
    if (!result.accuracy_history || !result.accuracy_history.length) return;
    
    const container = document.getElementById('aco-iterations-table');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create table element
    const table = document.createElement('table');
    table.className = 'iteration-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Iteration', 'Accuracy', 'Best Path Length', 'Pheromone Level', 'Change'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add rows for iterations
    result.accuracy_history.forEach((accuracy, i) => {
        const row = document.createElement('tr');
        
        // Iteration number cell
        const iterCell = document.createElement('td');
        iterCell.textContent = i + 1;
        row.appendChild(iterCell);
        
        // Accuracy cell
        const accCell = document.createElement('td');
        const accuracyValue = (accuracy * 100).toFixed(2);
        accCell.textContent = `${accuracyValue}%`;
        row.appendChild(accCell);
        
        // Best path length cell (simulated)
        const pathLengthCell = document.createElement('td');
        const pathLength = (10 - (i / result.accuracy_history.length) * 2).toFixed(2);
        pathLengthCell.textContent = pathLength;
        row.appendChild(pathLengthCell);
        
        // Pheromone level cell (simulated)
        const pheromoneCell = document.createElement('td');
        const pheromoneLevel = (0.1 + (i / result.accuracy_history.length) * 0.9).toFixed(2);
        pheromoneCell.textContent = pheromoneLevel;
        row.appendChild(pheromoneCell);
        
        // Change cell
        const changeCell = document.createElement('td');
        if (i > 0) {
            const change = ((accuracy - result.accuracy_history[i-1]) * 100).toFixed(2);
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
}

// Update pheromone matrix visualization
function updatePheromoneMatrix(result) {
    if (!result.visualization || !result.visualization.pheromone_matrix) return;
    
    const container = document.getElementById('aco-pheromone-matrix');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create matrix table
    const table = document.createElement('table');
    table.className = 'matrix-table';
    
    // Create header row with node IDs
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Empty corner cell
    const cornerCell = document.createElement('th');
    cornerCell.textContent = 'Node';
    headerRow.appendChild(cornerCell);
    
    // Node ID headers
    for (let i = 0; i < result.visualization.pheromone_matrix.length; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body with pheromone values
    const tbody = document.createElement('tbody');
    
    for (let i = 0; i < result.visualization.pheromone_matrix.length; i++) {
        const row = document.createElement('tr');
        
        // Row header with node ID
        const rowHeader = document.createElement('th');
        rowHeader.textContent = i;
        row.appendChild(rowHeader);
        
        // Pheromone values
        for (let j = 0; j < result.visualization.pheromone_matrix[i].length; j++) {
            const cell = document.createElement('td');
            const value = result.visualization.pheromone_matrix[i][j];
            
            // Skip diagonal (self-loops)
            if (i === j) {
                cell.textContent = '-';
                cell.className = 'no-pheromone';
            } else {
                cell.textContent = value.toFixed(2);
                
                // Color based on pheromone level
                const intensity = Math.min(value * 2, 1);  // Scale for better visualization
                cell.style.backgroundColor = `rgba(76, 175, 80, ${intensity})`;
                cell.style.color = intensity > 0.5 ? 'white' : 'black';
            }
            
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    container.appendChild(table);
}

// Update path probabilities visualization
function updatePathProbabilities(result) {
    if (!result.visualization || !result.visualization.path_probabilities) return;
    
    const container = document.getElementById('aco-probability-table');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create probability table
    const table = document.createElement('table');
    table.className = 'probability-table';
    
    // Create header row with destination nodes
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // From/To header
    const cornerCell = document.createElement('th');
    cornerCell.textContent = 'From / To';
    headerRow.appendChild(cornerCell);
    
    // Destination node headers
    for (let i = 0; i < result.visualization.path_probabilities.length; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body with probability values
    const tbody = document.createElement('tbody');
    
    for (let i = 0; i < result.visualization.path_probabilities.length; i++) {
        const row = document.createElement('tr');
        
        // Row header with source node
        const rowHeader = document.createElement('th');
        rowHeader.textContent = i;
        row.appendChild(rowHeader);
        
        // Probability values
        for (let j = 0; j < result.visualization.path_probabilities[i].length; j++) {
            const cell = document.createElement('td');
            const value = result.visualization.path_probabilities[i][j];
            
            // Skip diagonal (self-loops)
            if (i === j) {
                cell.textContent = '-';
                cell.className = 'no-probability';
            } else {
                // Format as percentage
                cell.textContent = `${(value * 100).toFixed(1)}%`;
                
                // Color based on probability
                const intensity = Math.min(value * 3, 1);  // Scale for better visualization
                cell.style.backgroundColor = `rgba(33, 150, 243, ${intensity})`;
                cell.style.color = intensity > 0.5 ? 'white' : 'black';
            }
            
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    container.appendChild(table);
}

// Draw the path visualization on canvas
function drawPathVisualization(result) {
    if (!pathCanvas || !pathContext || !result.visualization) return;
    
    const width = pathCanvas.width;
    const height = pathCanvas.height;
    const nodeRadius = Math.min(width, height) * 0.03;
    const nodes = result.visualization.nodes;
    const bestPath = result.visualization.best_path;
    
    // Clear canvas
    pathContext.clearRect(0, 0, width, height);
    
    // Draw edges with pheromone levels
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
            if (i !== j) {
                const pheromoneLevel = result.visualization.pheromone_matrix[i][j];
                const startX = nodes[i].x * width;
                const startY = nodes[i].y * height;
                const endX = nodes[j].x * width;
                const endY = nodes[j].y * height;
                
                // Draw edge with opacity based on pheromone level
                pathContext.beginPath();
                pathContext.moveTo(startX, startY);
                pathContext.lineTo(endX, endY);
                pathContext.strokeStyle = `rgba(200, 200, 200, ${pheromoneLevel * 0.5})`;
                pathContext.lineWidth = 1;
                pathContext.stroke();
            }
        }
    }
    
    // Draw best path
    if (bestPath && bestPath.length > 1) {
        pathContext.beginPath();
        const startNode = nodes[bestPath[0]];
        pathContext.moveTo(startNode.x * width, startNode.y * height);
        
        for (let i = 1; i < bestPath.length; i++) {
            const node = nodes[bestPath[i]];
            pathContext.lineTo(node.x * width, node.y * height);
        }
        
        pathContext.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        pathContext.lineWidth = 3;
        pathContext.stroke();
    }
    
    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
        const x = nodes[i].x * width;
        const y = nodes[i].y * height;
        
        // Node circle
        pathContext.beginPath();
        pathContext.arc(x, y, nodeRadius, 0, Math.PI * 2);
        pathContext.fillStyle = 'rgba(33, 150, 243, 0.8)';
        pathContext.fill();
        pathContext.strokeStyle = 'white';
        pathContext.lineWidth = 2;
        pathContext.stroke();
        
        // Node label
        pathContext.fillStyle = 'white';
        pathContext.font = `${nodeRadius}px Arial`;
        pathContext.textAlign = 'center';
        pathContext.textBaseline = 'middle';
        pathContext.fillText(i.toString(), x, y);
    }
}

// Update best path details
function updateBestPathDetails(result) {
    if (!result.visualization || !result.visualization.best_path) return;
    
    const container = document.getElementById('aco-best-path-details');
    if (!container) return;
    
    const bestPath = result.visualization.best_path;
    const nodes = result.visualization.nodes;
    
    // Calculate total path length
    let totalLength = 0;
    for (let i = 0; i < bestPath.length - 1; i++) {
        const currentNode = nodes[bestPath[i]];
        const nextNode = nodes[bestPath[i + 1]];
        const distance = Math.sqrt(
            Math.pow(currentNode.x - nextNode.x, 2) + 
            Math.pow(currentNode.y - nextNode.y, 2)
        );
        totalLength += distance;
    }
    
    // Format path as string
    const pathStr = bestPath.join(' → ');
    
    // Create details text
    const details = `Best Path: ${pathStr}\n\nTotal Length: ${totalLength.toFixed(2)}\n\nPath Details:\n`;
    
    // Add details for each segment
    let segmentDetails = '';
    for (let i = 0; i < bestPath.length - 1; i++) {
        const currentNode = nodes[bestPath[i]];
        const nextNode = nodes[bestPath[i + 1]];
        const distance = Math.sqrt(
            Math.pow(currentNode.x - nextNode.x, 2) + 
            Math.pow(currentNode.y - nextNode.y, 2)
        );
        const pheromone = result.visualization.pheromone_matrix[bestPath[i]][bestPath[i + 1]];
        
        segmentDetails += `Segment ${bestPath[i]} → ${bestPath[i + 1]}:\n`;
        segmentDetails += `  Distance: ${distance.toFixed(4)}\n`;
        segmentDetails += `  Pheromone: ${pheromone.toFixed(4)}\n`;
    }
    
    container.innerHTML = `<pre>${details}${segmentDetails}</pre>`;
}
