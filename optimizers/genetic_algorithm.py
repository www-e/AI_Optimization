import numpy as np
import time

class GeneticAlgorithm:
    """
    Implementation of a Genetic Algorithm for optimizing neural network weights.
    """
    
    def __init__(self, neural_network, X_train, y_train, X_test, y_test, 
                 population_size=50, generations=100, mutation_rate=0.1):
        """
        Initialize the Genetic Algorithm optimizer.
        
        Args:
            neural_network: Neural network model to optimize
            X_train: Training data features
            y_train: Training data labels
            X_test: Test data features
            y_test: Test data labels
            population_size (int): Size of the population
            generations (int): Number of generations to run
            mutation_rate (float): Probability of mutation
        """
        self.neural_network = neural_network
        self.X_train = X_train
        self.y_train = y_train
        self.X_test = X_test
        self.y_test = y_test
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.weights_size = neural_network.total_weights
        self.population = None
        self.fitness_history = []
        self.best_fitness_history = []
        self.best_accuracy_history = []
        self.best_solution = None
        self.best_fitness = -np.inf
        self.best_accuracy = 0
        
    def initialize_population(self):
        """
        Initialize the population with random weights.
        
        Returns:
            numpy.ndarray: Initial population
        """
        population = np.zeros((self.population_size, self.weights_size))
        
        for i in range(self.population_size):
            # Initialize with small random values
            population[i] = np.random.randn(self.weights_size) * 0.1
            
        self.population = population
        return population
    
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
    
    def selection(self, k=3):
        """
        Tournament selection to choose parents.
        
        Args:
            k (int): Tournament size
            
        Returns:
            numpy.ndarray: Selected parent
        """
        # Select k random individuals
        idx = np.random.randint(0, self.population_size, k)
        selected = self.population[idx]
        
        # Calculate fitness for each selected individual
        fitness_values = np.array([self.calculate_fitness(ind) for ind in selected])
        
        # Return the individual with the highest fitness
        return selected[np.argmax(fitness_values)]
    
    def crossover(self, parent1, parent2):
        """
        Perform crossover between two parents.
        
        Args:
            parent1 (numpy.ndarray): First parent
            parent2 (numpy.ndarray): Second parent
            
        Returns:
            numpy.ndarray: Child solution
        """
        # Single-point crossover
        crossover_point = np.random.randint(1, self.weights_size)
        child = np.concatenate([parent1[:crossover_point], parent2[crossover_point:]])
        return child
    
    def mutation(self, individual):
        """
        Apply mutation to an individual.
        
        Args:
            individual (numpy.ndarray): Individual to mutate
            
        Returns:
            numpy.ndarray: Mutated individual
        """
        # Apply mutation with probability mutation_rate
        mutation_mask = np.random.random(self.weights_size) < self.mutation_rate
        
        # Generate random mutations
        mutations = np.random.randn(self.weights_size) * 0.1
        
        # Apply mutations where mask is True
        individual[mutation_mask] += mutations[mutation_mask]
        
        return individual
    
    def evolve(self):
        """
        Evolve the population for one generation.
        
        Returns:
            numpy.ndarray: New population
        """
        new_population = np.zeros_like(self.population)
        
        # Keep the best individual (elitism)
        best_idx = np.argmax([self.calculate_fitness(ind) for ind in self.population])
        new_population[0] = self.population[best_idx]
        
        # Create the rest of the new population
        for i in range(1, self.population_size):
            # Selection
            parent1 = self.selection()
            parent2 = self.selection()
            
            # Crossover
            child = self.crossover(parent1, parent2)
            
            # Mutation
            child = self.mutation(child)
            
            # Add to new population
            new_population[i] = child
            
        self.population = new_population
        return new_population
    
    def run(self):
        """
        Run the genetic algorithm optimization process.
        
        Returns:
            tuple: Best weights, best accuracy, and history
        """
        start_time = time.time()
        
        # Initialize population
        self.initialize_population()
        
        # Evaluate initial population
        fitness_values = np.array([self.calculate_fitness(ind) for ind in self.population])
        best_idx = np.argmax(fitness_values)
        self.best_solution = self.population[best_idx].copy()
        self.best_fitness = fitness_values[best_idx]
        self.best_accuracy = self.neural_network.calculate_accuracy(self.X_test, self.y_test, self.best_solution)
        
        # Store initial best
        self.best_fitness_history.append(self.best_fitness)
        self.best_accuracy_history.append(self.best_accuracy)
        
        # Main evolution loop
        for generation in range(self.generations):
            # Evolve population
            self.evolve()
            
            # Evaluate new population
            fitness_values = np.array([self.calculate_fitness(ind) for ind in self.population])
            avg_fitness = np.mean(fitness_values)
            self.fitness_history.append(avg_fitness)
            
            # Update best solution if improved
            best_idx = np.argmax(fitness_values)
            if fitness_values[best_idx] > self.best_fitness:
                self.best_solution = self.population[best_idx].copy()
                self.best_fitness = fitness_values[best_idx]
                self.best_accuracy = self.neural_network.calculate_accuracy(
                    self.X_test, self.y_test, self.best_solution
                )
            
            # Store best fitness and accuracy for this generation
            self.best_fitness_history.append(self.best_fitness)
            self.best_accuracy_history.append(self.best_accuracy)
            
            # Print progress every 10 generations
            if (generation + 1) % 10 == 0:
                print(f"GA - Generation {generation + 1}/{self.generations}, " +
                      f"Best Accuracy: {self.best_accuracy:.4f}, " +
                      f"Avg Fitness: {avg_fitness:.4f}")
        
        end_time = time.time()
        print(f"GA optimization completed in {end_time - start_time:.2f} seconds")
        print(f"Final accuracy: {self.best_accuracy:.4f}")
        
        return self.best_solution, self.best_accuracy, {
            'fitness_history': self.fitness_history,
            'best_fitness_history': self.best_fitness_history,
            'best_accuracy_history': self.best_accuracy_history
        }
