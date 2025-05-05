// Main JavaScript for Hybrid AI Optimization UI
import { loadPage } from './router.js';
import { setupSidebar } from './sidebar.js';
import { runAllAlgorithms } from './algorithms/compare.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar functionality
    setupSidebar();
    
    // Set up navigation
    setupNavigation();
    
    // Load the default page (home)
    loadPage('home');
    
    // Set up run all button
    document.getElementById('run-all-btn').addEventListener('click', () => {
        // First navigate to the compare page
        loadPage('compare');
        // Then run all algorithms
        setTimeout(() => runAllAlgorithms(), 100);
    });
});

// Set up navigation event listeners
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the page to load from the data-page attribute
            const page = link.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Load the page
            loadPage(page);
        });
    });
}
