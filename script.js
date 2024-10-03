document.getElementById('smsForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener el valor del textarea
    const smsMessage = document.getElementById('smsMessage').value.trim();

    // Verificar si el mensaje no está vacío
    if (!smsMessage) {
        alert("El campo de mensaje no puede estar vacío.");
        return;
    }

    // Mostrar el valor capturado en la consola (para depuración)
    console.log("Mensaje enviado: ", smsMessage);

    // Crear objeto JSON con el mensaje
    const data = {
        mensaje: smsMessage
    };

    console.log("Payload enviado:", data); // Verificar si el mensaje está correctamente estructurado

    // Enviar la solicitud POST a la API
    fetch('https://smishguard-api-gateway.onrender.com/consultar-modelo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                // Si el servidor devuelve un error (como 500), lanzar error
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            // Intentar convertir la respuesta a JSON solo si es posible
            return response.json();
        })
        .then(result => {
            // Verificar que la API devuelve los datos esperados
            console.log("Respuesta del servidor:", result);

            // Verificar y mostrar el resultado de analisis_gpt
            if (result.analisis_gpt && document.getElementById('analisis_gpt')) {
                document.getElementById('analisis_gpt').textContent = "Análisis GPT: " + result.analisis_gpt;
            }

            // Verificar y mostrar el resultado de analisis_smishguard
            if (result.analisis_smishguard && document.getElementById('analisis_smishguard')) {
                document.getElementById('analisis_smishguard').textContent = "Análisis SmishGuard: " + result.analisis_smishguard;
            }

            // Verificar y mostrar el enlace sospechoso
            if (result.enlace && document.getElementById('enlace_sospechoso')) {
                document.getElementById('enlace_sospechoso').innerHTML = "Enlace sospechoso: <a href=\"" + result.enlace + "\" target=\"_blank\">" + result.enlace + "</a>";
            }

            // Mostrar el mensaje analizado
            if (result.mensaje_analizado && document.getElementById('mensaje_analizado')) {
                document.getElementById('mensaje_analizado').textContent = "Mensaje Analizado: " + result.mensaje_analizado;
            }

            // Verificar y mostrar el puntaje
            if (result.puntaje !== undefined && result.puntaje !== null && document.getElementById('puntaje_valor')) {
                const puntaje = parseFloat(result.puntaje);
                const puntajeElemento = document.getElementById('puntaje_valor');
                puntajeElemento.textContent = puntaje;

                // Asignar color basado en el puntaje
                puntajeElemento.style.backgroundColor = getColorForPuntaje(puntaje);
                
                // Habilitar el botón si el puntaje es mayor o igual a 7
                const btn = document.getElementById('sendWithoutLinkButton');
                if (btn && puntaje >= 7) {
                    btn.style.display = 'block'; // Mostrar el botón si puntaje >= 7
                } else if (btn) {
                    btn.style.display = 'none'; // Ocultar el botón si puntaje < 7
                }
            }

            // Mostrar el resultado y ocultar el formulario
            document.getElementById('smsForm').style.display = 'none';
            document.getElementById('response').style.display = 'block';
        })
        .catch(error => {
            console.error('Error al consultar el mensaje:', error);
            const responseElement = document.getElementById('response');
            if (responseElement) {
                responseElement.textContent = "Error al consultar el mensaje.";
            }
        });
});

/**
 * Función para obtener un color basado en el puntaje.
 * Verde (puntaje cerca de 0) a Rojo (puntaje cerca de 10).
 * @param {number} puntaje - El puntaje a evaluar.
 * @returns {string} - Código de color en formato HSL.
 */
function getColorForPuntaje(puntaje) {
    // Asegurar que el puntaje está entre 0 y 10
    puntaje = Math.max(0, Math.min(puntaje, 10));

    // Calcular el tono (hue) desde verde (120) hasta rojo (0)
    const hue = 120 - (120 * puntaje / 10); // 0: verde, 10: rojo

    return `hsl(${hue}, 100%, 50%)`;
}

// Función para enviar el SMS sin el enlace
function sendSmsWithoutLink() {
    const smsMessage = document.getElementById('smsMessage').value;

    // Eliminar enlaces (URL) del mensaje usando una expresión regular
    const smsWithoutLink = smsMessage.replace(/https?:\/\/[^\s]+/g, '[ENLACE REMOVIDO]');

    // Crear objeto JSON para enviar al servicio de tweet
    const data = {
        sms: smsWithoutLink
    };

    // Enviar la solicitud POST al servicio de tweet
    fetch('https://smishguard-twitter-ms.onrender.com/tweet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            alert('El mensaje sin enlace ha sido enviado correctamente.');
        })
        .catch(error => {
            console.error('Error al enviar el mensaje sin enlace:', error);
            alert('Error al enviar el mensaje sin enlace.');
        });
}

// Función para volver a enviar otro mensaje (resetea el formulario)
function resetForm() {
    document.getElementById('smsForm').style.display = 'block';
    document.getElementById('response').style.display = 'none';
    const sendButton = document.getElementById('sendWithoutLinkButton');
    if (sendButton) {
        sendButton.style.display = 'none'; // Ocultar el botón al resetear
    }

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
