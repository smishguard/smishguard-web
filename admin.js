fetch('https://smishguard-api-gateway.onrender.com/mensajes-para-publicar')
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener los mensajes: ' + response.status);
        return response.json();
    })
    .then(data => {
        const mensajesReportados = document.getElementById('mensajesReportados');
        mensajesReportados.innerHTML = '';

        data.documentos.forEach(doc => {
            if (!doc.publicado) {
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
    .catch(error => console.error('Error al cargar los mensajes reportados:', error));

function publicarMensaje(id, contenido) {
    const mensajeSinEnlace = contenido.replace(/https?:\/\/[^\s]+/g, '[ENLACE REMOVIDO]');

    fetch('https://smishguard-api-gateway.onrender.com/publicar-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: mensajeSinEnlace })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al publicar el mensaje: ' + response.status);
        return response.json();
    })
    .then(() => {
        fetch(`https://smishguard-api-gateway.onrender.com/actualizar-publicado/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicado: true })
        })
        .then(() => location.reload())
        .catch(error => console.error('Error al actualizar el estado de publicado:', error));
    })
    .catch(error => console.error('Error al publicar el mensaje en Twitter:', error));
}
