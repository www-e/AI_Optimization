// Compare algorithms functionality
import { showLoading, hideLoading, displayErrorMessage, fetchResults, runOptimization } from '../utils.js';

/**
 * Run all optimization algorithms
 * @returns {Promise<Object>} The results of all algorithms
 */
export async function runAllAlgorithms() {
    try {
        showLoading();
        
        // Make an API call to the backend to run all algorithms
        const results = await runOptimization('all', {
            ga: {},
            pso: {},
            aco: {},
            tabu: {}
        });
        
        if (!results) {
            throw new Error('No results data available');
        }
        
        return results;
    } catch (error) {
        console.error('Error running all algorithms:', error);
        displayErrorMessage(`Error running all algorithms: ${error.message}`);
        throw error;
    } finally {
        hideLoading();
    }
}
