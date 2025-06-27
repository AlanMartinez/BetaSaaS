document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    const message = document.getElementById('form-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        if (email) {
            message.textContent = 'Thank you! You will be notified soon.';
            form.reset();
        } else {
            message.textContent = 'Please enter a valid email address.';
        }
    });
}); 