// ==UserScript==
// @name         Auto-Fill Empleo Local (Ollama)
// @namespace   Violentmonkey Scripts
// @version      1.0.0
// @description  Rellena formularios de empleo con Ollama local
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @require      file://C:\Users\phili\Desktop\codigoboludo\JobAutocomplete\datos_mios.js
// ==/UserScript==

(function() {
    'use strict';

    // Verificación defensiva por si el archivo no cargó
    const profile = window.MY_PROFILE;
    if (!profile) {
        console.error("No se encontró window.MY_PROFILE. Revisa la ruta del @require.");
        return;
    }

    // Botón flotante
    const btn = document.createElement('button');
    btn.innerText = 'Rellenar Automaticamente';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:12px 16px;background:#10a37f;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
    document.body.appendChild(btn);

    btn.onclick = async () => {
        btn.innerText = 'Analizando...';
        btn.disabled = true;

        try {
            const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea'));
            
            const fieldSummary = inputs.map((input, index) => {
                const label = document.querySelector(`label[for="${input.id}"]`)?.innerText 
                              || input.getAttribute('aria-label') 
                              || input.placeholder 
                              || input.name 
                              || input.id;
                return {
                    temp_id: index,
                    type: input.type || 'text',
                    descriptor: (label || 'campo sin etiqueta').trim()
                };
            }).filter(f => f.descriptor.length > 0);

            const prompt = `
Eres un asistente que rellena formularios de empleo con precisión.

DATOS DEL CANDIDATO:
${JSON.stringify(profile, null, 2)}

CAMPOS DETECTADOS EN EL FORMULARIO (índice y descripción):
${JSON.stringify(fieldSummary, null, 2)}

INSTRUCCIONES CLAVE:
1. Para datos personales o de contacto, usa la sección "personal".
2. Si el formulario pide un puesto, empresa, título o fecha de empleo/estudio sin especificar cuál, usa SIEMPRE el más reciente (el primer elemento de "experience" o "education").
3. Si el campo pide un resumen o carta, usa "summary".
4. Si el campo pregunta por visados, idiomas, salario o preaviso, busca en "screeningQuestions".
5. Si un campo no aplica, es opcional o no encuentras correspondencia clara en los datos, NO lo incluyas en el JSON.
6. Devuelve EXCLUSIVAMENTE un mapa JSON donde cada clave sea el 'temp_id' (en string) y el valor sea el texto exacto a escribir.

Ejemplo de respuesta esperada:
{
  "0": "Carlos",
  "1": "García",
  "4": "carlos.garcia@email.com",
  "8": "Ingeniero de Software / IA"
}
`;

            GM_xmlhttpRequest({
                method: "POST",
                url: "http://localhost:11434/api/generate",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    model: "llama3.2:1b",
                    prompt: prompt,
                    stream: false,
                    format: "json"
                }),
                onload: (response) => {
                    const resData = JSON.parse(response.responseText);
                    const filledData = JSON.parse(resData.response);

                    for (const [idStr, value] of Object.entries(filledData)) {
                        const targetInput = inputs[parseInt(idStr, 10)];
                        if (targetInput && value) {
                            setNativeValue(targetInput, value);
                        }
                    }

                    btn.innerText = '¡Listo!';
                    setTimeout(() => { btn.innerText = 'Rellenar Automaticamente'; btn.disabled = false; }, 2500);
                },
                onerror: () => {
                    alert("Error conectando con Ollama en localhost:11434");
                    btn.innerText = 'Error';
                    btn.disabled = false;
                }
            });

        } catch (err) {
            console.error(err);
            btn.innerText = 'Error';
            btn.disabled = false;
        }
    };

    function setNativeValue(element, value) {
        const lastValue = element.value;
        element.value = value;
        const tracker = element._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
})();