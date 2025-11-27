/**
 * Clipboard Utility
 * Copies text to clipboard and shows feedback
 */

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<span class="icon">✓</span> Kopiert!';
        buttonElement.classList.add('success');

        // Show toast
        if (typeof toast !== 'undefined') {
            toast.success('IBAN in die Zwischenablage kopiert');
        }

        // Reset after 2 seconds
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('success');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        if (typeof toast !== 'undefined') {
            toast.error('Fehler beim Kopieren');
        }
    });
}
