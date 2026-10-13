# KUBI · Criaturas frutales

Avance del proyecto de Realidades Expandidas.
Presentado por Nicolás Sánchez.

## El planteamiento actualizado

KUBI es una marca ficticia de gomitas con forma de criaturas frutales. El nombre se conserva como nombre de marca; deja de describir una forma cúbica. El lema es «Pequeños bocados. Grandes mundos».

FRI representa la fresa: cuerpo torneado, semillas, corona de hojas, ojos brillantes, mejillas y extremidades. MAKO representa el mango: cuerpo ovalado, tallo, hoja, panza y pecas. UMI representa la uva: racimo, zarcillo, hoja y panza lavanda. Los modelos se construyeron específicamente para este proyecto con geometrías de Three.js. No se utilizan personajes ni modelos descargados.

Al mostrar la tarjeta aparece una isla botánica con los tres personajes, pedestales y pequeñas flores. Los personajes tienen movimiento suave y pueden verse desde diferentes ángulos.

## Qué debes abrir

- **app.json:** proyecto editable para abrir en el editor de Three.js. Contiene la escena, cámara, iluminación, geometrías, materiales y un script de registro AR y animación. Puedes seleccionar cada personaje por su nombre.
- **index.html:** aplicación con pantalla de inicio, vista 3D, reconocimiento de tarjeta, tres diálogos, sonidos y filtro facial adicional. Se sirve desde una web con HTTPS, por ejemplo tu publicación en Vercel.
- **Tarjeta_KUBI_Imprimir.pdf:** tarjeta de 165 × 100 mm. Conserva la proporción 1.65:1 del plano de la base del profesor. No se recibió una medida física obligatoria; esta medida es la propuesta de impresión.
- **assets/marker/target.png:** la misma tarjeta en imagen.
- **assets/marker/targets.mind:** datos de reconocimiento ya compilados para esa tarjeta exacta.

## Demostración de hoy

1. Abre app.json en Three.js como proyecto. Para ver la animación, utiliza la función de reproducción del editor.
2. Publica el contenido completo de esta carpeta, sin modificar la estructura. index.html debe quedar en la raíz de tu publicación.
3. Abre la web en Chrome con HTTPS y permite la cámara.
4. Muestra la tarjeta completa, impresa o en otra pantalla, con buena luz y sin reflejos. No la cambies ni la recortes. Si la muestras en una segunda pantalla, evita saturar el brillo.
5. Al reconocerla se activan Producto, Sabores y Experiencia. Cada botón abre un diálogo distinto.
6. «Girar escena» cambia el ángulo. «Sonido» permite silenciar los efectos.
7. «Probar filtro facial» detiene la lectura de tarjeta y abre una experiencia separada con personajes en las mejillas. Puedes elegir el sabor manualmente. Al cerrar, vuelve al reconocimiento de tarjeta. No utiliza detección de sonrisa en este avance.

No basta con hacer doble clic en index.html: una ruta file:// no permite que todos los módulos y archivos se carguen correctamente. Usa la publicación HTTPS o un servidor local.

## Funciones incluidas

- Modelado original de tres figuras elaboradas.
- Animación suave de los cuerpos y brazos.
- Tarjeta propia y datos de seguimiento correspondientes.
- Interfaz de inicio con marca, colores y textos del proyecto.
- Tres botones informativos que aparecen al detectar la tarjeta.
- Diálogos con el producto, los sabores y el funcionamiento de la experiencia.
- Efectos sonoros originales generados con Web Audio, sin archivos de audio externos.
- Vista previa en 3D sin cámara, claramente diferenciada de la realidad aumentada.
- Filtro facial adicional con selección manual de sabor.

## Alcance de la validación

Se verificó la carga de la escena en navegador, la vista 3D, los tres diálogos y el giro. El reconocimiento de la tarjeta se probó con una cámara simulada alimentada con la imagen KUBI; no se sustituyó la detección por un botón de simulación. El uso de una tarjeta física y la publicación en Vercel deben verificarse en tu computador antes de presentarlo. El filtro facial debe revisarse además con un rostro real y buena iluminación.

## Archivos técnicos

La base de reproducción y el controlador parten del ZIP de clase. Three.js y MindAR proporcionan el renderizado y seguimiento; MediaPipe proporciona el seguimiento facial. Se han incluido los archivos necesarios para evitar descargas de modelos durante la demostración.

La escena se puede regenerar desde js/design.js y build.html. Son archivos auxiliares de autoría; no necesitas utilizarlos para entregar. El código de interfaz está en js/main.js y los estilos están en css/.

Si posteriormente cambias la tarjeta, deberás recompilar targets.mind: los datos actuales corresponden exclusivamente a target.png.

## Autoría y recursos

Diseño KUBI, tarjeta, personajes, composición y código específico: elaborados para el proyecto con asistencia de ChatGPT. Se debe respetar cualquier indicación del docente sobre declaración de herramientas de apoyo.

Tecnologías y recursos de terceros: Three.js (https://threejs.org/), MindAR (https://github.com/hiukim/mind-ar-js), MediaPipe (https://ai.google.dev/edge/mediapipe). Los personajes no proceden de esas bibliotecas; son el contenido propio de esta propuesta.
