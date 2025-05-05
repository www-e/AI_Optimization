import numpy as np
import time
from collections import deque

class TabuSearch:
    """
    Implementation of Tabu Search for neural network weights optimization.
    """
    
    def __init__(self, neural_network, X_train, y_train, X_test, y_test, 
                 iterations=100, tabu_list_size=10, neighborhood_size=20,
                 step_size=0.1):
        """
        Initialize the Tabu Search optimizer.
        
        Args:
            neural_network: Neural network model to optimize
            X_train: Training data features
            y_train: Training data labels
            X_test: Test data features
            y_test: Test data labels
            iterations (int): Number of iterations to run
            tabu_list_size (int): Size of the tabu list
            neighborhood_size (int): Number of neighbors to generate
            step_size (float): Size of the step when generating neighbors
        """
        self.neural_network = neural_network
        self.X_train = X_train
        self.y_train = y_train
        self.X_test = X_test
        self.y_test = y_test
        self.iterations = iterations
        self.tabu_list_size = tabu_list_size
        self.neighborhood_size = neighborhood_size
        self.step_size = step_size
        self.weights_size = neural_network.total_weights
        
        # Initialize tabu list
        self.tabu_list = deque(maxlen=tabu_list_size)
        
        # Initialize best solution tracking
        self.current_solution = None
        self.best_solution = None
        self.best_fitness = -np.inf
        self.best_accuracy = 0
        
        # History for visualization
        self.current_fitness_history = []
        self.best_fitness_history = []
        self.best_accuracy_history = []
    
    def initialize_solution(self):
        """
        Initialize a random solution.
        
        Returns:
            numpy.ndarray: Initial solution
        """
        # Initialize with small random values
        self.current_solution = np.random.randn(self.weights_size) * 0.1
        
        # Evaluate initial solution
        current_fitness = self.calculate_fitness(self.current_solution)
        self.best_solution = self.current_solution.copy()
        self.best_fitness = current_fitness
        self.best_accuracy = self.neural_network.calculate_accuracy(
            self.X_test, self.y_test, self.best_solution
        )
        
        return self.current_solution
    
    def calculate_fitness(self, weights):
        """
        Calculate the fitness of a solution (higher is better).
        Uses negative loss as fitness to maximize.
        
        Args:
            weights (numpy.ndarray): Weights to evaluate
            
        Returns:
            float: Fitness score
        """
        # Calculate negative loss (higher is better)
        loss = self.neural_network.calculate_loss(self.X_train, self.y_train, weights)
        return -loss
    
    def generate_neighbors(self, solution):
        """
        Generate neighboring solutions by perturbing the current solution.
        
        Args:
            solution (numpy.ndarray): Current solution
            
        Returns:
            list: List of neighboring solutions
        """
        neighbors = []
        
        for _ in range(self.neighborhood_size):
            # Create a perturbation vector
            perturbation = np.random.randn(self.weights_size) * self.step_size
            
            # Create a neighbor by adding the perturbation
            neighbor = solution + perturbation
            
            # Add to neighbors list
            neighbors.append(neighbor)
        
        return neighbors
    
    def is_tabu(self, move):
        """
        Check if a move is in the tabu list.
        
        Args:
            move (tuple): Move to check (dimension, direction)
            
        Returns:
            bool: True if the move is tabu, False otherwise
        """
        return move in self.tabu_list
    
    def add_to_tabu(self, move):
        """
        Add a move to the tabu list.
        
        Args:
            move (tuple): Move to add (dimension, direction)
        """
        self.tabu_list.append(move)
    
    def get_move(self, current, neighbor):
        """
        Get the move that transforms the current solution into the neighbor.
        
        Args:
            current (numpy.ndarray): Current solution
            neighbor (numpy.ndarray): Neighbor solution
            
        Returns:
            tuple: Move (dimension, direction)
        """
        # Find the dimension with the largest change
        diff = neighbor - current
        dimension = np.argmax(np.abs(diff))
        direction = 1 if diff[dimension] > 0 else -1
        
        return (dimension, direction)
    
    def run(self):
        """
        Run the Tabu Search optimization process.
        
        Returns:
            tuple: Best weights, best accuracy, and history
        """
        start_time = time.time()
        
        # Initialize solution
        self.initialize_solution()
        
        # Store initial best
        self.best_fitness_history.append(self.best_fitness)
        self.best_accuracy_history.append(self.best_accuracy)
        self.current_fitness_history.append(self.best_fitness)
        
        # Main optimization loop
        for iteration in range(self.iterations):
            # Generate neighbors
            neighbors = self.generate_neighbors(self.current_solution)
            
            # Evaluate neighbors
            neighbor_fitnesses = [self.calculate_fitness(n) for n in neighbors]
            
            # Find the best non-tabu neighbor
            best_neighbor_idx = -1
            best_neighbor_fitness = -np.inf
            
            for i, (neighbor, fitness) in enumerate(zip(neighbors, neighbor_fitnesses)):
                move = self.get_move(self.current_solution, neighbor)
                
                # Check if the move is not tabu or if it leads to a better solution than the best so far
                if not self.is_tabu(move) or fitness > self.best_fitness:
                    if fitness > best_neighbor_fitness:
                        best_neighbor_idx = i
                        best_neighbor_fitness = fitness
            
            # If no non-tabu neighbor was found, pick the best neighbor regardless of tabu status
            if best_neighbor_idx == -1:
                best_neighbor_idx = np.argmax(neighbor_fitnesses)
                best_neighbor_fitness = neighbor_fitnesses[best_neighbor_idx]
            
            # Update current solution
            self.current_solution = neighbors[best_neighbor_idx].copy()
            current_fitness = best_neighbor_fitness
            
            # Add the move to the tabu list
            move = self.get_move(self.current_solution, neighbors[best_neighbor_idx])
            self.add_to_tabu(move)
            
            # Update best solution if improved
            if current_fitness > self.best_fitness:
                self.best_solution = self.current_solution.copy()
                self.best_fitness = current_fitness
                self.best_accuracy = self.neural_network.calculate_accuracy(
                    self.X_test, self.y_test, self.best_solution
                )
            
            # Store history
            self.current_fitness_history.append(current_fitness)
            self.best_fitness_history.append(self.best_fitness)
            self.best_accuracy_history.append(self.best_accuracy)
            
            # Print progress every 10 iterations
            if (iteration + 1) % 10 == 0:
                print(f"TABU - Iteration {iteration + 1}/{self.iterations}, " +
                      f"Best Accuracy: {self.best_accuracy:.4f}, " +
                      f"Current Fitness: {current_fitness:.4f}")
        
        end_time = time.time()
        print(f"Tabu Search optimization completed in {end_time - start_time:.2f} seconds")
        print(f"Final accuracy: {self.best_accuracy:.4f}")
        
        return self.best_solution, self.best_accuracy, {
            'current_fitness_history': self.current_fitness_history,
            'best_fitness_history': self.best_fitness_history,
            'best_accuracy_history': self.best_accuracy_history
        }
