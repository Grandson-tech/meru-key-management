document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                successMessage.textContent = 'Password reset link has been sent to your email.';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                
                // Clear the form
                resetPasswordForm.reset();
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Failed to send reset link';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred while processing your request';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            console.error('Reset password error:', error);
        }
    });
}); 