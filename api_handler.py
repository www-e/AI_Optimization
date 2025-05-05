import json
import logging
import traceback
import time
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from models.neural_network import NeuralNetwork
from optimizers.genetic_algorithm import GeneticAlgorithm
from optimizers.particle_swarm import ParticleSwarmOptimization
from optimizers.ant_colony import AntColonyOptimization
from optimizers.tabu_search import TabuSearch
from utils.data_handler import DataHandler
from utils.visualization import Visualizer

class APIHandler(BaseHTTPRequestHandler):
    """Handler for API requests from the frontend."""
    
    # Store data and neural network as class variables to avoid reloading
    data_loaded = False
    data_handler = None
    nn = None
    X_train = None
    X_test = None
    y_train = None
    y_test = None
    
    def _set_headers(self, status_code=200, content_type='application/json'):
        """Set response headers."""
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')  # Enable CORS
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight."""
        self._set_headers()
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Default to serving the UI
        if path == '/' or path == '':
            self.serve_static_file('ui/index.html')
            return
        
        # API endpoints
        if path == '/api/status':
            self._set_headers()
            response = {'status': 'ok', 'message': 'Server is running'}
            self.wfile.write(json.dumps(response).encode())
            return
        elif path == '/api/results':
            self.serve_results()
            return
        
        # Serve static files - handle all other paths as static file requests
        # First check if it starts with /ui/ and remove it if needed
        if path.startswith('/ui/'):
            path = path[4:]  # Remove /ui/ prefix
            self.serve_static_file(f'ui/{path}')
        else:
            # Try to serve from ui directory anyway (for relative paths in HTML/CSS)
            self.serve_static_file(f'ui{path}')
    
    def do_POST(self):
        """Handle POST requests."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Get request body
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            # Parse JSON data
            data = json.loads(post_data)
            
            # Initialize data and neural network if not already done
            if not APIHandler.data_loaded:
                self.initialize_data_and_nn()
            
            # Handle algorithm endpoints
            if path == '/api/run/ga':
                result = self.run_genetic_algorithm(data)
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
            elif path == '/api/run/pso':
                result = self.run_particle_swarm(data)
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
            elif path == '/api/run/aco':
                result = self.run_ant_colony(data)
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
            elif path == '/api/run/tabu':
                result = self.run_tabu_search(data)
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
            elif path == '/api/run/all':
                result = self.run_all_algorithms(data)
                self._set_headers()
                self.wfile.write(json.dumps(result).encode())
            else:
                self._set_headers(404)
                response = {'error': 'Not found'}
                self.wfile.write(json.dumps(response).encode())
        except json.JSONDecodeError:
            self._set_headers(400)
            response = {'error': 'Invalid JSON'}
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            logging.error(f"Error handling request: {str(e)}")
            logging.error(traceback.format_exc())
            self._set_headers(500)
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode())
    
    def serve_static_file(self, file_path):
        """Serve a static file."""
        try:
            # Get the current working directory
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            absolute_path = os.path.join(base_dir, file_path)
            
            # Determine content type based on file extension
            content_type = 'text/html'
            if file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.png'):
                content_type = 'image/png'
            elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            
            with open(absolute_path, 'rb') as file:
                self._set_headers(200, content_type)
                self.wfile.write(file.read())
        except FileNotFoundError:
            logging.error(f"File not found: {file_path}")
            self._set_headers(404)
            response = {'error': f'File not found: {file_path}'}
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            logging.error(f"Error serving static file {file_path}: {str(e)}")
            logging.error(traceback.format_exc())
            self._set_headers(500)
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode())
    
    def serve_results(self):
        """Serve the results.json file."""
        try:
            # Get the current working directory
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            results_path = os.path.join(base_dir, 'ui', 'assets', 'results.json')
            
            with open(results_path, 'r') as f:
                results = json.load(f)
            self._set_headers()
            self.wfile.write(json.dumps(results).encode())
        except FileNotFoundError:
            # Create empty results file if it doesn't exist
            results = {
                'algorithms': {
                    'ga': {'accuracy_history': [], 'final_accuracy': 0.0, 'execution_time': 0.0},
                    'pso': {'accuracy_history': [], 'final_accuracy': 0.0, 'execution_time': 0.0},
                    'aco': {'accuracy_history': [], 'final_accuracy': 0.0, 'execution_time': 0.0},
                    'tabu': {'accuracy_history': [], 'final_accuracy': 0.0, 'execution_time': 0.0}
                },
                'best_algorithm': 'None',
                'best_accuracy': 0.0
            }
            
            # Ensure directory exists
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            assets_dir = os.path.join(base_dir, 'ui', 'assets')
            os.makedirs(assets_dir, exist_ok=True)
            
            # Save empty results
            results_path = os.path.join(assets_dir, 'results.json')
            with open(results_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            self._set_headers()
            self.wfile.write(json.dumps(results).encode())
        except Exception as e:
            logging.error(f"Error serving results: {str(e)}")
            logging.error(traceback.format_exc())
            self._set_headers(500)
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode())
    
    def initialize_data_and_nn(self):
        """Initialize data and neural network."""
        try:
            logging.info("Loading and preprocessing data...")
            APIHandler.data_handler = DataHandler()
            APIHandler.X_train, APIHandler.X_test, APIHandler.y_train, APIHandler.y_test = APIHandler.data_handler.load_iris_data()
            
            # Initialize neural network
            input_size = APIHandler.X_train.shape[1]
            hidden_size = 8  # Default value, can be made configurable
            output_size = 3  # Iris has 3 classes
            APIHandler.nn = NeuralNetwork(input_size, hidden_size, output_size)
            
            APIHandler.data_loaded = True
            logging.info(f"Neural network created with architecture: {input_size}-{hidden_size}-{output_size}")
        except Exception as e:
            logging.error(f"Error initializing data and neural network: {str(e)}")
            logging.error(traceback.format_exc())
            raise
    
    def run_genetic_algorithm(self, data):
        """Run the Genetic Algorithm with the specified parameters."""
        try:
            logging.info("\nRunning Genetic Algorithm...")
            start_time = time.time()
            
            # Extract parameters from request data
            population_size = int(data.get('population_size', 50))
            generations = int(data.get('generations', 100))
            mutation_rate = float(data.get('mutation_rate', 0.1))
            
            logging.info(f"GA Parameters: population_size={population_size}, generations={generations}, mutation_rate={mutation_rate}")
            
            ga = GeneticAlgorithm(
                APIHandler.nn, 
                APIHandler.X_train, 
                APIHandler.y_train, 
                APIHandler.X_test, 
                APIHandler.y_test,
                population_size=population_size,
                generations=generations,
                mutation_rate=mutation_rate
            )
            
            best_weights, best_accuracy, history = ga.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': best_accuracy,
                'accuracy_history': history['best_accuracy_history'],
                'execution_time': execution_time
            }
            
            logging.info(f"GA Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            save_path = os.path.join(base_dir, 'ui', 'assets', 'ga_accuracy.png')
            visualizer.plot_accuracy_history(
                history['best_accuracy_history'], 
                title="Genetic Algorithm Accuracy History",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Genetic Algorithm: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_particle_swarm(self, data):
        """Run the Particle Swarm Optimization with the specified parameters."""
        try:
            logging.info("\nRunning Particle Swarm Optimization...")
            start_time = time.time()
            
            # Extract parameters from request data
            swarm_size = int(data.get('swarm_size', 30))
            iterations = int(data.get('iterations', 100))
            inertia = float(data.get('inertia', 0.7))
            cognitive_coef = float(data.get('cognitive_coef', 1.5))
            social_coef = float(data.get('social_coef', 1.5))
            
            logging.info(f"PSO Parameters: swarm_size={swarm_size}, iterations={iterations}, inertia={inertia}, cognitive_coef={cognitive_coef}, social_coef={social_coef}")
            
            pso = ParticleSwarmOptimization(
                APIHandler.nn, 
                APIHandler.X_train, 
                APIHandler.y_train, 
                APIHandler.X_test, 
                APIHandler.y_test,
                swarm_size=swarm_size,
                iterations=iterations,
                inertia=inertia,
                cognitive_coef=cognitive_coef,
                social_coef=social_coef
            )
            
            best_weights, best_accuracy, history = pso.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': best_accuracy,
                'accuracy_history': history['best_accuracy_history'],
                'execution_time': execution_time
            }
            
            logging.info(f"PSO Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            save_path = os.path.join(base_dir, 'ui', 'assets', 'pso_accuracy.png')
            visualizer.plot_accuracy_history(
                history['best_accuracy_history'], 
                title="Particle Swarm Optimization Accuracy History",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Particle Swarm Optimization: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_ant_colony(self, data):
        """Run the Ant Colony Optimization with the specified parameters."""
        try:
            logging.info("\nRunning Ant Colony Optimization...")
            start_time = time.time()
            
            # Extract parameters from request data
            ant_count = int(data.get('ant_count', 20))
            iterations = int(data.get('iterations', 100))
            pheromone_importance = float(data.get('pheromone_importance', 1.0))
            heuristic_importance = float(data.get('heuristic_importance', 2.0))
            evaporation_rate = float(data.get('evaporation_rate', 0.5))
            
            logging.info(f"ACO Parameters: ant_count={ant_count}, iterations={iterations}, pheromone_importance={pheromone_importance}, heuristic_importance={heuristic_importance}, evaporation_rate={evaporation_rate}")
            
            aco = AntColonyOptimization(
                APIHandler.nn, 
                APIHandler.X_train, 
                APIHandler.y_train, 
                APIHandler.X_test, 
                APIHandler.y_test,
                ant_count=ant_count,
                iterations=iterations,
                pheromone_importance=pheromone_importance,
                heuristic_importance=heuristic_importance,
                evaporation_rate=evaporation_rate
            )
            
            best_weights, best_accuracy, history = aco.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': best_accuracy,
                'accuracy_history': history['best_accuracy_history'],
                'execution_time': execution_time
            }
            
            logging.info(f"ACO Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            save_path = os.path.join(base_dir, 'ui', 'assets', 'aco_accuracy.png')
            visualizer.plot_accuracy_history(
                history['best_accuracy_history'], 
                title="Ant Colony Optimization Accuracy History",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Ant Colony Optimization: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_tabu_search(self, data):
        """Run the Tabu Search with the specified parameters."""
        try:
            logging.info("\nRunning Tabu Search...")
            start_time = time.time()
            
            # Extract parameters from request data
            iterations = int(data.get('iterations', 100))
            tabu_list_size = int(data.get('tabu_list_size', 10))
            neighborhood_size = int(data.get('neighborhood_size', 20))
            step_size = float(data.get('step_size', 0.1))
            
            logging.info(f"Tabu Search Parameters: iterations={iterations}, tabu_list_size={tabu_list_size}, neighborhood_size={neighborhood_size}, step_size={step_size}")
            
            tabu = TabuSearch(
                APIHandler.nn, 
                APIHandler.X_train, 
                APIHandler.y_train, 
                APIHandler.X_test, 
                APIHandler.y_test,
                iterations=iterations,
                tabu_list_size=tabu_list_size,
                neighborhood_size=neighborhood_size,
                step_size=step_size
            )
            
            best_weights, best_accuracy, history = tabu.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': best_accuracy,
                'accuracy_history': history['best_accuracy_history'],
                'execution_time': execution_time
            }
            
            logging.info(f"Tabu Search Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            save_path = os.path.join(base_dir, 'ui', 'assets', 'tabu_accuracy.png')
            visualizer.plot_accuracy_history(
                history['best_accuracy_history'], 
                title="Tabu Search Accuracy History",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Tabu Search: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_all_algorithms(self, data):
        """Run all optimization algorithms with the specified parameters."""
        try:
            logging.info("\nRunning all optimization algorithms...")
            
            # Run each algorithm
            ga_result = self.run_genetic_algorithm(data.get('ga', {}))
            pso_result = self.run_particle_swarm(data.get('pso', {}))
            aco_result = self.run_ant_colony(data.get('aco', {}))
            tabu_result = self.run_tabu_search(data.get('tabu', {}))
            
            # Determine best algorithm
            algorithms = {
                'ga': ga_result.get('best_accuracy', 0.0),
                'pso': pso_result.get('best_accuracy', 0.0),
                'aco': aco_result.get('best_accuracy', 0.0),
                'tabu': tabu_result.get('best_accuracy', 0.0)
            }
            
            best_algorithm = max(algorithms, key=algorithms.get)
            best_accuracy = algorithms[best_algorithm]
            
            # Create results data
            results_data = {
                'algorithms': {
                    'ga': ga_result,
                    'pso': pso_result,
                    'aco': aco_result,
                    'tabu': tabu_result
                },
                'best_algorithm': best_algorithm,
                'best_accuracy': best_accuracy
            }
            
            # Save to JSON file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            assets_dir = os.path.join(base_dir, 'ui', 'assets')
            os.makedirs(assets_dir, exist_ok=True)
            results_path = os.path.join(assets_dir, 'results.json')
            with open(results_path, 'w') as f:
                json.dump(results_data, f, indent=2)
            
            logging.info("\nComparison of Results:")
            logging.info("-" * 50)
            logging.info(f"GA Best Accuracy: {ga_result.get('best_accuracy', 0.0)}")
            logging.info(f"PSO Best Accuracy: {pso_result.get('best_accuracy', 0.0)}")
            logging.info(f"ACO Best Accuracy: {aco_result.get('best_accuracy', 0.0)}")
            logging.info(f"Tabu Search Best Accuracy: {tabu_result.get('best_accuracy', 0.0)}")
            logging.info(f"\n{best_algorithm.upper()} performed best with accuracy: {best_accuracy}")
            
            # Create comparison visualization
            visualizer = Visualizer()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            save_path = os.path.join(base_dir, 'ui', 'assets', 'comparison.png')
            visualizer.plot_comparison(
                {
                    'GA': ga_result.get('accuracy_history', []),
                    'PSO': pso_result.get('accuracy_history', []),
                    'ACO': aco_result.get('accuracy_history', []),
                    'Tabu': tabu_result.get('accuracy_history', [])
                },
                save_path=save_path
            )
            
            return results_data
        except Exception as e:
            logging.error(f"Error running all algorithms: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
