import os
import argparse
import threading
import webbrowser
import logging
import traceback
import socketserver
import http.server
import time
import json
from urllib.parse import urlparse, parse_qs
import mimetypes

from models.neural_network import NeuralNetwork
from optimizers.genetic_algorithm import GeneticAlgorithm
from optimizers.particle_swarm import ParticleSwarmOptimization
from optimizers.ant_colony import AntColonyOptimization
from optimizers.tabu_search import TabuSearch
from utils.data_handler import DataHandler
from utils.visualization import Visualizer

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("optimization.log"),
        logging.StreamHandler()
    ]
)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Hybrid AI Optimization')
    
    # Web server parameters
    parser.add_argument('--port', type=int, default=8000,
                        help='Port for the web server (default: 8000)')
    parser.add_argument('--no-browser', action='store_true',
                        help='Do not open browser automatically')
    
    return parser.parse_args()

class HybridAIOptimizationHandler(http.server.SimpleHTTPRequestHandler):
    # Class variables to store data and neural network
    data_loaded = False
    data_handler = None
    nn = None
    X_train = None
    X_test = None
    y_train = None
    y_test = None
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        self.directory = os.path.join(os.path.dirname(os.path.abspath(__file__)))
        super().__init__(*args, **kwargs)
    
    def log_message(self, format, *args):
        # Override to use our logging system
        logging.info("%s - - [%s] %s" %
                     (self.address_string(),
                      self.log_date_time_string(),
                      format % args))
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        # Parse URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # API endpoints
        if path.startswith('/api/'):
            self.handle_api_request(path)
            return
        
        # Serve static files
        if path == '/':
            # Redirect to index.html
            self.path = '/ui/index.html'
        elif not path.startswith('/ui/'):
            # Prepend /ui/ to all non-API paths
            self.path = f'/ui{path}'
        
        try:
            # Use the parent class method to serve static files
            super().do_GET()
        except Exception as e:
            logging.error(f"Error serving static file: {str(e)}")
            logging.error(traceback.format_exc())
            self.send_error(500, f"Server Error: {str(e)}")
    
    def do_POST(self):
        # Parse URL
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Only handle API endpoints
        if path.startswith('/api/'):
            # Get request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                # Parse JSON data
                data = json.loads(post_data)
                self.handle_api_post(path, data)
            except json.JSONDecodeError:
                self.send_error(400, "Invalid JSON")
            except Exception as e:
                logging.error(f"Error handling POST request: {str(e)}")
                logging.error(traceback.format_exc())
                self.send_error(500, f"Server Error: {str(e)}")
        else:
            self.send_error(404, "Not Found")
    
    def handle_api_request(self, path):
        """Handle API GET requests"""
        if path == '/api/status':
            self.send_json_response({'status': 'ok', 'message': 'Server is running'})
        elif path == '/api/results':
            self.serve_results()
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_api_post(self, path, data):
        """Handle API POST requests"""
        # Initialize data and neural network if not already done
        if not self.__class__.data_loaded:
            self.initialize_data_and_nn()
        
        # Handle algorithm endpoints
        if path == '/api/run/ga':
            result = self.run_genetic_algorithm(data)
            self.send_json_response(result)
        elif path == '/api/run/pso':
            result = self.run_particle_swarm(data)
            self.send_json_response(result)
        elif path == '/api/run/aco':
            result = self.run_ant_colony(data)
            self.send_json_response(result)
        elif path == '/api/run/tabu':
            result = self.run_tabu_search(data)
            self.send_json_response(result)
        elif path == '/api/run/all':
            result = self.run_all_algorithms(data)
            self.send_json_response(result)
        else:
            self.send_error(404, "API endpoint not found")
    
    def send_json_response(self, data):
        """Send a JSON response"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def serve_results(self):
        """Serve the results.json file"""
        try:
            # Get the results file path
            results_path = os.path.join(self.directory, 'ui', 'assets', 'results.json')
            
            # Check if the file exists
            if os.path.exists(results_path):
                with open(results_path, 'r') as f:
                    results = json.load(f)
                self.send_json_response(results)
            else:
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
                assets_dir = os.path.join(self.directory, 'ui', 'assets')
                os.makedirs(assets_dir, exist_ok=True)
                
                # Save empty results
                with open(results_path, 'w') as f:
                    json.dump(results, f, indent=2)
                
                self.send_json_response(results)
        except Exception as e:
            logging.error(f"Error serving results: {str(e)}")
            logging.error(traceback.format_exc())
            self.send_error(500, f"Server Error: {str(e)}")
    
    def initialize_data_and_nn(self):
        """Initialize data and neural network"""
        try:
            logging.info("Loading and preprocessing data...")
            self.__class__.data_handler = DataHandler()
            self.__class__.X_train, self.__class__.X_test, self.__class__.y_train, self.__class__.y_test = self.__class__.data_handler.load_iris_data()
            
            # Initialize neural network
            input_size = self.__class__.X_train.shape[1]
            hidden_size = 8  # Default value, can be made configurable
            output_size = 3  # Iris has 3 classes
            self.__class__.nn = NeuralNetwork(input_size, hidden_size, output_size)
            
            self.__class__.data_loaded = True
            logging.info(f"Neural network created with architecture: {input_size}-{hidden_size}-{output_size}")
        except Exception as e:
            logging.error(f"Error initializing data and neural network: {str(e)}")
            logging.error(traceback.format_exc())
            raise
    
    def run_genetic_algorithm(self, data):
        """Run the Genetic Algorithm with the specified parameters"""
        try:
            logging.info("\nRunning Genetic Algorithm...")
            start_time = time.time()
            
            # Extract parameters from request data
            population_size = int(data.get('population_size', 50))
            generations = int(data.get('generations', 100))
            mutation_rate = float(data.get('mutation_rate', 0.1))
            
            logging.info(f"GA Parameters: population_size={population_size}, generations={generations}, mutation_rate={mutation_rate}")
            
            ga = GeneticAlgorithm(
                self.__class__.nn, 
                self.__class__.X_train, 
                self.__class__.y_train, 
                self.__class__.X_test, 
                self.__class__.y_test,
                population_size=population_size,
                generations=generations,
                mutation_rate=mutation_rate
            )
            
            best_weights, best_accuracy, history = ga.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': float(best_accuracy),
                'accuracy_history': [float(x) for x in history['best_accuracy_history']],
                'execution_time': float(execution_time)
            }
            
            logging.info(f"GA Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer(output_dir=os.path.join(self.directory, 'ui', 'assets'))
            save_path = os.path.join(self.directory, 'ui', 'assets', 'ga_accuracy.png')
            
            # Call the visualization function with the correct parameters
            visualizer.plot_individual_accuracy(
                history=history,
                title="Genetic Algorithm",
                color="blue",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Genetic Algorithm: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_particle_swarm(self, data):
        """Run the Particle Swarm Optimization with the specified parameters"""
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
                self.__class__.nn, 
                self.__class__.X_train, 
                self.__class__.y_train, 
                self.__class__.X_test, 
                self.__class__.y_test,
                swarm_size=swarm_size,
                iterations=iterations,
                inertia=inertia,
                cognitive_coef=cognitive_coef,
                social_coef=social_coef
            )
            
            best_weights, best_accuracy, history = pso.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': float(best_accuracy),
                'accuracy_history': [float(x) for x in history['best_accuracy_history']],
                'execution_time': float(execution_time)
            }
            
            logging.info(f"PSO Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer(output_dir=os.path.join(self.directory, 'ui', 'assets'))
            save_path = os.path.join(self.directory, 'ui', 'assets', 'pso_accuracy.png')
            
            # Call the visualization function with the correct parameters
            visualizer.plot_individual_accuracy(
                history=history,
                title="Particle Swarm Optimization",
                color="red",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Particle Swarm Optimization: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_ant_colony(self, data):
        """Run the Ant Colony Optimization with the specified parameters"""
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
                self.__class__.nn, 
                self.__class__.X_train, 
                self.__class__.y_train, 
                self.__class__.X_test, 
                self.__class__.y_test,
                ant_count=ant_count,
                iterations=iterations,
                pheromone_importance=pheromone_importance,
                heuristic_importance=heuristic_importance,
                evaporation_rate=evaporation_rate
            )
            
            best_weights, best_accuracy, history = aco.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': float(best_accuracy),
                'accuracy_history': [float(x) for x in history['best_accuracy_history']],
                'execution_time': float(execution_time)
            }
            
            logging.info(f"ACO Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer(output_dir=os.path.join(self.directory, 'ui', 'assets'))
            save_path = os.path.join(self.directory, 'ui', 'assets', 'aco_accuracy.png')
            
            # Call the visualization function with the correct parameters
            visualizer.plot_individual_accuracy(
                history=history,
                title="Ant Colony Optimization",
                color="green",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Ant Colony Optimization: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_tabu_search(self, data):
        """Run the Tabu Search with the specified parameters"""
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
                self.__class__.nn, 
                self.__class__.X_train, 
                self.__class__.y_train, 
                self.__class__.X_test, 
                self.__class__.y_test,
                iterations=iterations,
                tabu_list_size=tabu_list_size,
                neighborhood_size=neighborhood_size,
                step_size=step_size
            )
            
            best_weights, best_accuracy, history = tabu.run()
            execution_time = time.time() - start_time
            
            result = {
                'best_accuracy': float(best_accuracy),
                'accuracy_history': [float(x) for x in history['best_accuracy_history']],
                'execution_time': float(execution_time)
            }
            
            logging.info(f"Tabu Search Best Accuracy: {best_accuracy:.4f}, Time: {execution_time:.2f}s")
            
            # Save visualization
            visualizer = Visualizer(output_dir=os.path.join(self.directory, 'ui', 'assets'))
            save_path = os.path.join(self.directory, 'ui', 'assets', 'tabu_accuracy.png')
            
            # Call the visualization function with the correct parameters
            visualizer.plot_individual_accuracy(
                history=history,
                title="Tabu Search",
                color="purple",
                save_path=save_path
            )
            
            return result
        except Exception as e:
            logging.error(f"Error running Tabu Search: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}
    
    def run_all_algorithms(self, data):
        """Run all optimization algorithms with the specified parameters"""
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
            assets_dir = os.path.join(self.directory, 'ui', 'assets')
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
            visualizer = Visualizer(output_dir=assets_dir)
            save_path = os.path.join(assets_dir, 'comparison.png')
            
            # Create dictionaries with the format expected by the visualizer
            ga_history = {'best_accuracy_history': ga_result.get('accuracy_history', [])}
            pso_history = {'best_accuracy_history': pso_result.get('accuracy_history', [])}
            aco_history = {'best_accuracy_history': aco_result.get('accuracy_history', [])}
            tabu_history = {'best_accuracy_history': tabu_result.get('accuracy_history', [])}
            
            try:
                # Call the visualization function with the correct parameters
                visualizer.plot_accuracy_history(
                    ga_history=ga_history,
                    pso_history=pso_history,
                    aco_history=aco_history,
                    tabu_history=tabu_history,
                    save_path=save_path
                )
            except Exception as e:
                logging.error(f"Error creating comparison visualization: {str(e)}")
                logging.error(traceback.format_exc())
            
            return results_data
        except Exception as e:
            logging.error(f"Error running all algorithms: {str(e)}")
            logging.error(traceback.format_exc())
            return {'error': str(e)}


def start_web_server(port=8000):
    """Start a web server with API endpoints for the UI."""
    try:
        # Register common MIME types
        mimetypes.add_type('text/css', '.css')
        mimetypes.add_type('application/javascript', '.js')
        mimetypes.add_type('application/json', '.json')
        
        # Create server
        server_address = ('', port)
        httpd = socketserver.ThreadingTCPServer(server_address, HybridAIOptimizationHandler)
        httpd.daemon_threads = True
        
        print(f"\nServer started at http://localhost:{port}")
        print("Press Ctrl+C to stop the server")
        
        # Start server
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        logging.error(f"Error starting web server: {str(e)}")
        logging.error(traceback.format_exc())

def main():
    """Main function to start the web server."""
    # Parse arguments
    args = parse_arguments()
    
    print("Starting Hybrid AI Optimization Project...")
    print("=" * 50)
    print("Web server starting - algorithms will run when requested through the UI")
    
    # Ensure UI assets directory exists
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui', 'assets'), exist_ok=True)
    
    # Start the web server in a separate thread
    server_thread = threading.Thread(target=lambda: start_web_server(args.port))
    server_thread.daemon = True  # This makes the thread exit when the main program exits
    server_thread.start()
    
    # Open the browser automatically if not disabled
    if not args.no_browser:
        webbrowser.open(f"http://localhost:{args.port}")
    
    # Keep the main thread running to keep the server alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info("\nProgram terminated by user.")


if __name__ == "__main__":
    main()
