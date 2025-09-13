document.addEventListener('DOMContentLoaded', function() {
    // Status update buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const statusCell = row.querySelector('td:nth-child(6)');
            
            if (this.classList.contains('btn-acknowledge')) {
                statusCell.innerHTML = '<span class="status-badge status-acknowledged">Acknowledged</span>';
            } else if (this.classList.contains('btn-working')) {
                statusCell.innerHTML = '<span class="status-badge status-working">Working</span>';
            } else if (this.classList.contains('btn-resolve')) {
                statusCell.innerHTML = '<span class="status-badge status-resolved">Resolved</span>';
            }
            
            // Remove the clicked button
            this.remove();
        });
    });
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // In a real app, this would filter the table
            console.log('Filter by:', this.value);
        });
    });
    
    // Message buttons
    const messageButtons = document.querySelectorAll('.message-btn');
    messageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('btn-archive')) {
                this.closest('.message-card').style.opacity = '0.5';
            }
        });
    });
});
