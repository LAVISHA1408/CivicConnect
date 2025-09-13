// Counter animation for stats section
function animateCounter(elementId, finalValue, duration) {
    let startTime = null;
    const element = document.getElementById(elementId);

    function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const value = Math.min(Math.floor(progress / duration * finalValue), finalValue);
        element.textContent = value;
        if (value < finalValue) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

// Animate all counters
document.addEventListener('DOMContentLoaded', () => {
    animateCounter('stat1', 1250, 2000);
    animateCounter('stat2', 3500, 2000);
    animateCounter('stat3', 12, 2000);
    animateCounter('stat4', 5, 2000);
});
