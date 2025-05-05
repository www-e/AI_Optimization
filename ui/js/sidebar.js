// Sidebar functionality
export function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    
    // Toggle sidebar on menu button click
    menuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 576) {
            // On mobile, toggle the expanded class
            sidebar.classList.toggle('expanded');
        } else {
            // On desktop, toggle the collapsed class
            sidebar.classList.toggle('collapsed');
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 576 && 
            !sidebar.contains(event.target) && 
            event.target !== menuToggle) {
            sidebar.classList.remove('expanded');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 576) {
            sidebar.classList.remove('expanded');
        }
    });
    
    // Add entrance animations to sidebar items
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateX(-20px)';
        link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            link.style.opacity = '1';
            link.style.transform = 'translateX(0)';
        }, 100 + (index * 50));
    });
}
