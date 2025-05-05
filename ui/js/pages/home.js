// Home page functionality
import { loadPage } from '../router.js';

// Initialize the page
export function init() {
    console.log('Initializing Home page');
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Set up navigation for the algorithm cards
    const exploreButtons = document.querySelectorAll('.home-container button[onclick]');
    
    exploreButtons.forEach(button => {
        // Replace the inline onclick with proper event listener
        const href = button.getAttribute('onclick').replace("window.location.href='", "").replace("')", "");
        
        // Remove the inline onclick
        button.removeAttribute('onclick');
        
        // Add event listener
        button.addEventListener('click', () => {
            // Extract the page name from the href (e.g., '#ga' -> 'ga')
            const page = href.replace('#', '');
            
            // Update active link in sidebar
            const navLink = document.querySelector(`.nav-links a[data-page="${page}"]`);
            if (navLink) {
                document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
                navLink.classList.add('active');
            }
            
            // Load the page
            loadPage(page);
        });
    });
}
