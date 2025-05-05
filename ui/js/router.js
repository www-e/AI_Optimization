// Router for handling page navigation
import { showLoading, hideLoading, displayErrorMessage } from './utils.js';

// Page content cache
const pageCache = {};

/**
 * Load a page into the content container
 * @param {string} page - The page to load
 */
export async function loadPage(page) {
    const contentContainer = document.getElementById('content-container');
    const pageTitle = document.getElementById('page-title');
    const pageDescription = document.getElementById('page-description');
    
    try {
        // Update page title and description
        updatePageInfo(page, pageTitle, pageDescription);
        
        // Check if page is already in cache
        if (pageCache[page]) {
            contentContainer.innerHTML = pageCache[page];
            initPageScripts(page);
            return;
        }
        
        // Show loading indicator
        showLoading();
        
        // Fetch the page content
        const response = await fetch(`components/${page}.html`);
        
        if (!response.ok) {
            throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Cache the page content
        pageCache[page] = html;
        
        // Insert the page content
        contentContainer.innerHTML = html;
        
        // Initialize page-specific scripts
        initPageScripts(page);
    } catch (error) {
        console.error('Error loading page:', error);
        contentContainer.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Page</h3>
                <p>${error.message}</p>
            </div>
        `;
        displayErrorMessage(`Failed to load ${page} page: ${error.message}`);
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

/**
 * Update page title and description based on the page
 * @param {string} page - The current page
 * @param {HTMLElement} titleElement - The title element
 * @param {HTMLElement} descriptionElement - The description element
 */
function updatePageInfo(page, titleElement, descriptionElement) {
    switch (page) {
        case 'home':
            titleElement.textContent = 'Hybrid AI Optimization';
            descriptionElement.textContent = 'Train neural networks using nature-inspired optimization algorithms';
            break;
        case 'ga':
            titleElement.textContent = 'Genetic Algorithm';
            descriptionElement.textContent = 'Optimization inspired by natural evolution and genetics';
            break;
        case 'pso':
            titleElement.textContent = 'Particle Swarm Optimization';
            descriptionElement.textContent = 'Optimization inspired by social behavior of bird flocking or fish schooling';
            break;
        case 'aco':
            titleElement.textContent = 'Ant Colony Optimization';
            descriptionElement.textContent = 'Optimization inspired by ants finding paths through pheromone trails';
            break;
        case 'tabu':
            titleElement.textContent = 'Tabu Search';
            descriptionElement.textContent = 'Metaheuristic search using memory structures to avoid revisiting previous solutions';
            break;
        case 'compare':
            titleElement.textContent = 'Algorithm Comparison';
            descriptionElement.textContent = 'Compare the performance of different optimization algorithms';
            break;
        default:
            titleElement.textContent = 'Hybrid AI Optimization';
            descriptionElement.textContent = 'Train neural networks using nature-inspired optimization algorithms';
    }
}

/**
 * Initialize page-specific scripts
 * @param {string} page - The current page
 */
function initPageScripts(page) {
    // Import and initialize page-specific scripts
    try {
        import(`./pages/${page}.js`)
            .then(module => {
                if (module.init) {
                    module.init();
                }
            })
            .catch(error => {
                console.warn(`No script found for page ${page} or error loading it:`, error);
            });
    } catch (error) {
        console.warn(`Error importing page script for ${page}:`, error);
    }
}
