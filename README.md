# Hybrid AI Optimization Project

This project demonstrates how Genetic Algorithms (GA) and Particle Swarm Optimization (PSO) can be used to optimize neural network weights without traditional gradient descent methods.

## Project Overview

The project implements:

1. A simple feedforward neural network from scratch using only NumPy
2. A genetic algorithm (GA) optimizer
3. A particle swarm optimization (PSO) algorithm
4. A web-based interface to visualize and compare results

## Components

- `models/neural_network.py`: Simple feedforward neural network implementation
- `optimizers/genetic_algorithm.py`: GA implementation for neural network optimization
- `optimizers/particle_swarm.py`: PSO implementation for neural network optimization
- `utils/data_handler.py`: Utilities for loading and processing data
- `utils/visualization.py`: Functions for visualizing results
- `ui/`: Contains HTML, CSS, and JavaScript files for the web interface
- `main.py`: Entry point for running the optimization algorithms

## How to Use

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the optimization algorithms:
   ```
   python main.py
   ```

3. Open the UI in your web browser:
   ```
   open ui/index.html
   ```

## Key Differences Between GA and PSO

- **Genetic Algorithm**: Inspired by natural selection, using selection, crossover, and mutation operations
- **Particle Swarm Optimization**: Inspired by social behavior of bird flocking or fish schooling, using velocity and position updates

## Parameters Impact

- **GA Parameters**:
  - Population size: Larger populations explore more of the search space but take longer to compute
  - Mutation rate: Higher rates increase exploration but may disrupt good solutions
  - Generations: More generations allow for more optimization but increase computation time

- **PSO Parameters**:
  - Swarm size: Similar to population size in GA
  - Inertia weight: Controls the influence of the previous velocity
  - Cognitive coefficient: Controls the influence of personal best positions
  - Social coefficient: Controls the influence of global best position
  - Iterations: Similar to generations in GA

## Educational Purpose

This project is designed to be educational and visual, making it easy for beginners to understand how these optimization algorithms work and how they can be applied to neural network training.
