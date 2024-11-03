document.getElementById('smsForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const smsMessage = document.getElementById('smsMessage').value.trim();
    
    if (!smsMessage) {
        alert("El campo de mensaje no puede estar vacío.");
        return;
    }

    const data = { mensaje: smsMessage };

    fetch('https://smishguard-api-gateway.onrender.com/consultar-modelo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor: ' + response.status);
        return response.json();
    })
    .then(result => {
        displayAnalysisResult(result);

        if ((result.puntaje && result.puntaje >= 7) || (result.ponderado && result.ponderado >= 7)) {
            document.getElementById('sendReportButton').style.display = 'block';
            window.analysisResult = result;
            window.originalMessage = smsMessage;
        }
    })
    .catch(error => {
        console.error('Error al consultar el mensaje:', error);
        document.getElementById('response').textContent = "Error al consultar el mensaje.";
    });
});

function displayAnalysisResult(result) {
    document.getElementById('analisis_gpt').textContent = "Análisis GPT: " + result.analisis_gpt || "No disponible";
    document.getElementById('analisis_smishguard').textContent = "Análisis SmishGuard: " + result.analisis_smishguard || "No disponible";
    document.getElementById('enlace_sospechoso').textContent = "Enlace sospechoso: " + (result.enlace || "No disponible");
    document.getElementById('mensaje_analizado').textContent = "Mensaje Analizado: " + result.mensaje_analizado || "No disponible";
    document.getElementById('puntaje_valor').textContent = result.puntaje || "No disponible";
    document.getElementById('puntaje_valor').style.backgroundColor = getColorForPuntaje(result.puntaje || 0);

    document.getElementById('smsForm').style.display = 'none';
    document.getElementById('response').style.display = 'block';
}

function sendReport() {
    const result = window.analysisResult;
    const originalMessage = window.originalMessage;

    const data = {
        contenido: originalMessage,
        url: result.enlace || 'No disponible',
        publicado: false,
        analisis: {
            calificacion_gpt: result.calificacion_gpt || result.analisis_gpt,
            ponderado: result.ponderado || result.puntaje,
            nivel_peligro: result.nivel_peligro || result.analisis_smishguard,
            justificacion_gpt: result.justificacion_gpt || result.analisis_gpt,
            fecha_analisis: new Date().toISOString()
        }
    };

    fetch('https://smishguard-api-gateway.onrender.com/guardar-mensaje-para-publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        alert('Reporte enviado correctamente.');
        document.getElementById('sendReportButton').style.display = 'none';
    })
    .catch(error => {
        console.error('Error al enviar el reporte:', error);
        alert('Error al enviar el reporte.');
    });
}

function getColorForPuntaje(puntaje) {
    const hue = 120 - (120 * puntaje / 10);
    return `hsl(${hue}, 100%, 50%)`;
}

function resetForm() {
    document.getElementById('smsForm').style.display = 'block';
    document.getElementById('response').style.display = 'none';
    document.getElementById('sendReportButton').style.display = 'none';
    document.getElementById('smsMessage').value = '';
}
