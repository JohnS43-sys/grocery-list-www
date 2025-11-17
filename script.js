document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (checkbox.checked) {
            label.style.textDecoration = 'line-through';
            label.style.opacity = '0.6'; 
        } else {
            label.style.textDecoration = 'none';
            label.style.opacity = '1';
        }
})});

document.querySelector('button').addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        label.style.textDecoration = 'none';
        label.style.opacity = '1';
    });
});