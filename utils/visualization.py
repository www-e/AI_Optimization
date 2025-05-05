import numpy as np
import matplotlib
# Use non-interactive backend to avoid thread issues
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
import json

class Visualizer:
    """
    Utility class for visualizing optimization results.
    """
    
    def __init__(self, output_dir='../ui/assets'):
        """
        Initialize the visualizer.
        
        Args:
            output_dir (str): Directory to save visualization outputs
        """
        self.output_dir = output_dir
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    def plot_accuracy_history(self, ga_history=None, pso_history=None, aco_history=None, tabu_history=None, save_path=None):
        """
        Plot the accuracy history for both GA and PSO.
        
        Args:
            ga_history (dict): History from GA optimization
            pso_history (dict): History from PSO optimization
            save_path (str): Path to save the plot
        """
        plt.figure(figsize=(10, 6))
        
        # Plot accuracy history for each algorithm if provided
        if ga_history is not None:
            plt.plot(ga_history['best_accuracy_history'], label='GA', color='blue')
        
        if pso_history is not None:
            plt.plot(pso_history['best_accuracy_history'], label='PSO', color='red')
            
        if aco_history is not None:
            plt.plot(aco_history['best_accuracy_history'], label='ACO', color='green')
            
        if tabu_history is not None:
            plt.plot(tabu_history['best_accuracy_history'], label='Tabu', color='purple')
        
        plt.title('Accuracy vs. Iterations')
        plt.xlabel('Iteration/Generation')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Save the plot if a path is provided
        if save_path:
            plt.savefig(save_path)
            plt.close()
        else:
            plt.show()
    
    def plot_individual_accuracy(self, history, title, color, save_path=None):
        """
        Plot the accuracy history for a single algorithm.
        
        Args:
            history (dict): History from optimization
            title (str): Title for the plot
            color (str): Color for the plot line
            save_path (str): Path to save the plot
        """
        plt.figure(figsize=(10, 6))
        
        # Plot accuracy history
        plt.plot(history['best_accuracy_history'], label=title, color=color)
        
        plt.title(f'{title} Accuracy vs. Iterations')
        plt.xlabel('Iteration/Generation')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Save the plot if a path is provided
        if save_path:
            plt.savefig(save_path)
            plt.close()
        else:
            plt.show()
    
    def save_results_to_json(self, ga_results=None, pso_results=None, aco_results=None, tabu_results=None, save_path=None):
        """
        Save optimization results to a JSON file for the UI.
        
        Args:
            ga_results (dict): Results from GA optimization
            pso_results (dict): Results from PSO optimization
            save_path (str): Path to save the JSON file
        """
        results = {'algorithms': {}}
        
        # Add results for each algorithm if provided
        if ga_results is not None:
            results['algorithms']['ga'] = {
                'accuracy_history': ga_results['best_accuracy_history'],
                'final_accuracy': ga_results['best_accuracy_history'][-1]
            }
            
        if pso_results is not None:
            results['algorithms']['pso'] = {
                'accuracy_history': pso_results['best_accuracy_history'],
                'final_accuracy': pso_results['best_accuracy_history'][-1]
            }
            
        if aco_results is not None:
            results['algorithms']['aco'] = {
                'accuracy_history': aco_results['best_accuracy_history'],
                'final_accuracy': aco_results['best_accuracy_history'][-1]
            }
            
        if tabu_results is not None:
            results['algorithms']['tabu'] = {
                'accuracy_history': tabu_results['best_accuracy_history'],
                'final_accuracy': tabu_results['best_accuracy_history'][-1]
            }
            
        # Determine the best algorithm
        best_accuracy = -1
        best_algorithm = None
        
        for algo, data in results['algorithms'].items():
            if data['final_accuracy'] > best_accuracy:
                best_accuracy = data['final_accuracy']
                best_algorithm = algo
                
        results['best_algorithm'] = best_algorithm
        results['best_accuracy'] = best_accuracy
        
        with open(save_path, 'w') as f:
            json.dump(results, f)
    
    def generate_all_visualizations(self, ga_results=None, pso_results=None, aco_results=None, tabu_results=None):
        """
        Generate all visualizations and save results.
        
        Args:
            ga_results (dict): Results from GA optimization
            pso_results (dict): Results from PSO optimization
        """
        # Plot combined accuracy history
        self.plot_accuracy_history(
            ga_results, 
            pso_results,
            aco_results,
            tabu_results,
            os.path.join(self.output_dir, 'combined_accuracy.png')
        )
        
        # Plot individual accuracy histories
        if ga_results is not None:
            self.plot_individual_accuracy(
                ga_results, 
                'Genetic Algorithm', 
                'blue',
                os.path.join(self.output_dir, 'ga_accuracy.png')
            )
        
        if pso_results is not None:
            self.plot_individual_accuracy(
                pso_results, 
                'Particle Swarm Optimization', 
                'red',
                os.path.join(self.output_dir, 'pso_accuracy.png')
            )
            
        if aco_results is not None:
            self.plot_individual_accuracy(
                aco_results, 
                'Ant Colony Optimization', 
                'green',
                os.path.join(self.output_dir, 'aco_accuracy.png')
            )
            
        if tabu_results is not None:
            self.plot_individual_accuracy(
                tabu_results, 
                'Tabu Search', 
                'purple',
                os.path.join(self.output_dir, 'tabu_accuracy.png')
            )
        
        # Save results to JSON
        self.save_results_to_json(
            ga_results, 
            pso_results,
            aco_results,
            tabu_results,
            os.path.join(self.output_dir, 'results.json')
        )
