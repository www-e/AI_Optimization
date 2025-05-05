# Algorithm Comparison

This document provides a comparison of the four optimization algorithms used in this project to train a neural network for the Iris dataset classification task.

## Neural Network Architecture

The neural network used in this project is a simple feedforward network with:
- Input layer: 4 neurons (for the 4 features of the Iris dataset)
- Hidden layer: 8 neurons with sigmoid activation
- Output layer: 3 neurons with softmax activation (for the 3 Iris classes)

## Algorithm Comparison Table

| Feature | Genetic Algorithm (GA) | Particle Swarm Optimization (PSO) | Ant Colony Optimization (ACO) | Tabu Search |
|---------|------------------------|-----------------------------------|-------------------------------|------------|
| **Inspiration** | Natural selection and genetics | Social behavior of bird flocking or fish schooling | Foraging behavior of ants | Human memory and local search |
| **Search Strategy** | Population-based, evolutionary | Population-based, social | Population-based, pheromone-guided | Single-solution, memory-based |
| **Key Components** | Selection, crossover, mutation | Velocity, personal best, global best | Pheromone trails, heuristic information | Tabu list, neighborhood exploration |
| **Key Parameters** | Population size, mutation rate | Swarm size, inertia weight, cognitive/social coefficients | Ant count, pheromone importance, evaporation rate | Tabu list size, neighborhood size, step size |
| **Strengths** | Good at exploring large search spaces | Fast convergence on continuous problems | Effective for combinatorial problems | Good at escaping local optima |
| **Weaknesses** | Slow convergence | Can get trapped in local optima | Parameter tuning can be difficult | Memory requirements can be high |
| **Best For** | Complex, multimodal problems | Continuous optimization problems | Discrete optimization problems | Problems with many local optima |

## Input and Output

### Inputs

| Algorithm | Key Inputs |
|-----------|------------|
| **GA** | Population size, number of generations, mutation rate |
| **PSO** | Swarm size, number of iterations, inertia weight, cognitive coefficient, social coefficient |
| **ACO** | Ant count, number of iterations, pheromone importance (α), heuristic importance (β), evaporation rate |
| **Tabu** | Number of iterations, tabu list size, neighborhood size, step size |

### Outputs

All algorithms produce the same type of outputs:
- Optimized neural network weights
- Accuracy history (accuracy at each iteration)
- Final accuracy on test data
- Execution time

## Performance Characteristics

| Algorithm | Convergence Speed | Exploration vs. Exploitation | Typical Accuracy Range |
|-----------|-------------------|------------------------------|------------------------|
| **GA** | Moderate | Good exploration, moderate exploitation | 85-95% |
| **PSO** | Fast | Moderate exploration, good exploitation | 90-95% |
| **ACO** | Slow to moderate | Good exploration in discrete space | 80-90% |
| **Tabu** | Fast | Excellent at escaping local optima | 90-100% |

## How the Algorithms Work with Neural Networks

1. **Genetic Algorithm**:
   - Represents neural network weights as "chromosomes"
   - Evolves a population of weight configurations through selection, crossover, and mutation
   - Fitness is determined by the neural network's accuracy

2. **Particle Swarm Optimization**:
   - Represents neural network weights as particle positions in search space
   - Particles move based on their own experience and the swarm's collective knowledge
   - Position quality is determined by the neural network's accuracy

3. **Ant Colony Optimization**:
   - Represents neural network weights as paths through a continuous space
   - Ants deposit pheromones on good paths (weight configurations)
   - Pheromone concentration guides future ants toward promising regions

4. **Tabu Search**:
   - Starts with a single set of neural network weights
   - Explores neighboring weight configurations while avoiding recently visited ones
   - Uses memory (tabu list) to prevent cycling and escape local optima

## When to Choose Each Algorithm

- **Genetic Algorithm**: When you need robust exploration of a complex weight space and have sufficient computational resources.
- **Particle Swarm Optimization**: When you need faster convergence on continuous problems like neural network weight optimization.
- **Ant Colony Optimization**: When the problem has a discrete or combinatorial nature (less ideal for neural networks but included for comparison).
- **Tabu Search**: When you need to escape local optima and find high-quality solutions quickly.
