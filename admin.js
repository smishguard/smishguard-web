// Obtener los mensajes reportados que no han sido publicados
fetch('https://smishguard-api-gateway.onrender.com/mensajes-reportados')
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener los mensajes: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        const mensajesReportados = document.getElementById('mensajesReportados');
        mensajesReportados.innerHTML = ''; // Limpiar la lista anterior

        // Iterar sobre los mensajes obtenidos
        data.documentos.forEach(doc => {
            if (!doc.publicado) { // Mostrar solo los mensajes no publicados
                const div = document.createElement('div');
                div.classList.add('mensaje-reportado');
                div.innerHTML = `
                    <p><strong>Mensaje:</strong> ${doc.contenido}</p>
                    <p><strong>Análisis GPT:</strong> ${doc.analisis.calificacion_gpt}</p>
                    <p><strong>Puntaje:</strong> ${doc.analisis.ponderado}</p>
                    <button onclick="publicarMensaje('${doc._id}', \`${doc.contenido}\`)">Publicar</button>
                    <hr>
                `;
                mensajesReportados.appendChild(div);
            }
        });
    })
    .catch(error => {
        console.error('Error al cargar los mensajes reportados:', error);
    });

/**
 * Función para publicar un mensaje en Twitter y actualizar su estado
 */
function publicarMensaje(id, contenido) {
    const mensajeSinEnlace = contenido.replace(/https?:\/\/[^\s]+/g, '[ENLACE REMOVIDO]');

    fetch('https://smishguard-api-gateway.onrender.com/publicar-tweet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mensaje: mensajeSinEnlace })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al publicar el mensaje: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            alert('Mensaje publicado en Twitter exitosamente.');

            // Actualizar el estado de "publicado"
            fetch(`https://smishguard-api-gateway.onrender.com/actualizar-publicado/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publicado: true })
            })
                .then(response => response.json())
                .then(result => {
                    console.log('El mensaje ha sido marcado como publicado:', result);
                    location.reload(); // Recargar la página para actualizar la lista
                })
                .catch(error => {
                    console.error('Error al actualizar el estado de publicado:', error);
                });
        })
        .catch(error => {
            console.error('Error al publicar el mensaje en Twitter:', error);
        });
}
