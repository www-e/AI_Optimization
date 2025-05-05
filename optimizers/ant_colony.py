import numpy as np
import time

class AntColonyOptimization:
    """
    Implementation of Ant Colony Optimization for neural network weights.
    """
    
    def __init__(self, neural_network, X_train, y_train, X_test, y_test, 
                 ant_count=30, iterations=100, pheromone_importance=1.0,
                 heuristic_importance=2.0, evaporation_rate=0.1):
        """
        Initialize the ACO optimizer.
        
        Args:
            neural_network: Neural network model to optimize
            X_train: Training data features
            y_train: Training data labels
            X_test: Test data features
            y_test: Test data labels
            ant_count (int): Number of ants in the colony
            iterations (int): Number of iterations to run
            pheromone_importance (float): Weight given to pheromone trails (alpha)
            heuristic_importance (float): Weight given to heuristic information (beta)
            evaporation_rate (float): Rate at which pheromones evaporate
        """
        self.neural_network = neural_network
        self.X_train = X_train
        self.y_train = y_train
        self.X_test = X_test
        self.y_test = y_test
        self.ant_count = ant_count
        self.iterations = iterations
        self.pheromone_importance = pheromone_importance
        self.heuristic_importance = heuristic_importance
        self.evaporation_rate = evaporation_rate
        self.weights_size = neural_network.total_weights
        
        # Search space boundaries
        self.lower_bound = -1.0
        self.upper_bound = 1.0
        
        # Number of discrete points in each dimension
        self.grid_points = 20
        
        # Initialize best solution tracking
        self.best_solution = None
        self.best_fitness = -np.inf
        self.best_accuracy = 0
        
        # History for visualization
        self.avg_fitness_history = []
        self.best_fitness_history = []
        self.best_accuracy_history = []
    
    def initialize_pheromones(self):
        """
        Initialize pheromone matrix with small random values.
        """
        # For neural network weights, we use a simplified representation
        # We'll have a pheromone value for each discrete point in each dimension
        self.pheromones = np.ones((self.weights_size, self.grid_points)) * 0.1
        
        # Initialize heuristic information (inverse of distance)
        self.heuristic = np.ones((self.weights_size, self.grid_points))
    
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
    
    def select_next_point(self, ant_index, dimension):
        """
        Select the next point for an ant to move to in a given dimension.
        
        Args:
            ant_index (int): Index of the ant
            dimension (int): Current dimension being considered
            
        Returns:
            int: Selected grid point index
        """
        # Calculate probabilities for each point in this dimension
        pheromone = self.pheromones[dimension]
        heuristic = self.heuristic[dimension]
        
        # Calculate the numerator of the probability formula
        numerator = (pheromone ** self.pheromone_importance) * (heuristic ** self.heuristic_importance)
        
        # Calculate probabilities
        probabilities = numerator / np.sum(numerator)
        
        # Select a point based on the probabilities
        return np.random.choice(self.grid_points, p=probabilities)
    
    def construct_solution(self, ant_index):
        """
        Construct a complete solution (set of weights) for an ant.
        
        Args:
            ant_index (int): Index of the ant
            
        Returns:
            numpy.ndarray: Constructed solution (weights)
        """
        solution = np.zeros(self.weights_size)
        
        # For each dimension, select a point
        for dim in range(self.weights_size):
            point_index = self.select_next_point(ant_index, dim)
            
            # Convert the discrete point index to a continuous value
            value = self.lower_bound + (point_index / (self.grid_points - 1)) * (self.upper_bound - self.lower_bound)
            solution[dim] = value
        
        return solution
    
    def update_pheromones(self, solutions, fitnesses):
        """
        Update pheromone trails based on solution quality.
        
        Args:
            solutions (list): List of solutions (weights)
            fitnesses (list): List of fitness values for each solution
        """
        # Evaporation
        self.pheromones *= (1 - self.evaporation_rate)
        
        # Pheromone deposit
        for solution, fitness in zip(solutions, fitnesses):
            # Only allow positive fitness to contribute
            if fitness > 0:
                # For each dimension, find the closest grid point
                for dim in range(self.weights_size):
                    value = solution[dim]
                    
                    # Convert continuous value to discrete point index
                    point_index = int(((value - self.lower_bound) / (self.upper_bound - self.lower_bound)) * (self.grid_points - 1))
                    point_index = max(0, min(point_index, self.grid_points - 1))  # Ensure within bounds
                    
                    # Deposit pheromone proportional to fitness
                    self.pheromones[dim, point_index] += fitness
    
    def run(self):
        """
        Run the ACO optimization process.
        
        Returns:
            tuple: Best weights, best accuracy, and history
        """
        start_time = time.time()
        
        # Initialize pheromones
        self.initialize_pheromones()
        
        # Initialize best solution with a random solution
        self.best_solution = np.random.uniform(self.lower_bound, self.upper_bound, self.weights_size)
        self.best_fitness = self.calculate_fitness(self.best_solution)
        self.best_accuracy = self.neural_network.calculate_accuracy(self.X_test, self.y_test, self.best_solution)
        
        # Store initial best
        self.best_fitness_history.append(self.best_fitness)
        self.best_accuracy_history.append(self.best_accuracy)
        
        # Main optimization loop
        for iteration in range(self.iterations):
            # Solutions for this iteration
            solutions = []
            fitnesses = []
            
            # Each ant constructs a solution
            for ant in range(self.ant_count):
                # Construct a solution
                solution = self.construct_solution(ant)
                
                # Calculate fitness
                fitness = self.calculate_fitness(solution)
                
                # Store solution and fitness
                solutions.append(solution)
                fitnesses.append(fitness)
                
                # Update best solution if improved
                if fitness > self.best_fitness:
                    self.best_solution = solution.copy()
                    self.best_fitness = fitness
                    self.best_accuracy = self.neural_network.calculate_accuracy(
                        self.X_test, self.y_test, solution
                    )
            
            # Update pheromones
            self.update_pheromones(solutions, fitnesses)
            
            # Calculate average fitness for this iteration
            avg_fitness = np.mean(fitnesses)
            self.avg_fitness_history.append(avg_fitness)
            
            # Store best fitness and accuracy for this iteration
            self.best_fitness_history.append(self.best_fitness)
            self.best_accuracy_history.append(self.best_accuracy)
            
            # Print progress every 10 iterations
            if (iteration + 1) % 10 == 0:
                print(f"ACO - Iteration {iteration + 1}/{self.iterations}, " +
                      f"Best Accuracy: {self.best_accuracy:.4f}, " +
                      f"Avg Fitness: {avg_fitness:.4f}")
        
        end_time = time.time()
        print(f"ACO optimization completed in {end_time - start_time:.2f} seconds")
        print(f"Final accuracy: {self.best_accuracy:.4f}")
        
        return self.best_solution, self.best_accuracy, {
            'avg_fitness_history': self.avg_fitness_history,
            'best_fitness_history': self.best_fitness_history,
            'best_accuracy_history': self.best_accuracy_history
        }
