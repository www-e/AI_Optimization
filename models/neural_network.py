import numpy as np

class NeuralNetwork:
    """
    A simple feedforward neural network with one hidden layer.
    Uses sigmoid activation for hidden layer and softmax for output layer.
    """
    
    def __init__(self, input_size, hidden_size, output_size):
        """
        Initialize the neural network with given layer sizes.
        
        Args:
            input_size (int): Number of input features
            hidden_size (int): Number of neurons in the hidden layer
            output_size (int): Number of output classes
        """
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # Calculate total number of weights needed
        self.total_weights = (input_size * hidden_size) + hidden_size + (hidden_size * output_size) + output_size
        
    def _unpack_weights(self, weights):
        """
        Unpack a flat array of weights into the network's weight matrices and bias vectors.
        
        Args:
            weights (numpy.ndarray): Flat array of weights
            
        Returns:
            tuple: Weight matrices and bias vectors (W1, b1, W2, b2)
        """
        # Extract weights for the hidden layer
        W1_size = self.input_size * self.hidden_size
        W1 = weights[:W1_size].reshape(self.input_size, self.hidden_size)
        
        # Extract biases for the hidden layer
        b1_size = self.hidden_size
        b1_start = W1_size
        b1_end = b1_start + b1_size
        b1 = weights[b1_start:b1_end]
        
        # Extract weights for the output layer
        W2_size = self.hidden_size * self.output_size
        W2_start = b1_end
        W2_end = W2_start + W2_size
        W2 = weights[W2_start:W2_end].reshape(self.hidden_size, self.output_size)
        
        # Extract biases for the output layer
        b2_size = self.output_size
        b2_start = W2_end
        b2 = weights[b2_start:b2_start + b2_size]
        
        return W1, b1, W2, b2
    
    def sigmoid(self, x):
        """
        Sigmoid activation function.
        
        Args:
            x (numpy.ndarray): Input array
            
        Returns:
            numpy.ndarray: Output after applying sigmoid
        """
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))  # Clip to avoid overflow
    
    def softmax(self, x):
        """
        Softmax activation function.
        
        Args:
            x (numpy.ndarray): Input array
            
        Returns:
            numpy.ndarray: Output after applying softmax
        """
        # Subtract max for numerical stability
        exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return exp_x / np.sum(exp_x, axis=1, keepdims=True)
    
    def forward(self, X, weights):
        """
        Forward pass through the neural network.
        
        Args:
            X (numpy.ndarray): Input data
            weights (numpy.ndarray): Flat array of weights
            
        Returns:
            tuple: Output probabilities and predicted classes
        """
        # Unpack weights
        W1, b1, W2, b2 = self._unpack_weights(weights)
        
        # Hidden layer
        Z1 = np.dot(X, W1) + b1
        A1 = self.sigmoid(Z1)
        
        # Output layer
        Z2 = np.dot(A1, W2) + b2
        A2 = self.softmax(Z2)
        
        # Get predicted class
        y_pred = np.argmax(A2, axis=1)
        
        return A2, y_pred
    
    def calculate_accuracy(self, X, y, weights):
        """
        Calculate the accuracy of the neural network.
        
        Args:
            X (numpy.ndarray): Input data
            y (numpy.ndarray): True labels
            weights (numpy.ndarray): Flat array of weights
            
        Returns:
            float: Accuracy score
        """
        _, y_pred = self.forward(X, weights)
        return np.mean(y_pred == y)
    
    def calculate_loss(self, X, y, weights):
        """
        Calculate the cross-entropy loss.
        
        Args:
            X (numpy.ndarray): Input data
            y (numpy.ndarray): True labels (as integers)
            weights (numpy.ndarray): Flat array of weights
            
        Returns:
            float: Cross-entropy loss
        """
        m = X.shape[0]
        y_prob, _ = self.forward(X, weights)
        
        # Convert y to one-hot encoding
        y_one_hot = np.zeros((m, self.output_size))
        y_one_hot[np.arange(m), y] = 1
        
        # Calculate cross-entropy loss
        log_likelihood = -np.log(np.sum(y_one_hot * y_prob, axis=1) + 1e-10)
        loss = np.sum(log_likelihood) / m
        
        return loss
    
    def initialize_random_weights(self):
        """
        Initialize random weights for the neural network.
        
        Returns:
            numpy.ndarray: Flat array of random weights
        """
        # Xavier initialization for better convergence
        scale1 = np.sqrt(2.0 / (self.input_size + self.hidden_size))
        scale2 = np.sqrt(2.0 / (self.hidden_size + self.output_size))
        
        # Initialize weights
        W1 = np.random.randn(self.input_size, self.hidden_size) * scale1
        b1 = np.zeros(self.hidden_size)
        W2 = np.random.randn(self.hidden_size, self.output_size) * scale2
        b2 = np.zeros(self.output_size)
        
        # Flatten all weights into a single array
        weights = np.concatenate([
            W1.flatten(), 
            b1.flatten(), 
            W2.flatten(), 
            b2.flatten()
        ])
        
        return weights
