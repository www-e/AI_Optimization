import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class DataHandler:
    """
    Utility class for loading and preprocessing datasets.
    Currently supports the Iris dataset.
    """
    
    def __init__(self, test_size=0.2, random_state=42):
        """
        Initialize the data handler.
        
        Args:
            test_size (float): Proportion of the dataset to include in the test split
            random_state (int): Random seed for reproducibility
        """
        self.test_size = test_size
        self.random_state = random_state
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = StandardScaler()
        
    def load_iris_data(self):
        """
        Load and preprocess the Iris dataset.
        
        Returns:
            tuple: X_train, X_test, y_train, y_test
        """
        # Load the Iris dataset
        iris = load_iris()
        X = iris.data
        y = iris.target
        
        # Split the data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=self.random_state
        )
        
        # Standardize the features
        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)
        
        self.X_train = X_train
        self.X_test = X_test
        self.y_train = y_train
        self.y_test = y_test
        
        # Store dataset information
        self.input_size = X_train.shape[1]
        self.output_size = len(np.unique(y_train))
        
        return X_train, X_test, y_train, y_test
    
    def get_data_dimensions(self):
        """
        Get the dimensions of the loaded dataset.
        
        Returns:
            tuple: input_size, output_size
        """
        if self.X_train is None:
            raise ValueError("Data not loaded. Call load_iris_data() first.")
        
        return self.input_size, self.output_size
