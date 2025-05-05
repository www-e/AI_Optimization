# Hybrid AI Optimization Project Documentation

## Overview

This project implements and compares various nature-inspired optimization algorithms for training neural networks without using traditional gradient descent methods. The algorithms are used to optimize the weights of a simple feedforward neural network for classification tasks.

## Neural Network Model

### Architecture
- **Type**: Feedforward Neural Network
- **Layers**: 1 input layer, 1 hidden layer, 1 output layer
- **Activation Functions**: Sigmoid (hidden layer), Softmax (output layer)
- **Implementation**: Built from scratch using NumPy

### Dataset
- **Source**: Iris dataset from scikit-learn
- **Features**: 4 input features (sepal length, sepal width, petal length, petal width)
- **Classes**: 3 output classes (Setosa, Versicolor, Virginica)
- **Split**: 80% training, 20% testing

### Purpose
The neural network serves as a common optimization target for all algorithms. Instead of training it with backpropagation and gradient descent, we optimize its weights using various nature-inspired algorithms.

## Optimization Algorithms

### 1. Genetic Algorithm (GA)

#### Inputs
- **Population Size**: Number of candidate solutions in each generation
- **Generations**: Number of iterations to evolve the population
- **Mutation Rate**: Probability of random changes in solutions

#### Process
1. **Initialization**: Create random solutions (neural network weights)
2. **Evaluation**: Calculate fitness (accuracy) of each solution
3. **Selection**: Choose the best solutions for reproduction
4. **Crossover**: Combine parent solutions to create offspring
5. **Mutation**: Introduce random changes to maintain diversity
6. **Repeat**: Steps 2-5 for the specified number of generations

#### Outputs
- **Best Weights**: The best-performing neural network weights found
- **Accuracy History**: How accuracy improves over generations
- **Final Accuracy**: Classification accuracy on the test set
- **Visualization**: Chart showing accuracy vs. generations

### 2. Particle Swarm Optimization (PSO)

#### Inputs
- **Swarm Size**: Number of particles in the swarm
- **Iterations**: Number of updates to perform
- **Inertia Weight**: Controls influence of previous velocity
- **Cognitive Coefficient**: Controls influence of personal best position
- **Social Coefficient**: Controls influence of global best position

#### Process
1. **Initialization**: Create particles with random positions (weights) and velocities
2. **Evaluation**: Calculate fitness (accuracy) of each particle
3. **Update Personal Best**: Update each particle's best position if improved
4. **Update Global Best**: Update the swarm's best position if improved
5. **Update Velocities**: Adjust velocities based on inertia, personal best, and global best
6. **Update Positions**: Move particles according to their velocities
7. **Repeat**: Steps 2-6 for the specified number of iterations

#### Outputs
- **Best Weights**: The best-performing neural network weights found
- **Accuracy History**: How accuracy improves over iterations
- **Final Accuracy**: Classification accuracy on the test set
- **Visualization**: Chart showing accuracy vs. iterations

### 3. Ant Colony Optimization (ACO)

#### Inputs
- **Ant Count**: Number of ants in the colony
- **Iterations**: Number of iterations to run
- **Pheromone Importance**: Weight given to pheromone trails
- **Heuristic Importance**: Weight given to heuristic information
- **Evaporation Rate**: Rate at which pheromones evaporate

#### Process
1. **Initialization**: Initialize pheromone trails
2. **Solution Construction**: Each ant constructs a solution (weights)
3. **Evaluation**: Calculate fitness (accuracy) of each solution
4. **Pheromone Update**: Update pheromone trails based on solution quality
5. **Evaporation**: Reduce all pheromone trails by the evaporation rate
6. **Repeat**: Steps 2-5 for the specified number of iterations

#### Outputs
- **Best Weights**: The best-performing neural network weights found
- **Accuracy History**: How accuracy improves over iterations
- **Final Accuracy**: Classification accuracy on the test set
- **Visualization**: Chart showing accuracy vs. iterations

### 4. Tabu Search (TS)

#### Inputs
- **Initial Solution**: Starting point for the search
- **Iterations**: Number of iterations to run
- **Tabu List Size**: Number of recent moves to remember
- **Neighborhood Size**: Number of neighboring solutions to evaluate

#### Process
1. **Initialization**: Start with a random solution (weights)
2. **Neighborhood Generation**: Generate neighboring solutions
3. **Evaluation**: Calculate fitness (accuracy) of each neighbor
4. **Selection**: Choose the best non-tabu neighbor
5. **Tabu Update**: Add the move to the tabu list
6. **Repeat**: Steps 2-5 for the specified number of iterations

#### Outputs
- **Best Weights**: The best-performing neural network weights found
- **Accuracy History**: How accuracy improves over iterations
- **Final Accuracy**: Classification accuracy on the test set
- **Visualization**: Chart showing accuracy vs. iterations

## Visualization and Comparison

### Generated Assets
- **Individual Charts**: Accuracy vs. iterations for each algorithm
- **Combined Chart**: Comparison of all algorithms on the same graph
- **Results JSON**: Structured data of algorithm performance

### Comparison Metrics
- **Final Accuracy**: How well the algorithm performs on the test set
- **Convergence Speed**: How quickly the algorithm reaches high accuracy
- **Computation Time**: How long the algorithm takes to run

## User Interface

The web-based UI allows users to:
1. Select an optimization algorithm
2. Configure algorithm parameters
3. Run optimizations
4. View and compare results
5. Understand the educational aspects of each algorithm

## How to Run

1. Install dependencies: `pip install -r requirements.txt`
2. Run the main script: `python main.py`
3. The web server will start automatically and open the UI in your browser
4. Experiment with different algorithms and parameters

## Practical Applications

This project demonstrates how nature-inspired algorithms can be used for neural network training, which is particularly useful for:

1. **Complex Optimization Problems**: When traditional gradient-based methods get stuck in local optima
2. **Non-Differentiable Functions**: When the objective function is not differentiable
3. **Hyperparameter Optimization**: Finding optimal neural network architectures
4. **Educational Purposes**: Understanding how different optimization algorithms work
5. **Research**: Comparing the performance of different algorithms on the same problem
