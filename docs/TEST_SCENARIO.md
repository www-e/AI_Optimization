# Hybrid AI Optimization - Test Scenarios

This document provides step-by-step instructions for testing each algorithm in the Hybrid AI Optimization project.

## Prerequisites

1. Make sure you have all the required dependencies installed:
   ```
   pip install -r requirements.txt
   ```

2. Ensure the project structure is intact with all necessary files.

## Starting the Application

1. Open a terminal in the project root directory.
2. Run the main script:
   ```
   python main.py
   ```
3. The web UI should automatically open in your default browser at http://localhost:8000.

## Test Scenario 1: Genetic Algorithm (GA)

1. **Select GA**: Click on "Genetic Algorithm" in the sidebar.
2. **Configure Parameters**:
   - Population Size: 50 (default)
   - Generations: 100 (default)
   - Mutation Rate: 0.1 (default)
3. **Run the Algorithm**: Click the "Run Optimization" button.
4. **Expected Results**:
   - The loading spinner should appear and then disappear.
   - The accuracy chart should display the GA convergence.
   - The accuracy card should show a value (typically 90-98%).
   - The execution time should be displayed.

## Test Scenario 2: Particle Swarm Optimization (PSO)

1. **Select PSO**: Click on "Particle Swarm Optimization" in the sidebar.
2. **Configure Parameters**:
   - Swarm Size: 30 (default)
   - Iterations: 100 (default)
   - Inertia Weight: 0.7 (default)
   - Cognitive Coefficient: 1.5 (default)
   - Social Coefficient: 1.5 (default)
3. **Run the Algorithm**: Click the "Run Optimization" button.
4. **Expected Results**:
   - The loading spinner should appear and then disappear.
   - The accuracy chart should display the PSO convergence.
   - The accuracy card should show a value (typically 90-98%).
   - The execution time should be displayed.

## Test Scenario 3: Ant Colony Optimization (ACO)

1. **Select ACO**: Click on "Ant Colony Optimization" in the sidebar.
2. **Configure Parameters**:
   - Ant Count: 30 (default)
   - Iterations: 100 (default)
   - Pheromone Importance: 1.0 (default)
   - Heuristic Importance: 2.0 (default)
   - Evaporation Rate: 0.1 (default)
3. **Run the Algorithm**: Click the "Run Optimization" button.
4. **Expected Results**:
   - The loading spinner should appear and then disappear.
   - The accuracy chart should display the ACO convergence.
   - The accuracy card should show a value (typically 90-98%).
   - The execution time should be displayed.

## Test Scenario 4: Tabu Search

1. **Select Tabu Search**: Click on "Tabu Search" in the sidebar.
2. **Configure Parameters**:
   - Iterations: 100 (default)
   - Tabu List Size: 10 (default)
   - Neighborhood Size: 20 (default)
   - Step Size: 0.1 (default)
3. **Run the Algorithm**: Click the "Run Optimization" button.
4. **Expected Results**:
   - The loading spinner should appear and then disappear.
   - The accuracy chart should display the Tabu Search convergence.
   - The accuracy card should show a value (typically 90-98%).
   - The execution time should be displayed.

## Test Scenario 5: Compare All Algorithms

1. **Select Compare**: Click on "Compare" in the sidebar.
2. **Configure Parameters**:
   - Check all algorithms you want to include in the comparison.
3. **Run All Algorithms**: Click the "Run All Algorithms" button.
4. **Expected Results**:
   - The loading spinner should appear and then disappear.
   - The comparison table should display all algorithms with their accuracies, execution times, and rankings.
   - The accuracy chart should display the convergence of all selected algorithms.

## Troubleshooting

If you encounter any issues:

1. **Check the console**: Open your browser's developer tools (F12) and check for any error messages in the console.
2. **Check the logs**: Look for the `optimization.log` file in the project root directory for detailed error messages.
3. **Refresh the page**: Sometimes a simple refresh can resolve UI issues.
4. **Restart the server**: Stop the Python script (Ctrl+C) and start it again.

## Understanding the Results

- **Accuracy**: Higher is better. This represents how well the neural network classifies the Iris dataset.
- **Execution Time**: Lower is better. This shows how long the algorithm took to run.
- **Convergence Chart**: Shows how the accuracy improves over iterations. A steeper curve indicates faster learning.
- **Ranking**: In the comparison view, algorithms are ranked based on their final accuracy.

## Advanced Testing

For advanced testing, you can modify the parameters to see how they affect the results:

- **GA**: Increasing population size and generations may improve accuracy but will take longer to run.
- **PSO**: Adjusting inertia, cognitive, and social coefficients can change the exploration/exploitation balance.
- **ACO**: Modifying pheromone and heuristic importance affects how ants choose paths.
- **Tabu Search**: Changing the tabu list size and neighborhood size affects the search space exploration.

Experiment with different parameter combinations to find the optimal settings for each algorithm!
