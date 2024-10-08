document.getElementById('smsForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener el valor del textarea
    const smsMessage = document.getElementById('smsMessage').value.trim();

    // Verificar si el mensaje no está vacío
    if (!smsMessage) {
        alert("El campo de mensaje no puede estar vacío.");
        return;
    }

    console.log("Mensaje enviado:", smsMessage);

    // Crear objeto JSON con el mensaje
    const data = {
        mensaje: smsMessage
    };

    // Enviar la solicitud POST a la API para analizar el mensaje
    fetch('https://smishguard-api-gateway.onrender.com/consultar-modelo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor: ' + response.status);
        }
        return response.json();
    })
    .then(result => {
        // Mostrar en la consola la respuesta completa que está devolviendo la API
        console.log("Respuesta de la API:", result);

        displayAnalysisResult(result);

        // Si el puntaje es >= 7 o ponderado >= 7, habilitar el botón para enviar el reporte
        if ((result.puntaje && result.puntaje >= 7) || (result.ponderado && result.ponderado >= 7)) {
            document.getElementById('sendReportButton').style.display = 'block'; // Mostrar el botón
            // Guardar el resultado del análisis y el mensaje analizado en una variable global para enviar el reporte después
            window.analysisResult = result;
            window.originalMessage = smsMessage; // Guardar el mensaje original introducido por el usuario
        }
    })
    .catch(error => {
        console.error('Error al consultar el mensaje:', error);
        document.getElementById('response').textContent = "Error al consultar el mensaje.";
    });
});

/**
 * Función para mostrar los resultados del análisis
 */
function displayAnalysisResult(result) {
    const analisisGptElement = document.getElementById('analisis_gpt');
    const analisisSmishguardElement = document.getElementById('analisis_smishguard');
    const enlaceSospechosoElement = document.getElementById('enlace_sospechoso');
    const mensajeAnalizadoElement = document.getElementById('mensaje_analizado');
    const puntajeValorElement = document.getElementById('puntaje_valor');

    console.log("Procesando los resultados del análisis:", result);

    // Manejar cuando el mensaje no está en la base de datos
    if (result.analisis_gpt !== undefined) {
        analisisGptElement.textContent = "Análisis GPT: " + result.analisis_gpt;
        analisisSmishguardElement.textContent = "Análisis SmishGuard: " + result.analisis_smishguard;
        enlaceSospechosoElement.innerHTML = `Enlace sospechoso: ${result.enlace}`;
        mensajeAnalizadoElement.textContent = "Mensaje Analizado: " + result.mensaje_analizado;
        puntajeValorElement.textContent = result.puntaje;
        puntajeValorElement.style.backgroundColor = getColorForPuntaje(result.puntaje);
    }
    // Manejar cuando el mensaje ya está en la base de datos
    else if (result.calificacion_gpt !== undefined) {
        analisisGptElement.textContent = "Análisis GPT: " + result.calificacion_gpt;
        analisisSmishguardElement.textContent = "Análisis SmishGuard: " + result.nivel_peligro;
        enlaceSospechosoElement.innerHTML = `Enlace sospechoso: ${result.url || 'No disponible'}`;
        mensajeAnalizadoElement.textContent = "Mensaje Analizado: " + result.justificacion_gpt;
        puntajeValorElement.textContent = result.ponderado;
        puntajeValorElement.style.backgroundColor = getColorForPuntaje(result.ponderado);
    } else {
        analisisGptElement.textContent = "Análisis GPT: No disponible";
        analisisSmishguardElement.textContent = "Análisis SmishGuard: No disponible";
        enlaceSospechosoElement.textContent = "Enlace sospechoso: No disponible";
        mensajeAnalizadoElement.textContent = "Mensaje Analizado: No disponible";
        puntajeValorElement.textContent = "No disponible";
    }

    document.getElementById('smsForm').style.display = 'none';
    document.getElementById('response').style.display = 'block';
}

/**
 * Función para enviar el reporte cuando el usuario presiona el botón
 */
function sendReport() {
    const result = window.analysisResult; // Usar el resultado guardado
    const originalMessage = window.originalMessage; // Usar el mensaje original que el usuario introdujo
    if (!result || !originalMessage) {
        alert('No hay análisis o mensaje para reportar.');
        return;
    }

    const data = {
        contenido: originalMessage, // Enviar el mensaje original, no el análisis
        url: result.enlace || result.url || 'No disponible',
        publicado: false,
        analisis: {
            calificacion_gpt: result.calificacion_gpt || result.analisis_gpt,
            ponderado: result.ponderado || result.puntaje,
            nivel_peligro: result.nivel_peligro || result.analisis_smishguard,
            justificacion_gpt: result.justificacion_gpt || result.analisis_gpt,
            fecha_analisis: new Date().toISOString()
        }
    };

    // Enviar la solicitud POST para guardar el mensaje reportado
    fetch('https://smishguard-api-gateway.onrender.com/guardar-mensaje-reportado', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            alert('Reporte enviado correctamente.');
            document.getElementById('sendReportButton').style.display = 'none'; // Ocultar el botón de reporte
        })
        .catch(error => {
            console.error('Error al enviar el reporte:', error);
            alert('Error al enviar el reporte.');
        });
}

/**
 * Función para obtener un color basado en el puntaje.
 * Verde (puntaje cerca de 0) a Rojo (puntaje cerca de 10).
 * @param {number} puntaje - El puntaje a evaluar.
 * @returns {string} - Código de color en formato HSL.
 */
function getColorForPuntaje(puntaje) {
    puntaje = Math.max(0, Math.min(puntaje, 10));
    const hue = 120 - (120 * puntaje / 10); // 0: verde, 10: rojo
    return `hsl(${hue}, 100%, 50%)`;
}

/**
 * Función para volver a enviar otro mensaje (resetea el formulario)
 */
function resetForm() {
    document.getElementById('smsForm').style.display = 'block';
    document.getElementById('response').style.display = 'none';
    document.getElementById('sendReportButton').style.display = 'none'; // Ocultar el botón al resetear

    // Reiniciar el contenido de los resultados
    const ids = ['analisis_gpt', 'analisis_smishguard', 'enlace_sospechoso', 'mensaje_analizado', 'puntaje_valor'];
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
        }
    });

    document.getElementById('smsMessage').value = '';
}
