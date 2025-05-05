import numpy as np
import time

class ParticleSwarmOptimization:
    """
    Implementation of Particle Swarm Optimization for neural network weights.
    """
    
    def __init__(self, neural_network, X_train, y_train, X_test, y_test, 
                 swarm_size=30, iterations=100, inertia=0.7, 
                 cognitive_coef=1.5, social_coef=1.5):
        """
        Initialize the PSO optimizer.
        
        Args:
            neural_network: Neural network model to optimize
            X_train: Training data features
            y_train: Training data labels
            X_test: Test data features
            y_test: Test data labels
            swarm_size (int): Number of particles in the swarm
            iterations (int): Number of iterations to run
            inertia (float): Inertia weight
            cognitive_coef (float): Cognitive coefficient (c1)
            social_coef (float): Social coefficient (c2)
        """
        self.neural_network = neural_network
        self.X_train = X_train
        self.y_train = y_train
        self.X_test = X_test
        self.y_test = y_test
        self.swarm_size = swarm_size
        self.iterations = iterations
        self.inertia = inertia
        self.cognitive_coef = cognitive_coef
        self.social_coef = social_coef
        self.weights_size = neural_network.total_weights
        
        # Initialize swarm attributes
        self.positions = None
        self.velocities = None
        self.personal_best_positions = None
        self.personal_best_fitnesses = None
        self.global_best_position = None
        self.global_best_fitness = -np.inf
        self.best_accuracy = 0
        
        # History for visualization
        self.avg_fitness_history = []
        self.best_fitness_history = []
        self.best_accuracy_history = []
    
    def initialize_swarm(self):
        """
        Initialize the swarm with random positions and velocities.
        """
        # Initialize positions with small random values
        self.positions = np.random.randn(self.swarm_size, self.weights_size) * 0.1
        
        # Initialize velocities with small random values
        self.velocities = np.random.randn(self.swarm_size, self.weights_size) * 0.01
        
        # Initialize personal best positions and fitnesses
        self.personal_best_positions = self.positions.copy()
        self.personal_best_fitnesses = np.array([
            self.calculate_fitness(pos) for pos in self.positions
        ])
        
        # Initialize global best
        best_idx = np.argmax(self.personal_best_fitnesses)
        self.global_best_position = self.personal_best_positions[best_idx].copy()
        self.global_best_fitness = self.personal_best_fitnesses[best_idx]
        self.best_accuracy = self.neural_network.calculate_accuracy(
            self.X_test, self.y_test, self.global_best_position
        )
    
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
    
    def update_velocities(self):
        """
        Update the velocities of all particles.
        """
        # Random coefficients
        r1 = np.random.random((self.swarm_size, self.weights_size))
        r2 = np.random.random((self.swarm_size, self.weights_size))
        
        # Cognitive component (personal best influence)
        cognitive = self.cognitive_coef * r1 * (self.personal_best_positions - self.positions)
        
        # Social component (global best influence)
        social = self.social_coef * r2 * (self.global_best_position - self.positions)
        
        # Update velocities
        self.velocities = (self.inertia * self.velocities) + cognitive + social
        
        # Limit velocity to prevent explosion
        max_velocity = 0.1
        np.clip(self.velocities, -max_velocity, max_velocity, out=self.velocities)
    
    def update_positions(self):
        """
        Update the positions of all particles.
        """
        self.positions += self.velocities
    
    def update_personal_bests(self):
        """
        Update personal best positions and fitnesses.
        """
        # Calculate current fitnesses
        current_fitnesses = np.array([
            self.calculate_fitness(pos) for pos in self.positions
        ])
        
        # Find particles that improved
        improved = current_fitnesses > self.personal_best_fitnesses
        
        # Update personal bests for improved particles
        self.personal_best_positions[improved] = self.positions[improved].copy()
        self.personal_best_fitnesses[improved] = current_fitnesses[improved]
    
    def update_global_best(self):
        """
        Update global best position and fitness.
        """
        best_idx = np.argmax(self.personal_best_fitnesses)
        if self.personal_best_fitnesses[best_idx] > self.global_best_fitness:
            self.global_best_position = self.personal_best_positions[best_idx].copy()
            self.global_best_fitness = self.personal_best_fitnesses[best_idx]
            self.best_accuracy = self.neural_network.calculate_accuracy(
                self.X_test, self.y_test, self.global_best_position
            )
    
    def run(self):
        """
        Run the PSO optimization process.
        
        Returns:
            tuple: Best weights, best accuracy, and history
        """
        start_time = time.time()
        
        # Initialize swarm
        self.initialize_swarm()
        
        # Store initial best
        self.best_fitness_history.append(self.global_best_fitness)
        self.best_accuracy_history.append(self.best_accuracy)
        
        # Main optimization loop
        for iteration in range(self.iterations):
            # Update velocities and positions
            self.update_velocities()
            self.update_positions()
            
            # Update personal and global bests
            self.update_personal_bests()
            self.update_global_best()
            
            # Calculate average fitness for this iteration
            avg_fitness = np.mean(self.personal_best_fitnesses)
            self.avg_fitness_history.append(avg_fitness)
            
            # Store best fitness and accuracy for this iteration
            self.best_fitness_history.append(self.global_best_fitness)
            self.best_accuracy_history.append(self.best_accuracy)
            
            # Print progress every 10 iterations
            if (iteration + 1) % 10 == 0:
                print(f"PSO - Iteration {iteration + 1}/{self.iterations}, " +
                      f"Best Accuracy: {self.best_accuracy:.4f}, " +
                      f"Avg Fitness: {avg_fitness:.4f}")
        
        end_time = time.time()
        print(f"PSO optimization completed in {end_time - start_time:.2f} seconds")
        print(f"Final accuracy: {self.best_accuracy:.4f}")
        
        return self.global_best_position, self.best_accuracy, {
            'avg_fitness_history': self.avg_fitness_history,
            'best_fitness_history': self.best_fitness_history,
            'best_accuracy_history': self.best_accuracy_history
        }
