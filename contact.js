// contact.js

// Form submission handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    // For now, just alert (replace with backend API later)
    alert(`Thank you, ${name}! Your message has been sent.`);
});
