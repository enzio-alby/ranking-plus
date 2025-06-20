document.addEventListener('DOMContentLoaded', function() {
    const fotoInput = document.getElementById('foto');
    const preview = document.getElementById('preview-foto');

    if (fotoInput) {
        fotoInput.addEventListener('change', function() {
            if (fotoInput.files && fotoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(fotoInput.files[0]);
            } else {
                preview.src = '#';
                preview.style.display = 'none';
            }
        });
    }
});